# solid-kit, этап 1: Switch — план реализации

> **Для исполнителей:** ОБЯЗАТЕЛЬНЫЙ суб-скил: superpowers:executing-plans (или subagent-driven-development). Шаги отмечены чекбоксами (`- [ ]`).

**Цель:** девятый компонент этапа 1. Switch с подписью и без: нативный `<input type="checkbox" role="switch">` с `appearance: none`, дорожка 32×18 и ползунок, контракт `checked`/`defaultChecked`/`onCheckedChange`. Строка «переключатель + подпись» (и без подписи) имеет высоту контрола и стоит в одной линии с остальными контролами во всех пяти рядах; контраст дорожки к поверхности и ползунка к дорожке и кольцо фокуса проверяются на странице; компонент входит в матрицу формы пакета.

**Архитектура:** плоский компонент по образцу Checkbox: корень `<label data-s-kit>` (размер, `class`, `style`, подпись), внутри `span` с `input` (дорожка) и `span` ползунка; состояния рисуются CSS по `:checked`, `:hover`, `:disabled` самого `input`, ползунок сдвигается `transform` по соседнему селектору `.input:checked ~ .thumb`. Состояние через `createControllableSignal<boolean>`, возврат DOM к значению родителя при отказе. Остальные нативные атрибуты уходят на `input`.

**Стек:** как в этапе 0 и предыдущих планах этапа 1.

**Спеки:** `docs/superpowers/specs/2026-10-29-stage-1-simple-controls-design.md` (основной; раздел 3.8 описывает Switch, разделы 2 и 4 общие соглашения и страницу), `docs/superpowers/specs/2026-10-28-solid-kit-umbrella-design.md` (разделы 4.1, 5, 5.1, 7, 11.1, 12).

## Global Constraints

- Репозиторий публичный: ни ключей, ни токенов, ни `.env*` в коммитах. Не делать `git push`, не ставить теги в этом плане, не добавлять `LICENSE`, не менять git-идентичность, не переписывать историю (никаких `--amend`/`rebase`). Тег `v0.2.0` ставится в конце всего этапа 1, не здесь.
- Один класс — один файл; kebab-case; именованные экспорты; пропсы не деструктурируются (`splitProps`/`mergeProps`). Один компонент на файл (демо-компоненты playground тоже).
- В CSS компонентов: только токены, без литералов цветов, без `outline: none/0`, без голого `var(--s-kit-control-height)` (всегда с фолбэком `var(--s-kit-control-height, var(--s-kit-control-height-md))`).
- Стиль: ESLint (табы, одинарные кавычки, без висячих запятых, Stroustrup, max-len 140, `solid/reactivity` как ошибка: сигнал в тесте читать нельзя, использовать `vi.fn`), Stylelint (4 пробела, двойные кавычки, логические свойства; `pnpm exec stylelint --fix <файл>`). Перед каждым коммитом `pnpm check` зелёный.
- Коммиты оканчиваются трейлерами: `export TRAILERS=$'Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_017cEinKKFDiYmGrLaaKPqZu'`, затем `git commit -m "msg" -m "$TRAILERS"`.
- Dev-серверы убивать только по PID после проверки cwd (`lsof -a -p <PID> -d cwd -Fn`), никогда `pkill` по имени. Порт 5173 может быть занят чужим процессом: брать порт из вывода Vite.
- Браузерные проверки в Chrome. Кольца фокуса дают ложные FAIL, если проверки запущены щелчком мыши: запускать с клавиатуры (сфокусировать кнопку «Запустить проверки» через JS и нажать Enter) или сменой темы через переключатель. Координаты скриншота (1505 px) отличаются от CSS-пикселей страницы: клики по координатам из `getBoundingClientRect` пересчитывать (делить на `innerWidth / 1505`), прокрутку делать `scrollIntoView({behavior:'instant'})` и ждать. JS-инструмент иногда возвращает `[BLOCKED: Cookie/query string data]`: повторить коротким строковым результатом. Firefox и Safari не проверяются.
- Начало плана: `git status` чистый, `pnpm check` зелёный (223 теста).

---

### Task 1: Компонент Switch

