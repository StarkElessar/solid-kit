# solid-kit, этап 1: Button — план реализации

> **Для исполнителей:** ОБЯЗАТЕЛЬНЫЙ суб-скил: superpowers:executing-plans (или subagent-driven-development). Шаги отмечены чекбоксами (`- [ ]`).

**Цель:** первый компонент этапа 1. Button с четырьмя вариантами, общая CSS-основа контролов, токены фокуса на заливке, страница playground «Контролы в ряд» с проверкой высот, контраста и кольца фокуса, Button в матрице формы пакета.

**Архитектура:** плоский компонент на `splitProps`/`mergeProps`; общая основа в `src/styles/control-base.module.css`, подключается через `composes`; состояния выражены атрибутами (`data-variant`), цвета только токены. Playground получает хэш-навигацию и вторую страницу; проверки в браузере по образцу `theme-checks.ts`.

**Стек:** как в этапе 0.

**Спеки:** `docs/superpowers/specs/2026-10-29-stage-1-simple-controls-design.md` (основной), `docs/superpowers/specs/2026-10-28-solid-kit-umbrella-design.md` (разделы 4.1, 5, 5.1, 7, 11, 12).

## Global Constraints

- Репозиторий публичный: ни ключей, ни токенов, ни `.env*` в коммитах. Не делать `git push`, не ставить теги в этом плане, не добавлять `LICENSE`, не менять git-идентичность. Тег `v0.2.0` ставится в конце всего этапа 1, не здесь.
- Один класс — один файл; kebab-case; именованные экспорты; пропсы не деструктурируются (`splitProps`/`mergeProps`).
- В CSS компонентов: только токены, без литералов цветов, без `outline: none/0`, без голого `var(--s-kit-control-height)`.
- Стиль: ESLint (табы, одинарные кавычки, без висячих запятых, Stroustrup, max-len 140), Stylelint (4 пробела, двойные кавычки, логические свойства). Перед каждым коммитом `pnpm check` зелёный.
- Коммиты оканчиваются трейлерами: `export TRAILERS=$'Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_017cEinKKFDiYmGrLaaKPqZu'`, затем `git commit -m "msg" -m "$TRAILERS"`.
- Dev-серверы убивать только по PID после проверки cwd, никогда `pkill` по имени. Порт 5173 может быть занят чужим процессом: брать порт из вывода Vite.
- Браузерные проверки в Chrome; Firefox и Safari не проверяются (записывается в отчёте).

---

### Task 1: Токены фокуса на заливке, `danger-active`, `disabled-opacity`

**Files:**
- Modify: `src/styles/tokens.css`
- Modify: `src/styles/tokens.test.ts`
- Modify: `stylelint.config.js`
- Modify: `src/styles/stylelint-rules.test.ts`

**Interfaces:**
- Produces: `--s-kit-color-danger-active`, `--s-kit-disabled-opacity`, `--s-kit-focus-ring-on-fill` (объявляется только внутри `[data-s-kit-focus-inset]`); правило stylelint, запрещающее голое `var(--s-kit-control-height)` в `src/components/**/*.css` и `src/styles/**/*.module.css`.

- [ ] **Step 1: Дополнить тест токенов (падающий)**

В `src/styles/tokens.test.ts`:
- в `DERIVED_COLORS` после `'danger-hover'` добавить `'danger-active'`;
- в `OTHER_TOKENS` после `'focus-space'` добавить `'disabled-opacity'`;
- в `pairs` блока контраста добавить `['primary-contrast', 'danger']`;
- в `describe('token contract')` после теста про `data-s-kit-size` добавить:

```ts
	it('sets the on-fill focus ring colour only inside a focus-inset container', () => {
		expect(tokens).toMatch(/\[data-s-kit-focus-inset\]\s*{[^}]*--s-kit-focus-ring-on-fill:\s*var\(--s-kit-color-primary-contrast\)/);
		expect(tokens.match(/--s-kit-focus-ring-on-fill:/g)).toHaveLength(1);
	});
```

(единственное объявление важно: если объявить значение и в `[data-s-kit]`, оно перекрыло бы унаследованное от контейнера.)

- [ ] **Step 2: Запустить тест и убедиться, что он падает**

Run: `pnpm vitest run src/styles/tokens.test.ts`
Expected: FAIL (нет `danger-active`, `disabled-opacity`, `focus-ring-on-fill`).

- [ ] **Step 3: Добавить токены**

В `src/styles/tokens.css`:
- в блок `:root` после `--s-kit-focus-offset: 2px;` добавить строку `--s-kit-disabled-opacity: 0.45;` (с пояснением в комментарии «фокус (раздел 5.1)» не нужно; добавить отдельный комментарий `/* недоступное состояние контролов */` перед ней);
- в блоке `:root, [data-s-kit]` после `--s-kit-color-danger-hover: ...` добавить
  `--s-kit-color-danger-active: color-mix(in oklch, var(--s-kit-color-danger), var(--s-kit-color-text) 26%);`
- в конце файла блок `[data-s-kit-focus-inset]` заменить на:

