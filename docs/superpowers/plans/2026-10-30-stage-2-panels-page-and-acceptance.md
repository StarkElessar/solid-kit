# solid-kit, этап 2, часть 4: страница «Панели» и приёмка — план реализации

> **Для исполнителей:** ОБЯЗАТЕЛЬНЫЙ суб-скил: superpowers:executing-plans (или subagent-driven-development). Шаги отмечены чекбоксами (`- [ ]`).

**Цель:** закрыть критерии готовности этапа 2 (спек этапа 2, раздел 8): на странице «Панели» добавить сценарии (б), (в), (д) критерия 6 зонтичного спека на Popover (и мини-вариант (а) для ContextMenu в ячейке таблицы), счётчики для приёмки Esc «Popover с формой внутри Dialog, `onOpenChange(false)` диалога ровно один раз», геометрическую проверку критерия 7 для тела Dialog; прогнать приёмку в Chrome, страницу «Темы» и матрицу; написать итоги этапа. Тег `v0.3.0` в плане не ставится (решение владельца).

**Архитектура:** код компонентов не меняется. Новые демонстрации `playground/src/demo-popover-scenarios.tsx`, проверки `playground/src/popover-checks.ts`, общие помощники проверок `playground/src/check-helpers.ts` (`frames`, `required`, `closeWithEscape`; старые файлы проверок переходят на них). Проверки открывают панели кликом по инициатору и меряют геометрию, нажатие по подложке, hit-test и события; настоящие клавиши (Esc, Enter в форме) проверяются вручную в Chrome.

**Стек:** как в частях 1–3.

**Спеки:** `docs/superpowers/specs/2026-10-29-stage-2-overlays-design.md` (раздел 8, 10–14), `docs/superpowers/specs/2026-10-28-solid-kit-umbrella-design.md` (раздел 12, критерии 5, 6, 7; раздел 13).

## Global Constraints

- Репозиторий публичный: ни ключей, ни токенов, ни `.env*` в коммитах. Не делать `git push`, не ставить тег `v0.3.0` и никакие другие теги (владелец ставит сам после проверки), не добавлять `LICENSE`, не менять git-идентичность, не переписывать историю (никаких `--amend`/`rebase`).
- Один класс — один файл; kebab-case; именованные экспорты; пропсы не деструктурируются (`splitProps`/`mergeProps`). Один компонент на файл.
- Стиль: ESLint (табы, одинарные кавычки, без висячих запятых, Stroustrup, max-len 140 с табами по 4), Stylelint (4 пробела, двойные кавычки, порядок свойств; `pnpm exec stylelint --fix <файл>`; в CSS playground литералы цветов тоже запрещены, брать токены). Перед каждым коммитом `pnpm check` зелёный; коммитить только после проверки кода возврата (не цепочкой через `;`).
- Если `pnpm` зависает на прокси: `env -u HTTPS_PROXY -u HTTP_PROXY -u https_proxy -u http_proxy pnpm ...`.
- Коммиты оканчиваются трейлерами: `export TRAILERS=$'Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_017cEinKKFDiYmGrLaaKPqZu'`, затем `git commit -m "msg" -m "$TRAILERS"`.
- Dev-серверы убивать только по PID после проверки cwd (`lsof -a -p <PID> -d cwd -Fn`), никогда `pkill`.
- Браузерные проверки в Chrome; Esc, Enter и клики настоящие (`computer key`, `left_click`), синтетические события не заменяют их; после смены темы ждать 1,5–2 с; Firefox и Safari не проверяются.
- Начало плана: `git status` чистый, `pnpm check` зелёный (после части 3 тестов 436).

---

### Task 1: Общие помощники проверок

**Files:**
- Create: `playground/src/check-helpers.ts`
- Modify: `playground/src/dialog-checks.ts`, `playground/src/context-menu-checks.ts`

**Interfaces:**
- Produces: `frames(count?: number): Promise<void>` (по умолчанию 3 кадра), `required(root: ParentNode, selector: string): HTMLElement`, `closeWithEscape(): void`.

- [ ] **Step 1: Помощники**

Создать `playground/src/check-helpers.ts`:

```ts
/** Ждёт `count` кадров отрисовки: панели в top layer и позиция от Floating UI появляются после микрозадач и кадра. */
export async function frames(count = 3): Promise<void> {
	for (let index = 0; index < count; index++) {
		await new Promise<void>((resolve) => {
			requestAnimationFrame(() => {
				resolve();
			});
		});
	}
}

/** Элемент страницы по селектору; отсутствие это ошибка стенда, а не провал проверки. */
export function required(root: ParentNode, selector: string): HTMLElement {
	const found = root.querySelector<HTMLElement>(selector);
	if (!found) {
		throw new Error(`Playground element is missing: ${selector}`);
	}
	return found;
}

/** Синтетический Esc для стека слоёв: годится, чтобы закрыть панель между проверками (приёмка Esc идёт настоящими клавишами). */
export function closeWithEscape(): void {
	document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
}
```

- [ ] **Step 2: Перевести старые проверки**

В `playground/src/context-menu-checks.ts` удалить локальные `frames`, `required`, `closeWithEscape` и добавить `import { closeWithEscape, frames, required } from './check-helpers';` (после импортов `../../src/...`, перед `./theme-checks`). В `playground/src/dialog-checks.ts` удалить локальные `frames` и `required` (там `required` возвращает `HTMLElement` с дополнительной проверкой для `<dialog>`: оставить проверку `instanceof HTMLDialogElement` в месте использования, она там уже есть) и добавить `import { frames, required } from './check-helpers';`.

- [ ] **Step 3: Проверка и коммит**

Run: `pnpm check` — зелёный, число тестов прежнее (436).

```bash
git add -A && git commit -m "refactor(playground): общие помощники проверок" -m "$TRAILERS"
```

---

### Task 2: Демонстрации сценариев и счётчики приёмки Esc

**Files:**
- Create: `playground/src/demo-popover-scenarios.tsx`
- Modify: `playground/src/demo-dialogs.tsx`, `playground/src/panels-page.tsx`, `playground/src/playground.css`

**Interfaces:**
- Consumes: `Popover`, `ContextMenu`, `Button`, `Input`, `Dialog`.
- Produces: на странице атрибуты, на которые опираются проверки Task 3: `[data-scenario="b"]`, `[data-scenario="c-label"]`, `[data-scenario="c-card"]`, `[data-scenario="c-form"]`, `[data-scenario="d-<transform|filter|contain|overflow>"]`, `[data-scenario="a-cell"]`; внутри каждого `[data-scenario-trigger]`, панель с `[data-panel-text]`, `[data-panel-button]`, `[data-panel-input]`; счётчики `[data-counter="…"]`.

- [ ] **Step 1: Демонстрации сценариев**

Создать `playground/src/demo-popover-scenarios.tsx`:

```tsx
import { Button } from '@stark/solid-kit/button';
import { ContextMenu } from '@stark/solid-kit/context-menu';
import { Input } from '@stark/solid-kit/input';
import { Popover } from '@stark/solid-kit/popover';
import { createSignal, For, type JSX } from 'solid-js';

const CLIPPERS: ReadonlyArray<readonly [name: string, style: JSX.CSSProperties]> = [
	['transform', { transform: 'translateZ(0)' }],
	['filter', { filter: 'grayscale(0)' }],
	['contain', { contain: 'paint' }],
	['overflow', { overflow: 'hidden' }]
];

/** Содержимое панели для проверок: текст (клик и двойной клик), кнопка (hit-test) и счётчик нажатий кнопки. */
function PanelBody(props: { onPress?: () => void }): JSX.Element {
	return (
		<div class='panel-body'>
			<span data-panel-text>Текст в панели</span>
			<Button data-panel-button onClick={() => props.onPress?.()}>Кнопка в панели</Button>
		</div>
	);
}

/** Сценарии (б), (в), (д) критерия 6 на Popover и мини-вариант (а) на ContextMenu: панель не зависит от окружения инициатора. */
export function DemoPopoverScenarios(): JSX.Element {
	const [pressed, setPressed] = createSignal(0);
	const [cardClicks, setCardClicks] = createSignal(0);
	const [cardDoubleClicks, setCardDoubleClicks] = createSignal(0);
	const [submits, setSubmits] = createSignal(0);

	return (
		<div class='scenario-demos'>
			<div class='scenario' data-scenario='b' style={{ 'pointer-events': 'none' }}>
				<span>(б) предок с pointer-events: none; сам инициатор включён обратно</span>
				<Popover.Root>
					<Popover.Trigger data-scenario-trigger style={{ 'pointer-events': 'auto' }}>Инициатор под pointer-events: none</Popover.Trigger>
					<Popover.Content>
						<PanelBody onPress={() => setPressed((count) => count + 1)}/>
					</Popover.Content>
				</Popover.Root>
				<output data-counter='b-pressed'>нажатий кнопки в панели: {pressed()}</output>
			</div>

			<label class='scenario' data-scenario='c-label'>
				<span>(в) Popover внутри label: клик по содержимому панели не переключает флажок</span>
				<input type='checkbox' data-label-input/>
				<Popover.Root>
					<Popover.Trigger data-scenario-trigger>Панель внутри label</Popover.Trigger>
					<Popover.Content>
						<PanelBody/>
					</Popover.Content>
				</Popover.Root>
			</label>

			<div
				class='scenario'
				data-scenario='c-card'
				onClick={() => setCardClicks((count) => count + 1)}
				onDblClick={() => setCardDoubleClicks((count) => count + 1)}
			>
				<span>(в) Popover внутри кликабельной карточки: клик и двойной клик по панели карточку не задевают</span>
				<Popover.Root>
					<Popover.Trigger data-scenario-trigger>Панель внутри карточки</Popover.Trigger>
					<Popover.Content>
						<PanelBody/>
					</Popover.Content>
				</Popover.Root>
				<output data-counter='c-card'>
					клики карточки: <span data-counter='c-card-clicks'>{cardClicks()}</span>, двойные:
					<span data-counter='c-card-double'>{cardDoubleClicks()}</span>
				</output>
			</div>

			<form
				class='scenario'
				data-scenario='c-form'
				onSubmit={(event) => {
					event.preventDefault();
					setSubmits((count) => count + 1);
				}}
			>
				<span>(в) Popover внутри form: Enter в поле панели не отправляет чужую форму</span>
				<Popover.Root>
					<Popover.Trigger data-scenario-trigger>Панель внутри формы</Popover.Trigger>
					<Popover.Content>
						<Input data-panel-input aria-label='Поле в панели формы' placeholder='Нажмите Enter'/>
					</Popover.Content>
				</Popover.Root>
				<output data-counter='c-submits'>отправок формы: <span data-counter='c-submits-count'>{submits()}</span></output>
			</form>

			<div class='clippers'>
				<For each={CLIPPERS}>
					{([name, style]) => (
						<div class='clipper' data-scenario={`d-${name}`} style={style}>
							<span>(д) {name}</span>
							<Popover.Root>
								<Popover.Trigger data-scenario-trigger>Панель из {name}</Popover.Trigger>
								<Popover.Content style={{ 'min-block-size': '140px' }}>
									<PanelBody/>
								</Popover.Content>
							</Popover.Root>
						</div>
					)}
				</For>
			</div>

			<table class='cell-table'>
				<tbody>
					<tr>
						<td data-scenario='a-cell'>
							<ContextMenu.Root>
								<ContextMenu.Trigger data-scenario-area>Ячейка: text-align right, nowrap, overflow hidden</ContextMenu.Trigger>
								<ContextMenu.Content data-scenario-menu aria-label='Меню ячейки'>
									<ContextMenu.Item>Скопировать значение ячейки целиком</ContextMenu.Item>
									<ContextMenu.Item>Фильтровать по значению</ContextMenu.Item>
								</ContextMenu.Content>
							</ContextMenu.Root>
						</td>
					</tr>
				</tbody>
			</table>
		</div>
	);
}
```

- [ ] **Step 2: Счётчики приёмки Esc в диалоге с Popover**

В `playground/src/demo-dialogs.tsx`:
- импорт `createSignal` из `solid-js` (`import { createSignal, For, type JSX } from 'solid-js';`);
- в начале `DemoDialogs` добавить:

```tsx
	const [closes, setCloses] = createSignal(0);
	const [formSubmits, setFormSubmits] = createSignal(0);
```

- второй `Dialog.Root` заменить на `<Dialog.Root onOpenChange={(open) => { if (!open) setCloses((count) => count + 1); }}>` и содержимое `Popover.Content` на форму:

```tsx
							<Popover.Content>
								<form
									data-popover-form
									onSubmit={(event) => {
										event.preventDefault();
										setFormSubmits((count) => count + 1);
									}}
								>
									<Input aria-label='Поле в панели' placeholder='Поле в панели'/>
									<Button type='submit'>Сохранить</Button>
								</form>
							</Popover.Content>
```

- после последнего `</Dialog.Root>` перед закрывающим `</div>` добавить:

```tsx
			<output data-counter='dialog-closes'>
				onOpenChange(false) диалога с панелью: <span data-counter='dialog-closes-count'>{closes()}</span>; отправок формы панели:
				<span data-counter='popover-form-submits'>{formSubmits()}</span>
			</output>
```

- [ ] **Step 3: Страница и стили**

В `playground/src/panels-page.tsx`: импорт `import { DemoPopoverScenarios } from './demo-popover-scenarios';` (в алфавитном порядке), после секции `2. ContextMenu` вставить:

```tsx
			<section>
				<h2>3. Сценарии панелей (критерий 6: б, в, д)</h2>
				<p>
					Ручная приёмка: Enter в поле панели внутри формы не увеличивает счётчик отправок; клик по кнопке в панели под предком с
					pointer-events: none увеличивает счётчик нажатий; панели (д) не обрезаны и стоят у якоря; Esc в диалоге с Popover закрывает
					сначала панель, потом диалог, счётчик onOpenChange(false) диалога равен 1.
				</p>
				<DemoPopoverScenarios/>
			</section>
```

и заголовок `3. Проверки` заменить на `4. Проверки`; комментарий над компонентом: `Сейчас: Dialog, ContextMenu и сценарии Popover.`

В `playground/src/playground.css` после `.menu-area` добавить:

```css
.scenario-demos {
    display: flex;
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
}

.scenario {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;

    box-sizing: border-box;
    inline-size: min(100%, 640px);
    padding: 12px;
    border: 1px dashed var(--s-kit-color-border);
    border-radius: var(--s-kit-radius);
}

.clippers {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
}

/* низкий контейнер с инициатором у нижнего края: панель обязана выйти за его границы */
.clipper {
    display: flex;
    flex-direction: column;
    gap: 8px;
    justify-content: flex-end;

    box-sizing: border-box;
    inline-size: 220px;
    block-size: 96px;
    padding: 8px;
    border: 1px solid var(--s-kit-color-border);
    border-radius: var(--s-kit-radius);
}

.panel-body {
    display: flex;
    gap: 8px;
    align-items: center;
}

.cell-table {
    table-layout: fixed;
    inline-size: 200px;
    border: 1px solid var(--s-kit-color-border);
}

.cell-table td {
    overflow: hidden;

    padding: 8px;

    text-align: right;
    white-space: nowrap;
}
```

- [ ] **Step 4: Проверка и коммит**

Run: `pnpm exec stylelint --fix playground/src/playground.css && pnpm check` — зелёный.

```bash
git add -A && git commit -m "feat(playground): сценарии б, в, д и счётчики приёмки Esc на странице «Панели»" -m "$TRAILERS"
```

---

### Task 3: Проверки сценариев и геометрия тела Dialog

**Files:**
- Create: `playground/src/popover-checks.ts`
- Modify: `playground/src/dialog-checks.ts`, `playground/src/panels-page.tsx`

**Interfaces:**
- Consumes: `check-helpers`, атрибуты Task 2.
- Produces: `runPopoverScenarioChecks(page): Promise<CheckResult[]>`.

- [ ] **Step 1: Проверки**

Создать `playground/src/popover-checks.ts`:

```ts
import { closeWithEscape, frames, required } from './check-helpers';
import type { CheckResult } from './theme-checks';

function centerOf(element: Element): { x: number; y: number } {
	const rect = element.getBoundingClientRect();
	return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

function mouse(target: Element, type: 'click' | 'dblclick'): void {
	target.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true }));
}

/** Открывает панель инициатора сценария кликом и возвращает панель (она связана с инициатором через `aria-controls`). */
async function openPanel(trigger: HTMLElement): Promise<HTMLElement> {
	trigger.scrollIntoView({ behavior: 'instant', block: 'center' });
	trigger.focus();
	trigger.click();
	await frames();
	const panel = document.getElementById(trigger.getAttribute('aria-controls') ?? '');
	if (!panel) {
		throw new Error('Panel of the scenario trigger is not in the DOM');
	}
	return panel;
}

async function closePanel(): Promise<void> {
	closeWithEscape();
	await frames();
}

function number(element: HTMLElement): number {
	return Number.parseInt(element.textContent, 10);
}

/**
 * Сценарии (б), (в), (д) критерия 6 на Popover и мини-вариант (а) на ContextMenu (спек этапа 2, раздел 8). Меряется то, что можно
 * измерить без настоящих клавиш: hit-test, события, геометрия, вычисленные стили. Enter в форме и Esc в диалоге проверяются вручную.
 */
export async function runPopoverScenarioChecks(page: HTMLElement): Promise<CheckResult[]> {
	const results: CheckResult[] = [];
	const check = (name: string, ok: boolean, detail: string): void => {
		results.push({ name, ok, detail });
	};

	// (б) панель под предком с pointer-events: none остаётся кликабельной
	{
		const scenario = required(page, '[data-scenario="b"]');
		const panel = await openPanel(required(scenario, '[data-scenario-trigger]'));
		try {
			const button = required(panel, '[data-panel-button]');
			const { x, y } = centerOf(button);
			const hit = document.elementFromPoint(x, y);
			check(
				'(б) предок с pointer-events: none: кнопка в панели принимает указатель',
				getComputedStyle(scenario).pointerEvents === 'none' && hit !== null && button.contains(hit),
				`предок ${getComputedStyle(scenario).pointerEvents}, панель ${getComputedStyle(panel).pointerEvents}, под указателем ${hit?.tagName ?? 'ничего'}`
			);
		}
		finally {
			await closePanel();
		}
	}

	// (в) label: клик и двойной клик по панели не переключают флажок
	{
		const scenario = required(page, '[data-scenario="c-label"]');
		const input = required(scenario, '[data-label-input]');
		if (!(input instanceof HTMLInputElement)) {
			throw new Error('Label scenario input is not an input');
		}
		const panel = await openPanel(required(scenario, '[data-scenario-trigger]'));
		try {
			const before = input.checked;
			const text = required(panel, '[data-panel-text]');
			mouse(text, 'click');
			mouse(text, 'dblclick');
			mouse(required(panel, '[data-panel-button]'), 'click');
			check('(в) Popover внутри label: клик по панели не переключает флажок', input.checked === before, `флажок был ${String(before)}, стал ${String(input.checked)}`);
		}
		finally {
			await closePanel();
		}
	}

	// (в) карточка: клик и двойной клик по панели не доходят до обработчиков карточки
	{
		const scenario = required(page, '[data-scenario="c-card"]');
		const clicks = required(scenario, '[data-counter="c-card-clicks"]');
		const doubles = required(scenario, '[data-counter="c-card-double"]');
		const panel = await openPanel(required(scenario, '[data-scenario-trigger]'));
		try {
			// клик по самому инициатору карточку задевает: счёт ведётся после открытия
			const beforeClicks = number(clicks);
			const beforeDoubles = number(doubles);
			const text = required(panel, '[data-panel-text]');
			mouse(text, 'click');
			mouse(text, 'dblclick');
			mouse(required(panel, '[data-panel-button]'), 'click');
			check(
				'(в) Popover внутри карточки: клик и двойной клик по панели не вызывают её обработчики',
				number(clicks) === beforeClicks && number(doubles) === beforeDoubles,
				`клики ${beforeClicks} → ${number(clicks)}, двойные ${beforeDoubles} → ${number(doubles)}`
			);
		}
		finally {
			await closePanel();
		}
	}

	// (в) форма: Enter в поле панели отменён, чтобы не отправить чужую форму
	{
		const scenario = required(page, '[data-scenario="c-form"]');
		const submits = required(scenario, '[data-counter="c-submits-count"]');
		const panel = await openPanel(required(scenario, '[data-scenario-trigger]'));
		try {
			const input = required(panel, '[data-panel-input]');
			const enter = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
			input.dispatchEvent(enter);
			check(
				'(в) Popover внутри form: Enter в поле панели отменён (форма не отправляется)',
				enter.defaultPrevented && number(submits) === 0,
				`defaultPrevented = ${String(enter.defaultPrevented)}, отправок ${number(submits)}`
			);
		}
		finally {
			await closePanel();
		}
	}

	// (д) предки с transform, filter, contain: paint, overflow: hidden не обрезают панель, она стоит у якоря
	for (const name of ['transform', 'filter', 'contain', 'overflow']) {
		const scenario = required(page, `[data-scenario="d-${name}"]`);
		const trigger = required(scenario, '[data-scenario-trigger]');
		const panel = await openPanel(trigger);
		try {
			const box = panel.getBoundingClientRect();
			const container = scenario.getBoundingClientRect();
			const anchor = trigger.getBoundingClientRect();
			const { x, y } = centerOf(panel);
			const hit = document.elementFromPoint(x, y);
			check(
				`(д) ${name}: панель не обрезана и стоит у якоря`,
				box.bottom > container.bottom
					&& hit !== null && panel.contains(hit)
					&& Math.abs(box.left - anchor.left) <= 1 && Math.abs(box.top - (anchor.bottom + 4)) <= 1,
				`низ панели ${box.bottom.toFixed(0)} > низ контейнера ${container.bottom.toFixed(0)}; смещение от якоря `
					+ `${(box.left - anchor.left).toFixed(1)}, ${(box.top - anchor.bottom).toFixed(1)}`
			);
		}
		finally {
			await closePanel();
		}
	}

	// (а, мини) меню из ячейки таблицы с text-align: right, nowrap и overflow: hidden
	{
		const cell = required(page, '[data-scenario="a-cell"]');
		const area = required(cell, '[data-scenario-area]');
		area.scrollIntoView({ behavior: 'instant', block: 'center' });
		const { x, y } = centerOf(area);
		area.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: x, clientY: y }));
		await frames();
		const menu = required(document, '[data-scenario-menu]');
		try {
			const style = getComputedStyle(menu);
			const box = menu.getBoundingClientRect();
			const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
			check(
				'(а) ContextMenu из ячейки: меню вне таблицы, не обрезано, без унаследованных выравнивания и переноса',
				menu.closest('table') === null
					&& box.width > cell.getBoundingClientRect().width
					&& hit !== null && menu.contains(hit)
					&& style.textAlign === 'start' && style.whiteSpace === 'normal',
				`в таблице: ${String(menu.closest('table') !== null)}; ширина меню ${box.width.toFixed(0)} при ячейке `
					+ `${cell.getBoundingClientRect().width.toFixed(0)}; text-align ${style.textAlign}, white-space ${style.whiteSpace}`
			);
		}
		finally {
			await closePanel();
		}
	}

	return results;
}
```