**Files:**
- Create: `src/components/switch/switch.tsx`
- Create: `src/components/switch/switch.module.css`
- Create: `src/components/switch/index.ts`
- Test: `src/components/switch/switch.test.tsx`

**Interfaces:**
- Consumes: `createControllableSignal` из `../../utils/create-controllable-signal`.
- Produces: `Switch(props: SwitchProps): JSX.Element`; типы `SwitchProps`, `SwitchSize`; публичный путь `@stark/solid-kit/switch`; токены `--s-kit-switch-width`, `--s-kit-switch-height`, `--s-kit-switch-gap`.

- [ ] **Step 1: Написать падающие тесты**

Создать `src/components/switch/switch.test.tsx`:

```tsx
import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library';
import { createSignal } from 'solid-js';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Switch } from './switch';

afterEach(cleanup);

describe('Switch', () => {
	it('renders a native checkbox with the switch role named by its label text', () => {
		render(() => <Switch>Уведомления</Switch>);
		const input = screen.getByRole<HTMLInputElement>('switch', { name: 'Уведомления' });
		expect(input.type).toBe('checkbox');
		expect(input.checked).toBe(false);
	});

	it('works without a label when aria-label is given and renders no label text', () => {
		render(() => <Switch aria-label='Тёмная тема'/>);
		const input = screen.getByRole('switch', { name: 'Тёмная тема' });
		expect(input.closest('label')?.querySelector('[data-switch-label]')).toBeNull();
	});

	it('puts the kit root attributes on the label, not on the input', () => {
		render(() => <Switch aria-label='Переключатель'/>);
		const input = screen.getByRole('switch');
		expect(input.closest('label')?.hasAttribute('data-s-kit')).toBe(true);
		expect(input.hasAttribute('data-s-kit')).toBe(false);
	});

	it('sets data-s-kit-size on the root only when size is passed', () => {
		render(() => (
			<>
				<Switch aria-label='Без размера'/>
				<Switch aria-label='Большой' size='lg'/>
			</>
		));
		expect(screen.getByRole('switch', { name: 'Без размера' }).closest('label')?.hasAttribute('data-s-kit-size')).toBe(false);
		expect(screen.getByRole('switch', { name: 'Большой' }).closest('label')?.getAttribute('data-s-kit-size')).toBe('lg');
	});

	it('shows defaultChecked and reports toggling through onCheckedChange when uncontrolled', () => {
		const onCheckedChange = vi.fn();
		render(() => <Switch aria-label='Переключатель' defaultChecked onCheckedChange={onCheckedChange}/>);
		const input = screen.getByRole<HTMLInputElement>('switch');
		expect(input.checked).toBe(true);
		fireEvent.click(input);
		expect(onCheckedChange).toHaveBeenLastCalledWith(false);
		expect(input.checked).toBe(false);
		fireEvent.click(input);
		expect(onCheckedChange).toHaveBeenLastCalledWith(true);
		expect(input.checked).toBe(true);
	});

	it('toggles when the label text is clicked', () => {
		render(() => <Switch>Уведомления</Switch>);
		fireEvent.click(screen.getByText('Уведомления'));
		expect(screen.getByRole<HTMLInputElement>('switch').checked).toBe(true);
	});

	it('shows the controlled value and follows the parent', () => {
		const [checked, setChecked] = createSignal(true);
		const onCheckedChange = vi.fn((next: boolean) => setChecked(next));
		render(() => <Switch aria-label='Переключатель' checked={checked()} onCheckedChange={onCheckedChange}/>);
		const input = screen.getByRole<HTMLInputElement>('switch');
		expect(input.checked).toBe(true);
		fireEvent.click(input);
		expect(onCheckedChange).toHaveBeenLastCalledWith(false);
		expect(input.checked).toBe(false);
		setChecked(true);
		expect(input.checked).toBe(true);
	});

	it('returns to the controlled value when the parent does not accept the change', () => {
		const onCheckedChange = vi.fn();
		render(() => <Switch aria-label='Переключатель' checked={false} onCheckedChange={onCheckedChange}/>);
		const input = screen.getByRole<HTMLInputElement>('switch');
		fireEvent.click(input);
		expect(onCheckedChange).toHaveBeenCalledWith(true);
		expect(input.checked).toBe(false);
	});

	it('disables the input and marks the root when disabled', () => {
		const onCheckedChange = vi.fn();
		render(() => <Switch aria-label='Переключатель' disabled onCheckedChange={onCheckedChange}/>);
		const input = screen.getByRole<HTMLInputElement>('switch');
		expect(input.disabled).toBe(true);
		expect(input.closest('label')?.hasAttribute('data-disabled')).toBe(true);
		// fireEvent обходит disabled в jsdom, а нативный click() его уважает, как браузер
		input.click();
		expect(onCheckedChange).not.toHaveBeenCalled();
	});

	it('does not mark the root as disabled by default', () => {
		render(() => <Switch aria-label='Переключатель'/>);
		expect(screen.getByRole('switch').closest('label')?.hasAttribute('data-disabled')).toBe(false);
	});

	it('passes native attributes to the input and class and style to the root', () => {
		render(() => (
			<Switch
				aria-label='Переключатель'
				id='notify'
				name='notify'
				value='on'
				aria-describedby='hint'
				class='custom'
				style={{ color: 'red' }}
			/>
		));
		const input = screen.getByRole<HTMLInputElement>('switch');
		expect(input.id).toBe('notify');
		expect(input.name).toBe('notify');
		expect(input.value).toBe('on');
		expect(input.getAttribute('aria-describedby')).toBe('hint');
		const root = input.closest('label');
		expect(root?.classList.contains('custom')).toBe(true);
		expect(root?.style.color).toBe('red');
	});
});
```

