# Этап 4б, пейджер, часть 3: нижняя полоса Grid, playground, приёмка. План реализации

> **Для исполнителя:** шаги отмечены чекбоксами (`- [ ]`). Задачи 1–2 идут по TDD с `pnpm check` и коммитом; задача 3 это приёмка в Chrome и запись итогов в спек. Код возврата `pnpm check` проверяется отдельной командой.

**Цель:** Grid рисует `Pager` в нижней полосе корпуса, когда передан `total`; на странице «Грид» playground появляется режим «Постраничная загрузка» с поддельным сервером и автопроверки; приёмка в Chrome по матрице «тема × размер» с настоящими клавишами.

**Архитектура:** `GridProps` получает плоские пропсы пейджера (тип `GridPagerProps` в своём файле), `GridFooter` пробрасывает их в `Pager`. Полоса стоит после скроллера (`flex: none`), скроллер сжимается; строки грид не режет. Playground держит запрошенное и отданное состояние раздельно, чтобы увидеть `loading`.

**Стек:** Solid 1.9, CSS Modules, vitest 5, Vite playground, Chrome (расширение, `browser_batch`).

**Спек:** `docs/superpowers/specs/2026-11-01-stage-4b-pager-design.md` (разделы 2.2, 6, 8–10). Части 1–2: `2026-11-01-stage-4b-pager-pure-functions.md`, `2026-11-01-stage-4b-pager-component.md` (выполнены).

## Глобальные ограничения

- Репозиторий публичный: ни ключей, ни токенов, ни `.env`, ни корпоративной почты в коммитах.
- Один класс/функция/компонент — один файл (kebab-case).
- ESLint: табы, одинарные кавычки, длина строки ≤ 140 вместе с комментариями, без комментариев в конце строки; пропсы не деструктурируются; `exactOptionalPropertyTypes`.
- CSS: нативная вложенность, без литералов цвета, `pnpm exec stylelint --fix "src/**/*.css" "playground/src/**/*.css"` после правки.
- pnpm запускается как `env -u HTTPS_PROXY -u HTTP_PROXY -u https_proxy -u http_proxy pnpm …`.
- Chrome: `browser_batch`, пакет не дольше ~100 с, один `wait` не больше 10 с, без JS-диалогов, открытые мной вкладки закрывать; координаты клика = CSS-координаты × 0.855; dev-сервер владельца на порту 5173 не трогать, временный сервер гасить только по PID после проверки cwd (`lsof -a -p <PID> -d cwd -Fn`), без `pkill`.
- Замер производительности: только при `sysctl -n vm.loadavg` ниже 2, 120 fps вхолостую и питании от сети; порог кадра 16,7 + 0,8 мс.
- Тег не ставится и ничего не пушится без отдельного слова владельца.
- Коммит с трейлерами: `T=$'Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_017cEinKKFDiYmGrLaaKPqZu'`, затем `git commit -m "…" -m "$T"`.

## Решения

1. Режим «Постраничная загрузка» в демо по умолчанию выключен: существующие 30 проверок и замер прокрутки идут в прежнем состоянии (100 000 строк, без полосы).
2. Страница в демо работает как сервер: `Pager` контролируемый; действие пользователя сразу меняет запрошенные `page` и `pageSize`, строки подменяются через задержку (выбор: 0 / 400 / 2000 мс, по умолчанию 400), пока включён `loading`.
3. Новые автопроверки лежат в `pager-checks.ts` и вызываются со страницы «Грид» после `runGridChecks`.

---

### Task 1: Пропсы пейджера у Grid и нижняя полоса

**Files:**
- Create: `src/components/grid/grid-pager-props.ts`, `src/components/grid/grid-footer.tsx`
- Modify: `src/components/grid/grid-props.ts`, `src/components/grid/grid.tsx`, `src/components/grid/grid.module.css`
- Test: `src/components/grid/grid.test.tsx` (новый блок `describe('Grid: пейджер')` в конец файла)

**Interfaces:**
- Consumes: `Pager`, `PagerLabels`, `PagerRange` из `../pager`.
- Produces: `GridPagerProps`; `GridProps<T> extends GridPagerProps`; `GridFooter(props: { pager: GridPagerProps; loading: boolean })`.

- [ ] **Step 1: Тесты (красные)**