```css
/* внутреннее кольцо фокуса для потомков обрезающего контейнера (раздел 5.1) */
[data-s-kit-focus-inset] {
    --s-kit-focus-ring-offset: calc(-1 * var(--s-kit-focus-width));

    /* внутри кольцо ложится на заливку компонента, кольцо цвета primary поверх заливки primary даёт 1:1 */
    --s-kit-focus-ring-on-fill: var(--s-kit-color-primary-contrast);
}
```

- [ ] **Step 4: Правило stylelint про голый `var(--s-kit-control-height)`**

В `stylelint.config.js` в `componentRules` расширить `'declaration-property-value-disallowed-list'`:

```js
	'declaration-property-value-disallowed-list': [
		{
			outline: ['none', '0'],
			'outline-style': ['none'],
			// единое правило разрешения размера (раздел 5): без фолбэка контрол вне обёртки остаётся без высоты
			'/.+/': [/var\(--s-kit-control-height\)/]
		},
		{ message: 'Do not remove the focus indicator and always give --s-kit-control-height a fallback.' }
	]
```

и поменять `overrides` на `files: ['src/components/**/*.css', 'src/styles/**/*.module.css']`.

В `src/styles/stylelint-rules.test.ts` добавить тесты (в конец `describe`):

```ts
	it('forbids var(--s-kit-control-height) without a fallback in component CSS', async () => {
		const rules = await lint('.a {\n    block-size: var(--s-kit-control-height);\n}\n', COMPONENT_FILE);
		expect(rules).toContain('declaration-property-value-disallowed-list');
	});

	it('allows var(--s-kit-control-height, var(--s-kit-control-height-md))', async () => {
		const code = '.a {\n    block-size: var(--s-kit-control-height, var(--s-kit-control-height-md));\n}\n';
		expect(await lint(code, COMPONENT_FILE)).toEqual([]);
	});
```

- [ ] **Step 5: Проверка**

Run: `pnpm check`
Expected: всё зелёное (тесты токенов и stylelint проходят). Если `declaration-property-value-disallowed-list` с ключом `/.+/` не срабатывает на `block-size`, проверить синтаксис регулярного ключа (`'/.+/'` строкой с слэшами) и значение-регулярку.

- [ ] **Step 6: Commit**

```bash
git add src/styles stylelint.config.js
git commit -m "feat(tokens): danger-active, disabled-opacity, кольцо фокуса на заливке, правило про фолбэк высоты" -m "$TRAILERS"
```

---

### Task 2: Общая основа контролов и Button

**Files:**
- Create: `src/styles/control-base.module.css`
- Create: `src/components/button/button.tsx`
- Create: `src/components/button/button.module.css`
- Create: `src/components/button/index.ts`
- Test: `src/components/button/button.test.tsx`

**Interfaces:**
- Consumes: токены Task 1 и этапа 0.
- Produces: `Button`, `ButtonProps`, `ButtonVariant`, `ButtonSize` (экспорт из `src/components/button/index.ts`, подпуть `@stark/solid-kit/button`); класс `control` в `control-base.module.css` для `composes`.

- [ ] **Step 1: Написать падающие тесты**

`src/components/button/button.test.tsx`:

```tsx
import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Button } from './button';

afterEach(cleanup);

describe('Button', () => {
	it('renders a native button with type=button and the kit root attribute', () => {
		render(() => <Button>Сохранить</Button>);
		const button = screen.getByRole('button', { name: 'Сохранить' });
		expect(button.tagName).toBe('BUTTON');
		expect(button.getAttribute('type')).toBe('button');
		expect(button.hasAttribute('data-s-kit')).toBe(true);
	});

	it('is primary by default', () => {
		render(() => <Button>Да</Button>);
		expect(screen.getByRole('button').getAttribute('data-variant')).toBe('primary');
	});

	it.each(['primary', 'tinted', 'plain', 'danger'] as const)('sets data-variant for %s', (variant) => {
		render(() => <Button variant={variant}>Да</Button>);
		expect(screen.getByRole('button').getAttribute('data-variant')).toBe(variant);
	});

	it('sets data-s-kit-size only when size is passed', () => {
		render(() => (
			<>
				<Button>Без размера</Button>
				<Button size='lg'>Большая</Button>
			</>
		));
		expect(screen.getByRole('button', { name: 'Без размера' }).hasAttribute('data-s-kit-size')).toBe(false);
		expect(screen.getByRole('button', { name: 'Большая' }).getAttribute('data-s-kit-size')).toBe('lg');
	});

	it('does not call onClick when disabled and calls it otherwise', () => {
		const onClick = vi.fn();
		render(() => (
			<>
				<Button disabled onClick={onClick}>Выключена</Button>
				<Button onClick={onClick}>Включена</Button>
			</>
		));
		const disabled = screen.getByRole<HTMLButtonElement>('button', { name: 'Выключена' });
		expect(disabled.disabled).toBe(true);
		disabled.click();
		expect(onClick).not.toHaveBeenCalled();
		fireEvent.click(screen.getByRole('button', { name: 'Включена' }));
		expect(onClick).toHaveBeenCalledOnce();
	});

	it('forwards native attributes, class and style', () => {
		render(() => (
			<Button aria-label='Закрыть' class='extra' style={{ 'margin-inline-start': '4px' }} data-testid='b'>
				×
			</Button>
		));
		const button = screen.getByTestId('b');
		expect(button.getAttribute('aria-label')).toBe('Закрыть');
		expect(button.classList.contains('extra')).toBe(true);
		expect(button.style.marginInlineStart).toBe('4px');
	});

	it('lets the type be overridden', () => {
		render(() => <Button type='submit'>Отправить</Button>);
		expect(screen.getByRole('button').getAttribute('type')).toBe('submit');
	});

	it('renders element children', () => {
		render(() => (
			<Button>
				<span data-testid='icon'>★</span> Звезда
			</Button>
		));
		expect(screen.getByTestId('icon').textContent).toBe('★');
	});
});
```