- [ ] **Step 2: Убедиться, что тесты падают**

Run: `pnpm exec vitest run src/components/switch`
Expected: FAIL (модуль `./switch` не найден).

- [ ] **Step 3: Реализовать компонент**

Создать `src/components/switch/switch.tsx`:

```tsx
import styles from './switch.module.css';

import { children, type JSX, Show, splitProps } from 'solid-js';

import { createControllableSignal } from '../../utils/create-controllable-signal';

export type SwitchSize = 'sm' | 'md' | 'lg';

export interface SwitchProps
	extends Omit<
		JSX.InputHTMLAttributes<HTMLInputElement>,
		'class' | 'style' | 'size' | 'type' | 'role' | 'checked' | 'defaultChecked' | 'onChange' | 'onInput' | 'children'
	> {
	checked?: boolean | undefined;
	defaultChecked?: boolean | undefined;
	onCheckedChange?: ((checked: boolean) => void) | undefined;
	size?: SwitchSize | undefined;
	class?: string | undefined;
	style?: JSX.CSSProperties | undefined;
	/** Подпись. */
	children?: JSX.Element;
}

export function Switch(props: SwitchProps): JSX.Element {
	const [local, rest] = splitProps(props, [
		'checked',
		'defaultChecked',
		'onCheckedChange',
		'size',
		'class',
		'style',
		'children'
	]);
	const label = children(() => local.children);

	const [checked, setChecked] = createControllableSignal<boolean>({
		name: 'Switch',
		value: () => local.checked,
		defaultValue: () => local.defaultChecked ?? false,
		onChange: (next) => local.onCheckedChange?.(next)
	});

	const handleChange: JSX.EventHandler<HTMLInputElement, Event> = (event) => {
		setChecked(event.currentTarget.checked);
		// контролируемый режим: родитель мог не принять значение, тогда переключатель возвращается к нему
		if (event.currentTarget.checked !== checked()) {
			event.currentTarget.checked = checked();
		}
	};

	return (
		<label
			data-s-kit
			data-s-kit-size={local.size}
			data-disabled={rest.disabled ? '' : undefined}
			class={local.class ? `${styles['root']} ${local.class}` : styles['root']}
			style={local.style}
		>
			<span class={styles['box']}>
				<input
					{...rest}
					type='checkbox'
					role='switch'
					class={styles['input']}
					checked={checked()}
					onChange={handleChange}
				/>
				<span class={styles['thumb']} data-switch-thumb aria-hidden='true'/>
			</span>
			<Show when={label.toArray().length > 0}>
				<span class={styles['label']} data-switch-label>{label()}</span>
			</Show>
		</label>
	);
}
```