Добавить в конец `src/components/grid/grid.test.tsx` (используются существующие `renderGrid`, `ROWS`, импорты `cleanup`, `fireEvent`, `render`, `screen`, `createSignal`, `vi`; при необходимости дополнить импорты):

```tsx
describe('Grid: пейджер', () => {
	function footer(): HTMLElement | null {
		return document.querySelector<HTMLElement>('nav[aria-label="Постраничная навигация"]');
	}

	it('без total полосы нет', () => {
		renderGrid();
		expect(footer()).toBeNull();
	});

	it('с total полоса внутри корпуса после скроллера, сводка по total', () => {
		renderGrid({ total: 1250, defaultPageSize: 20 });
		const nav = footer();
		expect(nav).not.toBeNull();
		const root = document.querySelector('[data-s-kit-focus-inset]');
		expect(root?.contains(nav)).toBe(true);
		expect(nav?.parentElement?.previousElementSibling?.querySelector('table')).not.toBeNull();
		expect((nav?.querySelector('[data-pager-summary]')?.textContent ?? '').replace(/\s/g, ' ')).toBe('Записей 1–20 из 1 250');
	});

	it('колбэки пейджера доходят до страницы, строки грид не режет', () => {
		const onPageChange = vi.fn();
		renderGrid({ total: 100, defaultPageSize: 10, onPageChange });
		fireEvent.click(screen.getByRole('button', { name: 'Вперёд' }));
		expect(onPageChange).toHaveBeenCalledWith(2);
		expect(document.querySelectorAll('tbody > tr[data-index]')).toHaveLength(ROWS.length);
	});

	it('onRefresh показывает кнопку «Обновить»', () => {
		const onRefresh = vi.fn();
		renderGrid({ total: 100, onRefresh });
		fireEvent.click(screen.getByRole('button', { name: 'Обновить' }));
		expect(onRefresh).toHaveBeenCalledTimes(1);
	});

	it('loading грида блокирует пейджер', () => {
		renderGrid({ total: 100, defaultPage: 3, loading: true, onRefresh: vi.fn() });
		const buttons = [...(footer()?.querySelectorAll('button') ?? [])];
		expect(buttons.length).toBeGreaterThan(0);
		expect(buttons.every((button) => button.disabled)).toBe(true);
	});

	it('pagerLabels и pagerSummaryText переопределяют тексты', () => {
		renderGrid({ total: 100, pagerLabels: { next: 'Next' }, pagerSummaryText: (range) => `${range.total}` });
		expect(screen.getByRole('button', { name: 'Next' })).toBeTruthy();
		expect(footer()?.querySelector('[data-pager-summary]')?.textContent).toBe('100');
	});

	it('объявление после загрузки считает total, а не строки страницы', () => {
		const foundText = vi.fn((count: number) => `найдено ${count}`);
		const [loading, setLoading] = createSignal(true);
		render(() => (
			<Grid rows={ROWS} getRowKey={(row) => row.id} columns={COLUMNS} total={500} loading={loading()} foundText={foundText}/>
		));
		setLoading(false);
		expect(foundText).toHaveBeenCalledWith(500);
		expect(document.querySelector('[aria-live="polite"]')?.textContent).toBe('найдено 500');
	});

	it('пустая страница при ненулевом total остаётся состоянием «пусто»', () => {
		const [loading, setLoading] = createSignal(true);
		render(() => <Grid rows={[]} getRowKey={(row: Person) => row.id} columns={COLUMNS} total={500} loading={loading()}/>);
		setLoading(false);
		expect(document.querySelector('[aria-live="polite"]')?.textContent).toBe('Ничего не найдено');
		expect(footer()).not.toBeNull();
	});
});
```

Если в `grid.test.tsx` живая область найдена иначе (не `[aria-live="polite"]`), использовать тот же селектор, что в существующих тестах «Найдено …».

- [ ] **Step 2: Запустить, убедиться что падает**

Run: `env -u HTTPS_PROXY -u HTTP_PROXY -u https_proxy -u http_proxy pnpm exec vitest run src/components/grid/grid.test.tsx`
Expected: FAIL (свойство `total` не существует, полосы нет).

- [ ] **Step 3: Реализация**

`src/components/grid/grid-pager-props.ts`:

```ts
import type { PagerLabels, PagerRange } from '../pager';

/** Пропсы нижней полосы Grid: те же значения и умолчания, что у `Pager`; полоса есть, только если передан `total`. */
export interface GridPagerProps {
	/** Всего записей в выборке (не длина `rows`): включает нижнюю полосу пейджера. */
	total?: number | undefined;
	page?: number | undefined;
	defaultPage?: number | undefined;
	onPageChange?: ((page: number) => void) | undefined;
	pageSize?: number | undefined;
	defaultPageSize?: number | undefined;
	onPageSizeChange?: ((size: number) => void) | undefined;
	/** По умолчанию 10, 20, 50, 200, 500, 1000, 2000. */
	pageSizes?: readonly number[] | undefined;
	/** Кнопка «Обновить» в полосе показывается только если колбэк передан. */
	onRefresh?: (() => void) | undefined;
	pagerLabels?: Partial<PagerLabels> | undefined;
	pagerSummaryText?: ((range: PagerRange) => string) | undefined;
}
```

`src/components/grid/grid-footer.tsx`:

```tsx
import styles from './grid.module.css';

import type { JSX } from 'solid-js';

import { Pager } from '../pager';

import type { GridPagerProps } from './grid-pager-props';

export interface GridFooterProps {
	pager: GridPagerProps;
	loading: boolean;
}

/** Нижняя полоса корпуса: пейджер под скроллером. Грид строки не режет, страница сама отвечает на колбэки. */
export function GridFooter(props: GridFooterProps): JSX.Element {
	return (
		<div class={styles['footer']}>
			<Pager
				total={props.pager.total ?? 0}
				page={props.pager.page}
				defaultPage={props.pager.defaultPage}
				onPageChange={props.pager.onPageChange}
				pageSize={props.pager.pageSize}
				defaultPageSize={props.pager.defaultPageSize}
				onPageSizeChange={props.pager.onPageSizeChange}
				pageSizes={props.pager.pageSizes}
				onRefresh={props.pager.onRefresh}
				labels={props.pager.pagerLabels}
				summaryText={props.pager.pagerSummaryText}
				loading={props.loading}
			/>
		</div>
	);
}
```

`src/components/grid/grid-props.ts`: добавить импорт `import type { GridPagerProps } from './grid-pager-props';` (в блоке относительных импортов, порядок по `simple-import-sort`) и заменить заголовок интерфейса на `export interface GridProps<T> extends GridPagerProps {`.

`src/components/grid/grid.tsx`:
- импорт `import { GridFooter } from './grid-footer';` (по алфавиту, после `grid-context`), и `Show` в импорт из `solid-js`;
- в эффекте объявления результата заменить `(props.foundText ?? defaultFoundText)(props.rows.length)` на `(props.foundText ?? defaultFoundText)(props.total ?? props.rows.length)`;
- в JSX после блока скроллера (`</div>` скроллера) и перед `<GridRowMenu/>` вставить:

```tsx
<Show when={props.total !== undefined}>
	<GridFooter pager={props} loading={loading()}/>
</Show>
```

`src/components/grid/grid.module.css`:
- в комментарий токенов добавить `--s-kit-grid-footer-bg`;
- после правила `.scroller` добавить:

```css
.footer {
    flex: none;
    border-block-start: 1px solid var(--s-kit-color-hairline);
    background: var(--s-kit-grid-footer-bg, var(--s-kit-color-surface-2));
}
```

`src/components/grid/index.ts`: добавить `export type { GridPagerProps } from './grid-pager-props';`.

- [ ] **Step 4: Тесты зелёные**

Run: `env -u HTTPS_PROXY -u HTTP_PROXY -u https_proxy -u http_proxy pnpm exec vitest run src/components/grid src/components/pager`
Expected: PASS (прежние тесты Grid тоже зелёные).

- [ ] **Step 5: Проверка и коммит**

```bash
env -u HTTPS_PROXY -u HTTP_PROXY -u https_proxy -u http_proxy pnpm exec stylelint --fix "src/**/*.css" "playground/src/**/*.css"
env -u HTTPS_PROXY -u HTTP_PROXY -u https_proxy -u http_proxy pnpm check; echo exit=$?
```
Expected: `exit=0`. Затем:

```bash
git add src/components/grid && git commit -m "feat(grid): нижняя полоса с пейджером при заданном total" -m "$T"
```