- [ ] **Step 2: Запустить и убедиться, что падают**

Run: `pnpm vitest run src/components/button`
Expected: FAIL (`./button` не найден).

- [ ] **Step 3: Общая основа контролов**

`src/styles/control-base.module.css`:

```css
/*
 * Общая основа контролов этапа 1 (спек этапа 1, раздел 2): размер по разделу 5, шрифт, кольцо фокуса, недоступное состояние.
 * Подключается через composes; цвета, границу и скругление добавляет компонент.
 */

.control {
    cursor: pointer;

    display: inline-flex;
    align-items: center;
    justify-content: center;

    box-sizing: border-box;
    block-size: var(--s-kit-control-height, var(--s-kit-control-height-md));
    padding-block: 0;
    padding-inline: var(--s-kit-control-padding-x, var(--s-kit-control-padding-x-md));
    border: 0;
    border-radius: var(--s-kit-radius);

    font-family: var(--s-kit-font);
    font-size: var(--s-kit-control-font-size, var(--s-kit-control-font-size-md));
    line-height: 1;
    white-space: nowrap;

    transition: background-color 150ms, border-color 150ms;
}

.control:focus-visible {
    outline: var(--s-kit-focus-width) solid var(--s-kit-color-focus-ring);
    outline-offset: var(--s-kit-focus-ring-offset, var(--s-kit-focus-offset));
}

.control:disabled {
    cursor: not-allowed;
    opacity: var(--s-kit-disabled-opacity);
}

@media (prefers-reduced-motion: reduce) {
    .control {
        transition: none;
    }
}
```

- [ ] **Step 4: CSS Button**

`src/components/button/button.module.css`:

```css
/*
 * Компонентные токены Button (публичный API кастомизации, читаются с фолбэком на глобальные):
 *   --s-kit-button-bg, --s-kit-button-bg-hover, --s-kit-button-bg-active, --s-kit-button-color, --s-kit-button-radius
 * Варианты задаются атрибутом data-variant: primary, tinted, plain, danger.
 */

.root {
    composes: control from "../../styles/control-base.module.css";

    border-radius: var(--s-kit-button-radius, var(--s-kit-radius));
    font-weight: 500;
}

.root[data-variant="primary"] {
    color: var(--s-kit-button-color, var(--s-kit-color-primary-contrast));
    background: var(--s-kit-button-bg, var(--s-kit-color-primary));
}

.root[data-variant="primary"]:hover:not(:disabled) {
    background: var(--s-kit-button-bg-hover, var(--s-kit-color-primary-hover));
}

.root[data-variant="primary"]:active:not(:disabled) {
    background: var(--s-kit-button-bg-active, var(--s-kit-color-primary-active));
}

.root[data-variant="primary"]:focus-visible {
    outline-color: var(--s-kit-focus-ring-on-fill, var(--s-kit-color-focus-ring));
}

.root[data-variant="tinted"] {
    color: var(--s-kit-button-color, var(--s-kit-color-text));
    background: var(--s-kit-button-bg, var(--s-kit-color-tint));
}

.root[data-variant="tinted"]:hover:not(:disabled) {
    background: var(--s-kit-button-bg-hover, var(--s-kit-color-tint-hover));
}

.root[data-variant="tinted"]:active:not(:disabled) {
    background: var(--s-kit-button-bg-active, var(--s-kit-color-tint-active));
}

.root[data-variant="plain"] {
    color: var(--s-kit-button-color, var(--s-kit-color-text));
    background: var(--s-kit-button-bg, transparent);
}

.root[data-variant="plain"]:hover:not(:disabled) {
    background: var(--s-kit-button-bg-hover, var(--s-kit-color-hover));
}

.root[data-variant="plain"]:active:not(:disabled) {
    background: var(--s-kit-button-bg-active, var(--s-kit-color-tint));
}

.root[data-variant="danger"] {
    color: var(--s-kit-button-color, var(--s-kit-color-primary-contrast));
    background: var(--s-kit-button-bg, var(--s-kit-color-danger));
}

.root[data-variant="danger"]:hover:not(:disabled) {
    background: var(--s-kit-button-bg-hover, var(--s-kit-color-danger-hover));
}

.root[data-variant="danger"]:active:not(:disabled) {
    background: var(--s-kit-button-bg-active, var(--s-kit-color-danger-active));
}

.root[data-variant="danger"]:focus-visible {
    outline-color: var(--s-kit-focus-ring-on-fill, var(--s-kit-color-focus-ring));
}
```