- [ ] **Step 2: Геометрия тела Dialog (критерий 7)**

В `playground/src/dialog-checks.ts` после проверки `'Dialog.Body: отступ не меньше пространства кольца фокуса'` добавить:

```ts
		// критерий 7 для тела диалога: внешнее кольцо первого и последнего контрола целиком внутри области обрезки тела
		const bodyBox = body.getBoundingClientRect();
		const controls = Array.from(body.children);
		const first = controls[0]?.getBoundingClientRect();
		const last = controls.at(-1)?.getBoundingClientRect();
		check(
			'Dialog.Body: кольцо первого и последнего контрола не обрезано телом',
			first !== undefined && last !== undefined
				&& first.left - reserved >= bodyBox.left && first.top - reserved >= bodyBox.top
				&& last.right + reserved <= bodyBox.right && last.bottom + reserved <= bodyBox.bottom,
			`кольцо ${reserved} px; слева ${((first?.left ?? 0) - bodyBox.left).toFixed(1)}, сверху ${((first?.top ?? 0) - bodyBox.top).toFixed(1)}, `
				+ `снизу ${(bodyBox.bottom - (last?.bottom ?? 0)).toFixed(1)}`
		);
```

- [ ] **Step 3: Подключить к странице**

В `playground/src/panels-page.tsx`: импорт `import { runPopoverScenarioChecks } from './popover-checks';` и в `runChecks`:

```tsx
				const dialog = await runDialogChecks(root);
				const menu = await runContextMenuChecks(root);
				const scenarios = await runPopoverScenarioChecks(root);
				setResults([...dialog, ...menu, ...scenarios]);
```

- [ ] **Step 4: Проверка и коммит**

Run: `pnpm check` — зелёный. Если строки превышают 140 символов, перенести.

```bash
git add -A && git commit -m "feat(playground): проверки сценариев б, в, д, мини-а и геометрии тела Dialog" -m "$TRAILERS"
```

---

### Task 4: Приёмка в Chrome, страница «Темы», матрица

- [ ] **Step 1: Автоматические проверки**

`pnpm dev` в фоне (`env -u ...proxy`, порт из вывода Vite), `#panels`: «Запустить проверки» в системной, светлой и тёмной темах. Ожидание: все строки OK (Dialog 12 + ContextMenu 11 + сценарии 9). Если строка FAIL, разобраться: ошибка ли это компонента, проверки или раскладки стенда, не ослаблять проверку без объяснения.

- [ ] **Step 2: Ручная приёмка настоящими нажатиями**

(в) форма: открыть «Панель внутри формы», ввести текст, настоящий Enter: счётчик отправок остаётся 0; Enter на кнопке «Сохранить» в панели диалога отправляет форму панели (счётчик растёт) — это своя форма панели. (б): настоящий клик по кнопке «Кнопка в панели» под предком с `pointer-events: none` увеличивает счётчик нажатий. (в) label и карточка: настоящий клик и двойной клик по тексту панели не меняют флажок и счётчики карточки. (д): все четыре панели видны целиком и у якоря (скриншот). Esc-приёмка: диалог «Диалог с Popover», открыть панель с формой, ввести текст, Esc: закрылась только панель, диалог открыт, счётчик `onOpenChange(false)` равен 0; второй Esc: диалог закрыт, счётчик 1. Критерий 7: настоящий Tab в диалоге «Диалог с контролами» до первого поля, zoom-скриншот: внешнее кольцо поля видно целиком.

- [ ] **Step 3: Страница «Темы» и матрица**

Страница «Темы» (`#themes`): «Запустить проверки» в трёх темах, 32 OK (число сверить с итогами части 1). `pnpm check` и `scripts/verify-package-form.sh HEAD` (без прокси): 28 OK, TypeScript 5.9.3 и 7.0.2 зелёные; удалить временный потребитель. Остановить dev-сервер по PID (cwd `playground`), закрыть вкладку.

- [ ] **Step 4: Итоги этапа**

В спеке этапа 2 добавить `## 15. Итоги части 4 и этапа 2 (<дата>)`: измеренные факты по критериям раздела 8 (таблица «критерий → чем подтверждён»), число тестов, результаты страницы, ручной приёмки и матрицы, отклонения, непроверенное (Firefox 125, Safari 17.5, вложенные диалоги, сенсорные экраны, клавиши ContextMenu и Shift+F10 вне macOS). Статус в шапке спека этапа 2 заменить на «выполнен (Chrome), тег `v0.3.0` ставит владелец». В зонтичном спеке (раздел 13, строка этапа 2) дописать статус выполнения. В `README.md` статус: этапы 0, 1 и 2 готовы (оверлеи: Popover, Dialog, ContextMenu).

- [ ] **Step 5: Коммит**

```bash
git add -A && git commit -m "docs: итоги части 4 и этапа 2 (оверлеи)" -m "$TRAILERS"
```

Тег `v0.3.0` и `git push` не выполняются: владелец ставит их сам после проверки (`git tag v0.3.0 && git push origin master v0.3.0`).