- [ ] **Step 4: CSS**

Создать `src/components/switch/switch.module.css`:

```css
/*
 * Компонентные токены Switch (публичный API кастомизации, читаются с фолбэком на глобальные):
 *   --s-kit-switch-width, --s-kit-switch-height, --s-kit-switch-gap
 * Корень label имеет высоту контрола (спек этапа 1, раздел 3.8); дорожка это нативный input с appearance: none,
 * ползунок соседний span, его сдвиг transform не влияет на раскладку. Кольцо фокуса на самом input.
 */

.root {
    cursor: pointer;
    user-select: none;

    display: inline-flex;
    flex: none;
    gap: var(--s-kit-switch-gap, 8px);
    align-items: center;

    box-sizing: border-box;
    block-size: var(--s-kit-control-height, var(--s-kit-control-height-md));

    font-family: var(--s-kit-font);
    font-size: var(--s-kit-control-font-size, var(--s-kit-control-font-size-md));
    line-height: 1.25;
    color: var(--s-kit-color-text);
}

.root[data-disabled] {
    cursor: not-allowed;
    opacity: var(--s-kit-disabled-opacity);
}

.box {
    position: relative;
    display: inline-grid;
    flex: none;
}

.input {
    cursor: inherit;

    appearance: none;

    box-sizing: border-box;
    inline-size: var(--s-kit-switch-width, 32px);
    block-size: var(--s-kit-switch-height, 18px);
    margin: 0;
    border: 0;
    border-radius: var(--s-kit-switch-height, 18px);

    background: var(--s-kit-color-control-edge);

    transition: background-color 150ms;
}

.input:checked {
    background: var(--s-kit-color-primary);
}

.input:checked:hover:not(:disabled) {
    background: var(--s-kit-color-primary-hover);
}

.input:checked:active:not(:disabled) {
    background: var(--s-kit-color-primary-active);
}

.input:focus-visible {
    outline: var(--s-kit-focus-width) solid var(--s-kit-color-focus-ring);
    outline-offset: var(--s-kit-focus-ring-offset, var(--s-kit-focus-offset));
}

.input:checked:focus-visible {
    outline-color: var(--s-kit-focus-ring-on-fill, var(--s-kit-color-focus-ring));
}

.thumb {
    pointer-events: none;

    position: absolute;
    inset-block-start: 2px;
    inset-inline-start: 2px;

    inline-size: calc(var(--s-kit-switch-height, 18px) - 4px);
    block-size: calc(var(--s-kit-switch-height, 18px) - 4px);
    border-radius: 50%;

    background: var(--s-kit-color-surface);

    transition: transform 150ms, background-color 150ms;
}

.input:checked ~ .thumb {
    background: var(--s-kit-color-primary-contrast);
    transform: translateX(calc(var(--s-kit-switch-width, 32px) - var(--s-kit-switch-height, 18px)));
}

@media (prefers-reduced-motion: reduce) {
    .input,
    .thumb {
        transition: none;
    }
}
```

Run: `pnpm exec stylelint --fix src/components/switch/switch.module.css`
Expected: без замечаний (порядок свойств поправит сам).

- [ ] **Step 5: Публичный путь**

Создать `src/components/switch/index.ts`:

```ts
export type { SwitchProps, SwitchSize } from './switch';
export { Switch } from './switch';
```

- [ ] **Step 6: Проверки**

Run: `pnpm exec eslint --fix src/components/switch && pnpm check`
Expected: зелёный, тестов 223 + 11 = 234 (точное число записать по факту). Если TypeScript или `solid/reactivity` придираются, поправить без изменения публичного API из спека и записать причину.

- [ ] **Step 7: Закоммитить**

```bash
git add src/components/switch
git commit -m "feat: Switch, переключатель с подписью, дорожкой и ползунком на нативном checkbox" -m "$TRAILERS"
```

---

### Task 2: Switch в playground и проверки