- [ ] **Step 5: Компонент**

`src/components/button/button.tsx`:

```tsx
import styles from './button.module.css';

import { type JSX, mergeProps, splitProps } from 'solid-js';

export type ButtonVariant = 'primary' | 'tinted' | 'plain' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, 'class' | 'style'> {
	variant?: ButtonVariant | undefined;
	size?: ButtonSize | undefined;
	class?: string | undefined;
	style?: JSX.CSSProperties | undefined;
}

export function Button(props: ButtonProps): JSX.Element {
	const merged = mergeProps({ variant: 'primary', type: 'button' } as const, props);
	const [local, rest] = splitProps(merged, ['variant', 'size', 'class', 'style']);

	return (
		<button
			{...rest}
			data-s-kit
			data-variant={local.variant}
			data-s-kit-size={local.size}
			class={local.class ? `${styles['root']} ${local.class}` : styles['root']}
			style={local.style}
		/>
	);
}
```

`src/components/button/index.ts`:

```ts
export type { ButtonProps, ButtonSize, ButtonVariant } from './button';
export { Button } from './button';
```

- [ ] **Step 6: Прогнать тесты и линт**

Run: `pnpm check`
Expected: зелёный. Линтер может потребовать правок стиля (`--fix`); `no-descending-specificity` у Stylelint в варианте `plain` не ожидается. Если `splitProps` ругается на типы из-за `as const` у `mergeProps`, заменить на `mergeProps({ variant: 'primary' satisfies ButtonVariant, type: 'button' as const }, props)`.

- [ ] **Step 7: Commit**

```bash
git add src/styles/control-base.module.css src/components/button
git commit -m "feat(button): Button с вариантами primary, tinted, plain, danger и общая основа контролов" -m "$TRAILERS"
```

---

### Task 3: Playground: навигация и страница «Контролы в ряд» с проверкой высот

**Files:**
- Create: `playground/src/pick.ts`, `playground/src/app.tsx`, `playground/src/controls-row-page.tsx`, `playground/src/control-rows.ts`, `playground/src/demo-controls.tsx`, `playground/src/row-checks.ts`
- Modify: `playground/src/main.tsx`, `playground/src/themes-page.tsx`, `playground/src/playground.css`

**Interfaces:**
- Consumes: `Button` (`@stark/solid-kit/button`), `CheckResult` из `theme-checks.ts`.
- Produces: `DEMO_CONTROLS` (реестр контролов этапа, пополняется планами следующих компонентов), `ROWS` (пять рядов раздела 5), `runRowChecks(page)`.

- [ ] **Step 1: `pick.ts` и правка страницы «Темы»**

`playground/src/pick.ts`:

```ts
/** Выбирает значение из списка допустимых по строке из DOM; иначе запасное. */
export function pick<T extends string>(options: readonly T[], value: string, fallback: T): T {
	return options.find((option) => option === value) ?? fallback;
}
```

В `playground/src/themes-page.tsx` удалить локальную функцию `pick` и добавить `import { pick } from './pick';` (в блок относительных импортов, по порядку `simple-import-sort`).

- [ ] **Step 2: Реестр контролов и ряды**

`playground/src/demo-controls.tsx`:

```tsx
import { Button } from '@stark/solid-kit/button';
import type { JSX } from 'solid-js';

import type { ControlSize } from './control-rows';

export interface DemoControl {
	readonly id: string;
	readonly render: (size: ControlSize | undefined) => JSX.Element;
}

/** Контролы, показанные в каждом из пяти рядов. Каждый план этапа 1 добавляет сюда свои компоненты. */
export const DEMO_CONTROLS: readonly DemoControl[] = [
	{ id: 'button-primary', render: (size) => <Button data-row-control='button-primary' size={size}>Основная</Button> },
	{ id: 'button-tinted', render: (size) => <Button data-row-control='button-tinted' variant='tinted' size={size}>Тонированная</Button> },
	{ id: 'button-plain', render: (size) => <Button data-row-control='button-plain' variant='plain' size={size}>Простая</Button> },
	{ id: 'button-danger', render: (size) => <Button data-row-control='button-danger' variant='danger' size={size}>Удалить</Button> }
];
```

`playground/src/control-rows.ts`:

```ts
export type ControlSize = 'sm' | 'md' | 'lg';

export const CONTROL_SIZES: readonly ControlSize[] = ['sm', 'md', 'lg'];

export interface RowSpec {
	readonly id: string;
	readonly title: string;
	/** Размер на обёртке ряда (`data-s-kit-size`); без него обёртки нет. */
	readonly wrapperSize?: ControlSize;
	/** Локальный `size` контрола с данным номером; `undefined`: проп не передаётся. */
	readonly sizeFor: (index: number) => ControlSize | undefined;
}

/** Пять рядов раздела 5 зонтичного спека. */
export const ROWS: readonly RowSpec[] = [
	{ id: 'row-1', title: '1. Без size и без обёртки (фолбэк на md)', sizeFor: () => undefined },
	{ id: 'row-2', title: '2. Обёртка sm, у контролов size нет', wrapperSize: 'sm', sizeFor: () => undefined },
	{ id: 'row-3', title: '3. Обёртка lg, у контролов size нет', wrapperSize: 'lg', sizeFor: () => undefined },
	{
		id: 'row-4',
		title: '4. Обёртка sm, у части контролов локально size="lg"',
		wrapperSize: 'sm',
		sizeFor: (index) => (index % 2 === 1 ? 'lg' : undefined)
	},
	{ id: 'row-5', title: '5. Явный size у каждого контрола', sizeFor: (index) => CONTROL_SIZES[index % CONTROL_SIZES.length] }
];
```

- [ ] **Step 3: Проверка высот**

`playground/src/row-checks.ts`:

```ts
import type { CheckResult } from './theme-checks';

function tokenPixels(scope: Element, size: string): number {
	return Number.parseFloat(getComputedStyle(scope).getPropertyValue(`--s-kit-control-height-${size}`));
}

/**
 * Критерий 3 раздела 12: высота каждого контрола равна токену его эффективного размера,
 * а верх и низ контролов одного размера в ряду совпадают. Ряд не переносится (flex-wrap: nowrap).
 */
export function runRowChecks(root: ParentNode): CheckResult[] {
	const results: CheckResult[] = [];
	for (const row of root.querySelectorAll<HTMLElement>('[data-row]')) {
		const rowId = row.dataset['row'] ?? '?';
		const bySize = new Map<string, DOMRect[]>();
		for (const control of row.querySelectorAll<HTMLElement>('[data-row-control]')) {
			const size = control.closest('[data-s-kit-size]')?.getAttribute('data-s-kit-size') ?? 'md';
			const rect = control.getBoundingClientRect();
			const expected = tokenPixels(row, size);
			results.push({
				name: `${rowId}: ${control.dataset['rowControl'] ?? '?'} (${size}) имеет высоту токена`,
				ok: Math.abs(rect.height - expected) <= 0.01,
				detail: `высота ${rect.height}px, ожидалось ${expected}px`
			});
			bySize.set(size, [...(bySize.get(size) ?? []), rect]);
		}
		for (const [size, rects] of bySize) {
			const tops = new Set(rects.map((rect) => Math.round(rect.top * 100)));
			const bottoms = new Set(rects.map((rect) => Math.round(rect.bottom * 100)));
			results.push({
				name: `${rowId}: контролы размера ${size} совпадают по верху и низу`,
				ok: rects.length < 2 || (tops.size === 1 && bottoms.size === 1),
				detail: `разных значений верха ${tops.size}, низа ${bottoms.size}`
			});
		}
	}
	return results;
}
```

Примечание: ряд с `align-items: center` у контролов разных размеров (ряды 4 и 5) выравнивает центры; для контролов одного размера верх и низ совпадают.

- [ ] **Step 4: Страница, навигация, стили**

`playground/src/controls-row-page.tsx`:

```tsx
import { createEffect, createSignal, For, type JSX } from 'solid-js';

import { ROWS } from './control-rows';
import { DEMO_CONTROLS } from './demo-controls';
import { pick } from './pick';
import { runRowChecks } from './row-checks';
import type { CheckResult } from './theme-checks';

type Theme = 'system' | 'light' | 'dark';

const THEMES: readonly Theme[] = ['system', 'light', 'dark'];

export function ControlsRowPage(): JSX.Element {
	const [theme, setTheme] = createSignal<Theme>('system');
	const [results, setResults] = createSignal<readonly CheckResult[]>([]);
	let page: HTMLElement | undefined;

	const runChecks = (): void => {
		if (page) {
			setResults(runRowChecks(page));
		}
	};

	// раскладка читает токены текущей темы: проверки перезапускаются после смены темы и первого рендера
	createEffect(() => {
		const root = document.documentElement;
		if (theme() === 'system') {
			root.removeAttribute('data-s-kit-theme');
		}
		else {
			root.setAttribute('data-s-kit-theme', theme());
		}
		requestAnimationFrame(runChecks);
	});

	return (
		<main ref={page} class='page'>
			<header class='toolbar'>
				<h1>Контролы в ряд</h1>
				<label>
					Тема
					<select onChange={(event) => setTheme(pick(THEMES, event.currentTarget.value, 'system'))}>
						<For each={THEMES}>{(value) => <option value={value}>{value}</option>}</For>
					</select>
				</label>
				<button type='button' onClick={runChecks}>
					Запустить проверки
				</button>
			</header>

			<For each={ROWS}>
				{(row) => (
					<section>
						<h2>{row.title}</h2>
						<div class='control-row' data-row={row.id} data-s-kit-size={row.wrapperSize}>
							<For each={DEMO_CONTROLS}>{(control, index) => control.render(row.sizeFor(index()))}</For>
						</div>
					</section>
				)}
			</For>

			<section>
				<h2>Проверки</h2>
				<ul class='checks'>
					<For each={results()}>
						{(result) => (
							<li data-ok={result.ok}>
								{result.ok ? 'OK' : 'FAIL'}: {result.name} <small>({result.detail})</small>
							</li>
						)}
					</For>
				</ul>
			</section>
		</main>
	);
}
```