---

### Task 2: Playground: серверный режим, отдельный Pager, автопроверки

**Files:**
- Modify: `playground/src/demo-grid.tsx`, `playground/src/grid-page.tsx`, `playground/src/playground.css` (только если нужна рамка под отдельный `Pager`)
- Create: `playground/src/pager-checks.ts`

**Interfaces:**
- Consumes: `Grid` с пропсами пейджера, `Pager` из `@stark/solid-kit/pager`, `runGridChecks`, `frames`, `required`.
- Produces: переключатели `data-grid-paged` (чекбокс «Постраничная загрузка») и `data-grid-delay` (select 0/400/2000), `<output data-grid-page-log>`, контейнер `[data-pager-standalone]`, `runPagerChecks(page: HTMLElement): Promise<CheckResult[]>`.

- [ ] **Step 1: Серверный режим в `demo-grid.tsx`**

Добавить импорт `import { Pager } from '@stark/solid-kit/pager';` и сигналы/логику (в `DemoGrid`):

```tsx
const DELAYS = ['0', '400', '2000'] as const;
const DEFAULT_PAGE_SIZE = 20;

interface PageRequest {
	readonly page: number;
	readonly size: number;
}
```

(`DELAYS`, `DEFAULT_PAGE_SIZE`, `PageRequest` на уровне модуля.) Внутри компонента:

```tsx
const [paged, setPaged] = createSignal(false);
const [delay, setDelay] = createSignal<(typeof DELAYS)[number]>('400');
const [wanted, setWanted] = createSignal<PageRequest>({ page: 1, size: DEFAULT_PAGE_SIZE });
const [served, setServed] = createSignal<PageRequest>({ page: 1, size: DEFAULT_PAGE_SIZE });
const [serverLoading, setServerLoading] = createSignal(false);
const [pageLog, setPageLog] = createSignal('ещё не было');
let timer: number | undefined;

/** Поддельный сервер: запрос сразу виден в пейджере, строки приходят через задержку. */
function ask(next: PageRequest): void {
	setWanted(next);
	setPageLog(`страница ${next.page}, размер ${next.size}`);
	window.clearTimeout(timer);
	setServerLoading(true);
	timer = window.setTimeout(() => {
		setServed(next);
		setServerLoading(false);
	}, Number(delay()));
}
onCleanup(() => {
	window.clearTimeout(timer);
});
```

Заменить `rows`:

```tsx
const sorted = createMemo(() => (empty() ? [] : sortRows(ALL_ORDERS.slice(0, Number(count())), sort())));
const rows = createMemo(() => {
	if (!paged()) {
		return sorted();
	}
	const { page, size } = served();
	return sorted().slice((page - 1) * size, page * size);
});
```

(импорт `onCleanup` из `solid-js`). В панель управления добавить:

```tsx
<label>
	<input type='checkbox' data-grid-paged checked={paged()} onChange={(event) => {
		setPaged(event.currentTarget.checked);
		ask({ page: 1, size: DEFAULT_PAGE_SIZE });
	}}/>
	Постраничная загрузка
</label>
<label>
	Задержка, мс
	<select data-grid-delay onChange={(event) => setDelay(pick(DELAYS, event.currentTarget.value, '400'))}>
		<For each={DELAYS}>{(value) => <option value={value} selected={value === delay()}>{value}</option>}</For>
	</select>
</label>
```

В смене числа строк (`onChange` селекта `data-grid-count`) после `setCount(...)` добавить `ask({ page: 1, size: wanted().size });` (при выключенном режиме это безвредно: строки не используют `served`).

Пропсы `Grid`:

```tsx
loading={loading() || serverLoading()}
total={paged() ? Number(count()) : undefined}
page={wanted().page}
pageSize={wanted().size}
onPageChange={(page) => ask({ page, size: wanted().size })}
onPageSizeChange={(size) => ask({ page: wanted().page, size })}
onRefresh={() => ask(wanted())}
```

Порядок колбэков пейджера: при смене размера сначала `onPageSizeChange(size)` (в нём `wanted().page` ещё прежний), затем `onPageChange(page)` при смене страницы. Так как `ask` читает `wanted()` в момент вызова, второй вызов видит уже новый размер: `onPageChange` берёт `wanted().size` и получает верный размер. Проверить это поведение в автопроверке 3.