**Files:**
- Modify: `playground/src/demo-controls.tsx`
- Create: `playground/src/demo-switches.tsx`
- Create: `playground/src/switch-checks.ts`
- Modify: `playground/src/controls-row-page.tsx`
- Modify: `playground/src/playground.css`

**Interfaces:**
- Consumes: `Switch` из `@stark/solid-kit/switch`; `blend`, `contrastRatio`, `Rgb` из `../../src/utils/color-math`; `CheckResult`, `resolveColor`, `Rgba` из `./theme-checks`.
- Produces: два контрола ряда (`switch`, `switch-bare`, оба с `data-row-control` на `input`; корень измеряет `row-checks.ts` как ближайший `[data-s-kit]`); раздел с демо (`data-switch-demo` на `input`: `off`, `on`) и недоступным переключателем; `runSwitchChecks(page: HTMLElement): CheckResult[]`; два переключателя в блоках фокуса (`data-focus-name='switch'`, `'switch-on'`).

- [ ] **Step 1: Переключатели в ряду**

В `playground/src/demo-controls.tsx` добавить `import { Switch } from '@stark/solid-kit/switch';` (по порядку импортов, после `radio-group`) и в конец массива `DEMO_CONTROLS` (запятую после `radio-group` добавить):

```tsx
	{
		id: 'switch',
		render: (size) => <Switch data-row-control='switch' defaultChecked size={size}>Переключатель</Switch>
	},
	{
		id: 'switch-bare',
		render: (size) => <Switch data-row-control='switch-bare' aria-label='Без подписи' size={size}/>
	}
```

- [ ] **Step 2: Раздел с демо**

Создать `playground/src/demo-switches.tsx`:

```tsx
import { Switch } from '@stark/solid-kit/switch';
import type { JSX } from 'solid-js';

/** Выключенный и включённый переключатели для проверок в switch-checks.ts плюс недоступные. */
export function DemoSwitches(): JSX.Element {
	return (
		<div class='switch-demos'>
			<Switch data-switch-demo='off'>Выключен</Switch>
			<Switch data-switch-demo='on' defaultChecked>Включён</Switch>
			<Switch disabled>Недоступен</Switch>
			<Switch disabled defaultChecked>Недоступен включённый</Switch>
		</div>
	);
}
```

В `playground/src/playground.css` рядом с `.radio-demos` добавить:

```css
.switch-demos {
    display: flex;
    flex-wrap: wrap;
    gap: 24px;
    align-items: center;
}
```

- [ ] **Step 3: Проверки переключателя**

Создать `playground/src/switch-checks.ts`:

```ts
import { blend, contrastRatio, type Rgb } from '../../src/utils/color-math';

import { type CheckResult, resolveColor, type Rgba } from './theme-checks';

function rgb([red, green, blue]: Rgba): Rgb {
	return [red, green, blue];
}

/** Цвет поверх поверхности страницы (дорожка выключенного переключателя полупрозрачна). */
function over(color: Rgba, surface: Rgba): Rgb {
	return blend(rgb(color), color[3] / 255, rgb(surface));
}

/**
 * Роль switch, связь подписи и переключателя, контраст дорожки к поверхности и ползунка к дорожке
 * у каждого переключателя с data-switch-demo.
 */
export function runSwitchChecks(page: HTMLElement): CheckResult[] {
	const results: CheckResult[] = [];
	const check = (name: string, ok: boolean, detail: string): void => {
		results.push({ name, ok, detail });
	};
	const surface = resolveColor(getComputedStyle(page).backgroundColor);

	for (const input of page.querySelectorAll<HTMLInputElement>('[data-switch-demo]')) {
		const id = input.dataset['switchDemo'] ?? '?';
		const root = input.closest('label');
		const thumb = input.parentElement?.querySelector('[data-switch-thumb]');
		if (!root || !thumb) {
			throw new Error(`Playground element is missing in Switch ${id}`);
		}
		check(`Switch ${id}: роль switch`, input.getAttribute('role') === 'switch', `role = ${input.getAttribute('role') ?? 'null'}`);
		check(`Switch ${id}: подпись связана с переключателем`, root.control === input, `label.control = ${root.control?.tagName ?? 'null'}`);

		const track = over(resolveColor(getComputedStyle(input).backgroundColor), surface);
		const trackRatio = contrastRatio(track, rgb(surface));
		check(`Switch ${id}: дорожка контрастна к поверхности (3:1)`, trackRatio >= 3, `контраст ${trackRatio.toFixed(2)}:1`);

		const thumbRatio = contrastRatio(rgb(resolveColor(getComputedStyle(thumb).backgroundColor)), track);
		check(`Switch ${id}: ползунок контрастен к дорожке (3:1)`, thumbRatio >= 3, `контраст ${thumbRatio.toFixed(2)}:1`);
	}
	return results;
}
```