`playground/src/app.tsx`:

```tsx
import { createSignal, For, type JSX, onCleanup, onMount } from 'solid-js';
import { Dynamic } from 'solid-js/web';

import { ControlsRowPage } from './controls-row-page';
import { ThemesPage } from './themes-page';

const PAGE_IDS = ['themes', 'controls-row'] as const;

type PageId = (typeof PAGE_IDS)[number];

const PAGES: Record<PageId, { readonly title: string; readonly component: () => JSX.Element }> = {
	themes: { title: 'Темы', component: ThemesPage },
	'controls-row': { title: 'Контролы в ряд', component: ControlsRowPage }
};

function readHash(): PageId {
	const id = window.location.hash.slice(1);
	return PAGE_IDS.find((candidate) => candidate === id) ?? 'themes';
}

export function App(): JSX.Element {
	const [page, setPage] = createSignal<PageId>(readHash());

	onMount(() => {
		const update = (): void => {
			setPage(readHash());
		};
		window.addEventListener('hashchange', update);
		onCleanup(() => {
			window.removeEventListener('hashchange', update);
		});
	});

	return (
		<>
			<nav class='nav'>
				<For each={PAGE_IDS}>
					{(id) => (
						<a href={`#${id}`} aria-current={page() === id ? 'page' : undefined}>
							{PAGES[id].title}
						</a>
					)}
				</For>
			</nav>
			<Dynamic component={PAGES[page()].component}/>
		</>
	);
}
```

В `playground/src/main.tsx` заменить импорт и рендер: `import { App } from './app';` и `render(() => <App/>, root);` (убрать импорт `ThemesPage`).

В конец `playground/src/playground.css` добавить:

```css
.nav {
    display: flex;
    gap: 16px;
    padding: 12px 24px 0;
}

.nav a[aria-current="page"] {
    font-weight: 600;
    color: var(--s-kit-color-text);
}

.control-row {
    display: flex;
    flex-wrap: nowrap;
    gap: 12px;
    align-items: center;
}
```

- [ ] **Step 5: Проверка кода**

Run: `pnpm check`
Expected: зелёный (typecheck playground проверяет импорт `@stark/solid-kit/button` через workspace и `exports`).

- [ ] **Step 6: Проверка в браузере (Chrome)**

Запустить `pnpm dev` в фоне (порт взять из вывода Vite), открыть `/#controls-row`, нажать «Запустить проверки». Ожидание: все проверки OK во всех пяти рядах в темах system/light/dark. Прочитать результат через `get_page_text` (JSON из JS-инструмента может блокироваться; возвращать короткую строку `ok=N fail=M`). Остановить сервер по PID. Если есть FAIL по высоте, показать цифры и чинить CSS основы, а не проверку.

- [ ] **Step 7: Проверка порядка CSS (composes)**

Run: `pnpm --filter playground exec vite build --outDir "$SCRATCH/pg-dist"` (каталог в scratchpad). В итоговом `.css` найти позиции `block-size:var(--s-kit-control-height` и `--s-kit-button-radius` (`grep -bo`): правило основы должно идти раньше правил Button, и в собранном JS у Button должно быть два имени класса (`root` и `control`). Если порядок обратный, перейти на запасной вариант раздела 2 спека этапа 1 и записать решение в спек.

- [ ] **Step 8: Commit**

```bash
git add playground
git commit -m "feat(playground): хэш-навигация и страница «Контролы в ряд» с проверкой высот" -m "$TRAILERS"
```

---

### Task 4: Проверки контраста вариантов и кольца фокуса

**Files:**
- Modify: `playground/src/theme-checks.ts` (экспортировать `resolveColor`)
- Create: `playground/src/button-checks.ts`
- Modify: `playground/src/controls-row-page.tsx`, `playground/src/playground.css`

**Interfaces:**
- Consumes: `resolveColor`, `CheckResult`, `blend`, `contrastRatio`.
- Produces: `runButtonChecks(page)`: контраст текста каждого варианта в покое, hover, active; кольцо фокуса снаружи и внутри.

- [ ] **Step 1: Экспорт `resolveColor`**

В `playground/src/theme-checks.ts` заменить `function resolveColor` на `export function resolveColor`, возвращаемый тип `Rgba` экспортировать (`export type Rgba`).

- [ ] **Step 2: Проверки**

`playground/src/button-checks.ts`:

```ts
import { blend, contrastRatio, type Rgb } from '../../src/utils/color-math';

import { type CheckResult, resolveColor, type Rgba } from './theme-checks';

interface VariantTokens {
	readonly fills: readonly [rest: string, hover: string, active: string];
	readonly text: string;
}

/** Таблица вариантов из спека этапа 1, раздел 3. */
const VARIANTS: Record<string, VariantTokens> = {
	primary: {
		fills: ['--s-kit-color-primary', '--s-kit-color-primary-hover', '--s-kit-color-primary-active'],
		text: '--s-kit-color-primary-contrast'
	},
	tinted: {
		fills: ['--s-kit-color-tint', '--s-kit-color-tint-hover', '--s-kit-color-tint-active'],
		text: '--s-kit-color-text'
	},
	plain: {
		fills: ['--s-kit-color-surface', '--s-kit-color-hover', '--s-kit-color-tint'],
		text: '--s-kit-color-text'
	},
	danger: {
		fills: ['--s-kit-color-danger', '--s-kit-color-danger-hover', '--s-kit-color-danger-active'],
		text: '--s-kit-color-primary-contrast'
	}
};

const STATES = ['покой', 'hover', 'active'] as const;

function rgb([red, green, blue]: Rgba): Rgb {
	return [red, green, blue];
}

/** Значение токена в области страницы: временный элемент с data-s-kit пересчитывает производные токены. */
function tokenColor(scope: Element, name: string): Rgba {
	const probe = document.createElement('span');
	probe.setAttribute('data-s-kit', '');
	probe.style.color = `var(${name})`;
	scope.append(probe);
	const color = resolveColor(getComputedStyle(probe).color);
	probe.remove();
	return color;
}

/** Цвет под элементом: собственная заливка или, если она прозрачная, поверхность страницы. */
function underlying(element: Element, surface: Rgba): Rgba {
	const fill = resolveColor(getComputedStyle(element).backgroundColor);
	return fill[3] === 0 ? surface : fill;
}

export function runButtonChecks(page: HTMLElement): CheckResult[] {
	const results: CheckResult[] = [];
	const check = (name: string, ok: boolean, detail: string): void => {
		results.push({ name, ok, detail });
	};
	const surface = resolveColor(getComputedStyle(page).backgroundColor);

	for (const [variant, tokens] of Object.entries(VARIANTS)) {
		const text = rgb(tokenColor(page, tokens.text));
		tokens.fills.forEach((name, index) => {
			const ratio = contrastRatio(text, rgb(tokenColor(page, name)));
			check(`Button ${variant}: текст в состоянии «${STATES[index] ?? '?'}» читаем (4.5:1)`, ratio >= 4.5, `контраст ${ratio.toFixed(2)}:1`);
		});
	}

	for (const block of page.querySelectorAll<HTMLElement>('[data-focus-block]')) {
		const mode = block.dataset['focusBlock'] ?? '?';
		const inset = mode === 'inset';
		for (const button of block.querySelectorAll<HTMLButtonElement>('button')) {
			const variant = button.dataset['variant'] ?? '?';
			const options: FocusOptions & { focusVisible: boolean } = { focusVisible: true };
			button.focus(options);
			const style = getComputedStyle(button);
			const offset = Number.parseFloat(style.outlineOffset);
			check(`${mode}/${variant}: кольцо фокуса показано`, style.outlineStyle === 'solid', `outline-style = ${style.outlineStyle}`);
			check(
				`${mode}/${variant}: кольцо ${inset ? 'внутри' : 'снаружи'}`,
				inset ? offset < 0 : offset > 0,
				`outline-offset = ${style.outlineOffset}`
			);
			const ring = resolveColor(style.outlineColor);
			const under = inset ? underlying(button, surface) : surface;
			const ratio = contrastRatio(blend(rgb(ring), ring[3] / 255, rgb(under)), rgb(under));
			check(`${mode}/${variant}: кольцо контрастно к фону (3:1)`, ratio >= 3, `контраст ${ratio.toFixed(2)}:1`);
			button.blur();
		}
	}
	return results;
}
```

(Проверить сигнатуру `blend` в `src/utils/color-math.ts` и порядок аргументов перед использованием; в тесте токенов она вызывается как `blend(text, share, surface)`.)

- [ ] **Step 3: Страница**

В `controls-row-page.tsx`:
- импорт `Button` из `@stark/solid-kit/button` и `runButtonChecks`;
- `runChecks` собирает `[...runRowChecks(page), ...runButtonChecks(page)]`;
- перед секцией «Проверки» добавить секцию:

```tsx
			<section>
				<h2>Кольцо фокуса: снаружи и внутри контейнера с data-s-kit-focus-inset</h2>
				<div class='focus-blocks'>
					<div class='focus-block' data-focus-block='outer'>
						<For each={VARIANTS}>{(variant) => <Button variant={variant}>{variant}</Button>}</For>
					</div>
					<div class='focus-block' data-focus-block='inset' data-s-kit-focus-inset>
						<For each={VARIANTS}>{(variant) => <Button variant={variant}>{variant}</Button>}</For>
					</div>
				</div>
			</section>
```

с `const VARIANTS = ['primary', 'tinted', 'plain', 'danger'] as const;` в файле страницы. В `playground.css` добавить `.focus-blocks { display: flex; gap: 16px; flex-wrap: wrap; }` и `.focus-block { display: flex; gap: 12px; padding: 16px; border: 1px solid var(--s-kit-color-hairline); border-radius: var(--s-kit-radius); overflow: hidden; }` (`overflow: hidden` обязательно: проверяет, что внутреннее кольцо не обрезается).