После `<output data-grid-perf>` добавить:

```tsx
<p>Последний запрос страницы: <output data-grid-page-log>{pageLog()}</output></p>
<div data-pager-standalone class='pager-standalone'>
	<Pager total={1250} defaultPageSize={20} onRefresh={() => setPageLog('отдельный Pager: обновить')}/>
</div>
```

В `playground/src/playground.css` добавить рамку для отдельного пейджера (вложенный стиль, без литералов цвета; цвета из токенов кита, как у `grid-frame`):

```css
.pager-standalone {
    margin-block-start: 12px;
    border: 1px solid var(--s-kit-color-border-strong);
    border-radius: var(--s-kit-radius);
}
```

- [ ] **Step 2: Автопроверки `pager-checks.ts`**

`playground/src/pager-checks.ts`:

```ts
import { frames, required } from './check-helpers';
import type { CheckResult } from './theme-checks';

const SERVER_WAIT_MS = 700;

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => {
		window.setTimeout(resolve, ms);
	});
}

function plain(text: string | null | undefined): string {
	return (text ?? '').replace(/\s/g, ' ');
}

function setSelect(select: HTMLElement, value: string): void {
	(select as HTMLSelectElement).value = value;
	select.dispatchEvent(new Event('change', { bubbles: true }));
}

function setChecked(box: HTMLElement, checked: boolean): void {
	const input = box as HTMLInputElement;
	if (input.checked !== checked) {
		input.click();
	}
}

function navIn(frame: HTMLElement): HTMLElement | null {
	return frame.querySelector<HTMLElement>('nav[aria-label="Постраничная навигация"]');
}

function summaryOf(nav: HTMLElement | null): string {
	return plain(nav?.querySelector('[data-pager-summary]')?.textContent);
}

function buttonOf(nav: HTMLElement, label: string): HTMLButtonElement {
	const found = [...nav.querySelectorAll<HTMLButtonElement>('button')].find((button) => button.getAttribute('aria-label') === label);
	if (!found) {
		throw new Error(`Pager button is missing: ${label}`);
	}
	return found;
}

function pageRow(frame: HTMLElement): string {
	return frame.querySelector('tbody > tr[data-index]')?.textContent ?? '';
}

function keyDown(target: HTMLElement, key: string): void {
	target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
}

/**
 * Автопроверки пейджера: полоса только с `total`, сводка и ряд номеров на 100 000 строк, листание, смена размера с сохранением первой
 * записи, блокировка при загрузке, фокус на границе. Кольцо фокуса и настоящие Tab проверяются вручную в Chrome.
 */
export async function runPagerChecks(page: HTMLElement): Promise<CheckResult[]> {
	const results: CheckResult[] = [];
	const check = (name: string, ok: boolean, detail: string): void => {
		results.push({ name, ok, detail });
	};

	const frame = required(page, '[data-grid-demo]');
	const paged = required(page, '[data-grid-paged]');
	const delay = required(page, '[data-grid-delay]');
	const count = required(page, '[data-grid-count]');
	const log = required(page, '[data-grid-page-log]');

	setSelect(count, '100000');
	setChecked(paged, false);
	await frames();
	check('Pager: без total полосы нет', navIn(frame) === null, navIn(frame) === null ? 'нет' : 'есть');

	setSelect(delay, '0');
	setChecked(paged, true);
	await sleep(SERVER_WAIT_MS);
	let nav = navIn(frame);
	check('Pager: с total полоса внутри рамки грида', nav !== null && nav.closest('[data-grid-demo]') !== null, nav === null ? 'нет' : 'есть');
	if (nav === null) {
		return results;
	}
	check('Pager: сводка «Записей 1–20 из 100 000»', summaryOf(nav) === 'Записей 1–20 из 100 000', summaryOf(nav));

	const numbers = [...nav.querySelectorAll<HTMLElement>('button[aria-current], button[aria-label^="Страница"]')].map((b) => b.textContent);
	check('Pager: ряд номеров 1 2 3 4 5 … 5000', numbers.join(' ') === '1 2 3 4 5 5000', numbers.join(' '));

	buttonOf(nav, 'Вперёд').click();
	await sleep(SERVER_WAIT_MS);
	nav = navIn(frame) ?? nav;
	check('Pager: «Вперёд» грузит страницу 2 (сводка 21–40, первая строка 21)', summaryOf(nav) === 'Записей 21–40 из 100 000'
		&& pageRow(frame).includes('Заказчик 21'), `${summaryOf(nav)}; ${pageRow(frame).slice(0, 40)}`);

	buttonOf(nav, 'Страница 3').click();
	await sleep(SERVER_WAIT_MS);
	const sizeTrigger = required(nav, '[role="combobox"]');
	sizeTrigger.focus();
	keyDown(sizeTrigger, 'ArrowDown');
	await frames();
	const options = [...document.querySelectorAll<HTMLElement>('[role="option"]')];
	const fifty = options.find((option) => option.textContent === '50');
	fifty?.click();
	await sleep(SERVER_WAIT_MS);
	nav = navIn(frame) ?? nav;
	check('Pager: страница 3 из 20 → размер 50 сохраняет первую запись 41 (страница 1, сводка 1–50)',
		fifty !== undefined && summaryOf(nav) === 'Записей 1–50 из 100 000', `${summaryOf(nav)}; ${log.textContent ?? ''}`);

	setSelect(delay, '400');
	buttonOf(nav, 'Вперёд').click();
	await frames(2);
	const blocked = [...nav.querySelectorAll<HTMLButtonElement>('button')].every((button) => button.disabled)
		&& frame.querySelector('[aria-busy="true"]') !== null;
	check('Pager: на время загрузки все кнопки отключены, грид aria-busy', blocked, blocked ? 'да' : 'нет');
	await sleep(SERVER_WAIT_MS);
	nav = navIn(frame) ?? nav;
	check('Pager: после загрузки кнопки снова доступны', !buttonOf(nav, 'Вперёд').disabled, summaryOf(nav));

	setSelect(delay, '0');
	buttonOf(nav, 'В конец').click();
	await sleep(SERVER_WAIT_MS);
	nav = navIn(frame) ?? nav;
	check('Pager: «В конец» открывает последнюю страницу (сводка 99 951–100 000), «Вперёд» отключена',
		summaryOf(nav) === 'Записей 99 951–100 000 из 100 000' && buttonOf(nav, 'Вперёд').disabled, summaryOf(nav));

	buttonOf(nav, 'Назад').focus();
	buttonOf(nav, 'Назад').click();
	await sleep(SERVER_WAIT_MS);
	nav = navIn(frame) ?? nav;
	buttonOf(nav, 'Вперёд').focus();
	buttonOf(nav, 'Вперёд').click();
	await sleep(SERVER_WAIT_MS);
	nav = navIn(frame) ?? nav;
	const active = document.activeElement;
	check('Pager: «Вперёд» на предпоследней странице переносит фокус на текущую страницу',
		buttonOf(nav, 'Вперёд').disabled && active?.getAttribute('aria-current') === 'page', active?.getAttribute('aria-label') ?? String(active));

	const standalone = required(page, '[data-pager-standalone]');
	check('Pager: отдельный Pager вне грида работает (сводка «Записей 1–20 из 1 250»)',
		summaryOf(standalone) === 'Записей 1–20 из 1 250', summaryOf(standalone));

	setChecked(paged, false);
	setSelect(delay, '400');
	await frames();
	return results;
}
```