- [ ] **Step 4: Подключить на страницу**

В `playground/src/controls-row-page.tsx`:
1. импорты: `import { Switch } from '@stark/solid-kit/switch';`, `import { DemoSwitches } from './demo-switches';`, `import { runSwitchChecks } from './switch-checks';` (порядок поправит `eslint --fix`);
2. в `renderFocusControls()` в конец массива (запятую после предыдущего элемента добавить) добавить:

```tsx
		<Switch aria-label='Переключатель' data-focus-name='switch'/>,
		<Switch aria-label='Включённый переключатель' defaultChecked data-focus-name='switch-on'/>
```

3. в `runChecks` добавить `...runSwitchChecks(page)` последним элементом списка;
4. после раздела RadioGroup добавить раздел:

```tsx
			<section>
				<h2>Switch: состояния и контраст дорожки и ползунка</h2>
				<DemoSwitches/>
			</section>
```

- [ ] **Step 5: Статическая проверка**

Run: `pnpm exec eslint --fix playground/src && pnpm exec stylelint --fix "playground/src/**/*.css" && pnpm check`
Expected: зелёный, тесты как в конце Task 1.

- [ ] **Step 6: Проверка в браузере (Chrome)**

`pnpm dev` в фоне (PID сохранить, порт из вывода Vite), открыть `<адрес>/#controls-row`, запустить проверки с клавиатуры, затем темы light, dark, system через переключатель (ждать 700 мс; в system вернуться через другую тему).

Expected в каждой теме:
- в каждом из пяти рядов переключатель с подписью и без подписи стоят на одной линии с остальными контролами, верх и низ корней совпадают с соседями;
- **все проверки OK**, число должно стать 307 (было 277: +10 высот двух переключателей в пяти рядах, +12 колец у двух переключателей в двух блоках фокуса, +8 проверок двух демо: роль, подпись, контраст дорожки, контраст ползунка). Если число или результат другие, выяснить причину до коммита;
- контраст дорожки к поверхности и ползунка к дорожке не ниже 3:1 в обеих теме (значения записать в итоги);
- реальными действиями: щелчок по подписи «Выключен» включает (ползунок сдвигается вправо); Tab даёт кольцо у переключателя (снаружи в обычном блоке, внутри в блоке с `data-s-kit-focus-inset`), Space переключает; недоступный не реагирует;
- глазами: включённый, выключенный и недоступные выглядят по разделу 3.8 в обеих темах (ползунок на 2 px от края дорожки, не вылезает); консоль при загрузке чистая (перезагрузить страницу и прочитать консоль после этого).

Остановить dev-сервер по PID (после проверки cwd).

- [ ] **Step 7: Закоммитить**

```bash
git add playground
git commit -m "feat(playground): Switch в рядах, демо, проверки контраста и кольца" -m "$TRAILERS"
```

---

### Task 3: Switch в матрице формы пакета

**Files:**
- Modify: `scripts/consumer/src/main.tsx`
- Modify: `scripts/verify-package-form.sh`

**Interfaces:**
- Consumes: путь `@stark/solid-kit/switch`; токен `--s-kit-switch-width` как маркер стилей в собранном CSS.
- Produces: один новый пункт матрицы (стили Switch в CSS; порядка нет: `composes` не используется).

- [ ] **Step 1: Потребитель импортирует Switch**

В `scripts/consumer/src/main.tsx` добавить `import { Switch } from '@stark/solid-kit/switch';` (по порядку, после `radio-group`) и рядом с остальными элементами:

```tsx
			<Switch defaultChecked>Уведомления</Switch>
```