- [ ] **Step 4: Проверка кода**

Run: `pnpm check`
Expected: зелёный.

- [ ] **Step 5: Проверка в браузере (Chrome)**

Запустить dev, открыть `/#controls-row`, нажать «Запустить проверки» в темах light и dark. Ожидание: все OK. Если `outline-style` не `solid` из-за того, что `focus({ focusVisible: true })` не включает `:focus-visible` при программном фокусе после клика мышью, записать это в отчёт, проверить кольцо вручную клавишей Tab через инструмент компьютера (скриншот внешнего и внутреннего кольца на primary и danger) и пометить автоматическую проверку как зависящую от эвристики браузера. Прочитать счётчики строкой `ok=N fail=M`, остановить сервер по PID, закрыть вкладку.

- [ ] **Step 6: Commit**

```bash
git add playground
git commit -m "feat(playground): проверки контраста вариантов Button и кольца фокуса" -m "$TRAILERS"
```

---

### Task 5: Button в матрице формы пакета

**Files:**
- Modify: `scripts/consumer/src/main.tsx`
- Modify: `scripts/verify-package-form.sh`

- [ ] **Step 1: Потребитель импортирует Button**

В `scripts/consumer/src/main.tsx` добавить `import { Button } from '@stark/solid-kit/button';` (по порядку импортов) и внутри `AppContext.Provider` рядом с `Probe` элемент `<Button id="btn" variant="danger">Удалить</Button>`.

- [ ] **Step 2: Проверки сборки**

В `scripts/verify-package-form.sh` после строки с проверкой `Probe styles` добавить (использовать вспомогательные `ok`/`fail` скрипта):

```bash
grep -lq -- '--s-kit-button-radius' dist/assets/*.css && ok "Button styles are in the built CSS" || fail "Button styles are missing from the built CSS"
css_file=$(ls dist/assets/*.css | head -1)
base_pos=$(grep -bo 'block-size:var(--s-kit-control-height,var(--s-kit-control-height-md))' "$css_file" | head -1 | cut -d: -f1)
button_pos=$(grep -bo -- '--s-kit-button-radius' "$css_file" | head -1 | cut -d: -f1)
if [ -n "$base_pos" ] && [ -n "$button_pos" ] && [ "$base_pos" -lt "$button_pos" ]; then ok "control base comes before Button rules in the built CSS"; else fail "control base is missing or comes after Button rules (base=$base_pos, button=$button_pos)"; fi
```

(Минификатор может переписать пробелы; если `grep` не находит строку, посмотреть фактический вид в `dist/assets/*.css` и поправить шаблон.)

- [ ] **Step 3: Прогнать матрицу**

Run: `scripts/verify-package-form.sh "$(git rev-parse HEAD)"` после коммита изменений этого плана (матрица ставит пакет по коммиту, поэтому сначала закоммитить Task 1–4, затем править скрипт и снова коммитить, затем прогонять на новом HEAD).
Expected: все пункты OK, включая новые два.

- [ ] **Step 4: Удалить временный проект-потребитель и закоммитить**

```bash
git add scripts
git commit -m "test: Button в матрице формы пакета, проверка порядка CSS основы" -m "$TRAILERS"
```

---

### Task 6: Спек и закрытие плана

**Files:**
- Modify: `docs/superpowers/specs/2026-10-29-stage-1-simple-controls-design.md`

- [ ] **Step 1: Обновить спек этапа**

В разделе 7 «Открытые вопросы этапа» вопросы 1 и 2 пометить закрытыми с фактом (работает ли `composes`, принято ли правило stylelint). В таблицу порядка (раздел 1) у Button добавить пометку «готов (коммит <sha>)», где `<sha>` берётся из `git log`.

- [ ] **Step 2: Итоговая проверка и коммит**

Run: `pnpm check` и `git status` (чисто). Затем:

```bash
git add docs
git commit -m "docs: Button готов, закрыты вопросы про composes и правило высоты" -m "$TRAILERS"
```

Тег не ставится (ставится в конце этапа 1).

---

## Самопроверка плана

- **Покрытие спека этапа 1:** варианты и таблица (Task 2 CSS), токены `danger-active`, `focus-ring-on-fill`, `disabled-opacity` (Task 1), общая основа и `composes` (Task 2, проверка в Task 3 шаг 7 и Task 5), страница и пять рядов (Task 3), контраст вариантов и кольцо на заливке (Task 4), Button в матрице (Task 5), закрытие вопросов (Task 6), правило stylelint про фолбэк высоты (Task 1). Не покрыто сознательно: ручные состояния hover/active-стенды (заменены проверкой токенов и ручным осмотром мышью при приёмке в Task 3).
- **Типы:** `ButtonVariant`, `ButtonSize`, `ControlSize` совпадают по значениям; `CheckResult`, `Rgba` берутся из `theme-checks.ts`.
- **Известные риски:** `focusVisible` при программном фокусе (Task 4 шаг 5), порядок CSS при `composes` (Task 3 шаг 7), регулярный ключ в `declaration-property-value-disallowed-list` (Task 1 шаг 5).