(Метка сверху `Pager: ряд номеров` в проверке номеров: `numbers` берёт тексты кнопок страниц; многоточие не кнопка, поэтому ожидается `1 2 3 4 5 5000`.)

- [ ] **Step 3: Подключить к странице «Грид»**

`playground/src/grid-page.tsx`: импорт `import { runPagerChecks } from './pager-checks';` и в `runChecks`:

```tsx
setResults([...(await runGridChecks(root)), ...(await runPagerChecks(root))]);
```

В описание раздела 1 страницы добавить предложение: «Режим «Постраничная загрузка»: поддельный сервер с задержкой, пейджер внизу рамки; под гридом отдельный `Pager`.»

- [ ] **Step 4: Проверка**

```bash
env -u HTTPS_PROXY -u HTTP_PROXY -u https_proxy -u http_proxy pnpm exec stylelint --fix "src/**/*.css" "playground/src/**/*.css"
env -u HTTPS_PROXY -u HTTP_PROXY -u https_proxy -u http_proxy pnpm check; echo exit=$?
```
Expected: `exit=0`. Автопроверки гоняются в браузере в задаче 3 (jsdom их не исполняет).

- [ ] **Step 5: Коммит**

```bash
git add playground src && git commit -m "feat(playground): постраничная загрузка с поддельным сервером и автопроверки пейджера" -m "$T"
```