- [ ] **Step 2: Проверка сборки**

В `scripts/verify-package-form.sh` после пункта про RadioGroup добавить:

```bash
grep -lq -- '--s-kit-switch-width' dist/assets/*.css && ok "Switch styles are in the built CSS" || fail "Switch styles are missing from the built CSS"
```

- [ ] **Step 3: Коммит и прогон матрицы**

```bash
git add scripts
git commit -m "test: Switch в матрице формы пакета" -m "$TRAILERS"
scripts/verify-package-form.sh "$(git rev-parse HEAD)"
```

Expected: все пункты OK, включая новый; `tsc` потребителя проходит на TypeScript 5.9.3 и 7.0.2.

- [ ] **Step 4: Удалить временный проект-потребитель**

Скрипт печатает `consumer project kept at: ...`; проверить, что каталог лежит вне репозитория (`/var/folders/.../solid-kit-consumer.*`), и удалить его (`git status` чистый).

---

### Task 4: Закрытие плана в спеке

**Files:**
- Modify: `docs/superpowers/specs/2026-10-29-stage-1-simple-controls-design.md`

- [ ] **Step 1: Таблица порядка и итоги**

В таблице порядка (раздел 1) у строки Switch добавить **Готов** и коммиты (`git log --oneline -5`), с точкой в конце ячейки, как у соседних строк. Добавить раздел «16. Итоги Switch (2026-10-29)» по образцу разделов 8–15: число проверок страницы, измеренные контрасты в обеих темах, результаты реальных щелчков и клавиш, кольцо снаружи и внутри, что матрица зелёная на обоих TypeScript, отличия от плана по ходу работы и список непроверенного: Firefox 125, Safari 17.5 (`appearance: none`, `role="switch"` на checkbox), hover и active мышью, `forced-colors` (дорожка и ползунок рисуются заливкой), экранный диктор (проверена только разметка: роль `switch` и нативный `checked`), RTL. Если по ходу принималось решение, отличающееся от раздела 3.8, исправить раздел 3.8 тем же коммитом. Дополнить раздел 2 пометкой об анимациях: правило «размеры и позиция не анимируются» относится к свойствам раскладки, `transform` ползунка Switch допустим (решение раздела 3.8).

- [ ] **Step 2: Итоговая проверка и коммит**

Run: `pnpm check` и `git status` (чисто). Затем:

```bash
git add docs
git commit -m "docs: Switch готов" -m "$TRAILERS"
```

Тег не ставится. Следующий компонент по порядку: NumericInput.

---

## Самопроверка плана

- **Покрытие спека (раздел 3.8):** атрибуты на корень и на `input` (Task 1), роль `switch` (Task 1 тест и код, проверка на странице Task 2), controlled/uncontrolled и возврат при отказе (Task 1), высота корня (Task 1 CSS, проверка рядов Task 2), цвета дорожки и ползунка и их контраст (Task 1 CSS, Task 2 проверки), кольцо фокуса (Task 2, блоки фокуса), анимации и их отключение (Task 1 CSS), токены (Task 1, маркер Task 3), закрытие и уточнение правила раздела 2 (Task 4).
- **Типы:** `SwitchProps` и `SwitchSize` экспортируются из `index.ts`; `data-switch-demo` ставится на `input` через `rest` и читается как `dataset['switchDemo']`; `data-switch-thumb` ставится в компоненте и читается тем же селектором; `data-row-control` на `input` измеряется через ближайший `[data-s-kit]`; число 307 выведено расчётом (10 + 12 + 8), тесты 234 (223 + 11).
- **Известные риски:** сдвиг ползунка по `calc` из токенов (ползунок обязан остановиться на 2 px от правого края, проверить глазами и в итогах); `role="switch"` на `input type=checkbox` и перечисление в `Omit` типа `role` (если TypeScript не принимает атрибут `role` на `input` после `Omit`, оставить явный `role='switch'` и записать причину); `appearance: none` в Firefox 125 и Safari 17.5 не проверяется.
- **Не покрыто сознательно:** красное состояние ошибки, подписи внутри дорожки, иконки в ползунке, RTL.