---

### Task 3: Приёмка в Chrome и итоги

**Files:**
- Modify: `docs/superpowers/specs/2026-11-01-stage-4b-pager-design.md` (раздел «Итоги и приёмка»)

- [ ] **Step 1: Собрать production-сборку playground и поднять временный сервер** (порт не 5173; PID записать, гасить по PID после проверки cwd).

- [ ] **Step 2: Автопроверки.** Страница «Грид», «Запустить проверки»: прежние 30 и новые пейджера, все `OK`. Провал разобрать до причины (код или проверка), не ослаблять порог.

- [ ] **Step 3: Ручная приёмка по матрице «тема × размер»** (светлая и тёмная × `sm`, `md`, `lg` у отдельного `Pager`; в гриде всегда `md`). Настоящие Tab и Shift+Tab, Enter/Space. Критерии 1–3 спека, раздел 8:
  1. Поведение: кнопки, номера с пропусками (`1 … 4 5 6 … 20`), размеры страницы, сводка, «Обновить»; смена размера сохраняет первую запись; `loading` блокирует и возвращает фокус.
  2. Фокус: кольцо каждой кнопки и размера страницы видно целиком внутри рамки, не обрезано скроллером; Tab по всей полосе подряд.
  3. Раскладка: полоса внутри корпуса, углы не прорезаются; на узкой ширине (окно ~480 px) полоса переносится, горизонтальной прокрутки страницы нет; список размеров открывается вверх, если внизу нет места.
  4. `skeletonCount`: во время загрузки заглушек не меньше 5 и не больше 20 (с полосой скроллер ниже).
  5. Кнопка «Обновить» вращается при загрузке; в системных настройках «уменьшить движение» вращения нет (проверка эмуляцией `prefers-reduced-motion`).

- [ ] **Step 4: Замер производительности** (критерий 4 спека; условия: `sysctl -n vm.loadavg` ниже 2, 120 fps вхолостую, питание от сети): режим «Постраничная загрузка» включён, размер страницы 2000 (виртуализация внутри страницы), кнопка «Замер прокрутки»; для сравнения замер в обычном режиме. Доля кадров длиннее 16,7 + 0,8 мс не больше 5 % при 20 000 px/с. Если машина не в условиях замера, записать это и повторить позже, а не принимать число.

- [ ] **Step 5: Итоги в спек.** Добавить в конец спека раздел «12. Итоги приёмки (дата)»: что проверено (автопроверки с числом, матрица, фокус, перенос, замер с условиями), найденные и исправленные дефекты, расхождения со спеком, оставшиеся вопросы. Только измеренное, без догадок.

- [ ] **Step 6: Полная проверка и коммит**

```bash
env -u HTTPS_PROXY -u HTTP_PROXY -u https_proxy -u http_proxy pnpm check; echo exit=$?
scripts/verify-package-form.sh HEAD; echo exit=$?
```
Expected: оба `exit=0`. Затем:

```bash
git add docs && git commit -m "docs: итоги приёмки пейджера" -m "$T"
```

Тег и push — только после отдельного слова владельца; `v1.0.0` ставится после всего этапа 4б.

---

## Самопроверка плана

- Покрытие спека: раздел 2.2 (пропсы Grid, полоса только при `total`, `foundText(total)`, `loading`) — задача 1; раздел 6 (полоса, граница, фон, токен) — задача 1; раздел 9 (playground, автопроверки, отдельный Pager) — задача 2; раздел 8 (критерии 1–5) и риски раздела 10 (`Select` вверх, `skeletonCount`, фокус) — задача 3.
- Типы согласованы: `GridPagerProps` (задача 1) используется `GridFooter` и `GridProps`; `ask`/`wanted`/`served` (задача 2) совпадают с пропсами `Grid`.
- Известные риски: перенос фокуса в настоящем браузере (проверяется в шаге 2–3 задачи 3); при расхождении jsdom и Chrome правится код `Pager`, а не проверка.
