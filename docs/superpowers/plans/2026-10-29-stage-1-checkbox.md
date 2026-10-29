# solid-kit, этап 1: Checkbox — план реализации

> **Для исполнителей:** ОБЯЗАТЕЛЬНЫЙ суб-скил: superpowers:executing-plans (или subagent-driven-development). Шаги отмечены чекбоксами (`- [ ]`).

**Цель:** седьмой компонент этапа 1. Checkbox с подписью и без, нативный `<input type="checkbox">` с `appearance: none` и граница `control-edge`, состояния выбран / не выбран / неопределён, контракт `checked`/`defaultChecked`/`onCheckedChange`. Строка «отметка + подпись» имеет высоту контрола и стоит в одной линии с остальными контролами во всех пяти рядах; контраст границы, заливки и галочки и кольцо фокуса проверяются на странице; компонент входит в матрицу формы пакета.

**Архитектура:** плоский компонент. Корень `<label data-s-kit>` (размер, `class`, `style`, подпись), внутри `span` с `input` и двумя inline-SVG (галочка и тире, `pointer-events: none`), состояния рисуются CSS по `:checked`, `:indeterminate`, `:hover`, `:disabled`, `[aria-invalid]` самого `input`; кольцо фокуса на `input`, поэтому проверки колец страницы работают без особых случаев. Состояние через `createControllableSignal<boolean>`. Остальные нативные атрибуты уходят на `input` (так `<Checkbox {...control}/>` из Field получает `id` и `aria-*`).

**Стек:** как в этапе 0 и предыдущих планах этапа 1.

**Спеки:** `docs/superpowers/specs/2026-10-29-stage-1-simple-controls-design.md` (основной; раздел 3.6 описывает Checkbox, разделы 2 и 4 общие соглашения и страницу), `docs/superpowers/specs/2026-10-28-solid-kit-umbrella-design.md` (разделы 4.1, 5, 5.1, 7, 11.1, 12).

## Global Constraints

- Репозиторий публичный: ни ключей, ни токенов, ни `.env*` в коммитах. Не делать `git push`, не ставить теги в этом плане, не добавлять `LICENSE`, не менять git-идентичность, не переписывать историю (никаких `--amend`/`rebase`). Тег `v0.2.0` ставится в конце всего этапа 1, не здесь.
- Один класс — один файл; kebab-case; именованные экспорты; пропсы не деструктурируются (`splitProps`/`mergeProps`). Один компонент на файл (демо-компоненты playground тоже).
- В CSS компонентов: только токены, без литералов цветов, без `outline: none/0`, без голого `var(--s-kit-control-height)` (всегда с фолбэком `var(--s-kit-control-height, var(--s-kit-control-height-md))`).
- Стиль: ESLint (табы, одинарные кавычки, без висячих запятых, Stroustrup, max-len 140, `solid/reactivity` как ошибка: сигнал в тесте читать нельзя, использовать `vi.fn`), Stylelint (4 пробела, двойные кавычки, логические свойства; `pnpm exec stylelint --fix <файл>`). Перед каждым коммитом `pnpm check` зелёный.
- Коммиты оканчиваются трейлерами: `export TRAILERS=$'Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_017cEinKKFDiYmGrLaaKPqZu'`, затем `git commit -m "msg" -m "$TRAILERS"`.
- Dev-серверы убивать только по PID после проверки cwd (`lsof -a -p <PID> -d cwd -Fn`), никогда `pkill` по имени. Порт 5173 может быть занят чужим процессом: брать порт из вывода Vite.
- Браузерные проверки в Chrome. Кольца фокуса дают ложные FAIL, если проверки запущены щелчком мыши: запускать с клавиатуры (Tab до кнопки «Запустить проверки», Enter) или сменой темы через переключатель. Координаты скриншота (1505 px) отличаются от CSS-пикселей страницы: клики по координатам из `getBoundingClientRect` пересчитывать (умножить на `1505 / innerWidth`). JS-инструмент иногда возвращает `[BLOCKED: Cookie/query string data]`: повторить коротким строковым результатом. Firefox и Safari не проверяются.
- Начало плана: `git status` чистый, `pnpm check` зелёный (196 тестов).

---

### Task 1: Компонент Checkbox

**Files:**
- Create: `src/components/checkbox/checkbox.tsx`
- Create: `src/components/checkbox/checkbox.module.css`
- Create: `src/components/checkbox/index.ts`
- Test: `src/components/checkbox/checkbox.test.tsx`

**Interfaces:**
- Consumes: `createControllableSignal` из `../../utils/create-controllable-signal`.
- Produces: `Checkbox(props: CheckboxProps): JSX.Element`; типы `CheckboxProps`, `CheckboxSize`; публичный путь `@stark/solid-kit/checkbox`; токены `--s-kit-checkbox-size`, `--s-kit-checkbox-radius`, `--s-kit-checkbox-gap`.

- [ ] **Step 1: Написать падающие тесты**

Создать `src/components/checkbox/checkbox.test.tsx`:

```tsx
import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library';
import { createSignal } from 'solid-js';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Checkbox } from './checkbox';

afterEach(cleanup);

describe('Checkbox', () => {
	it('renders a native checkbox named by its label text', () => {
		render(() => <Checkbox>Согласен</Checkbox>);
		const input = screen.getByRole<HTMLInputElement>('checkbox', { name: 'Согласен' });
		expect(input.type).toBe('checkbox');
		expect(input.checked).toBe(false);
	});

	it('works without a label when aria-label is given and renders no label text', () => {
		render(() => <Checkbox aria-label='Выбрать строку' data-testid='c'/>);
		const input = screen.getByRole('checkbox', { name: 'Выбрать строку' });
		expect(input.closest('label')?.querySelector('[data-checkbox-label]')).toBeNull();
	});

	it('puts the kit root attributes on the label, not on the input', () => {
		render(() => <Checkbox aria-label='Флажок'/>);
		const input = screen.getByRole('checkbox');
		const root = input.closest('label');
		expect(root?.hasAttribute('data-s-kit')).toBe(true);
		expect(input.hasAttribute('data-s-kit')).toBe(false);
	});

	it('sets data-s-kit-size on the root only when size is passed', () => {
		render(() => (
			<>
				<Checkbox aria-label='Без размера'/>
				<Checkbox aria-label='Большой' size='lg'/>
			</>
		));
		expect(screen.getByRole('checkbox', { name: 'Без размера' }).closest('label')?.hasAttribute('data-s-kit-size')).toBe(false);
		expect(screen.getByRole('checkbox', { name: 'Большой' }).closest('label')?.getAttribute('data-s-kit-size')).toBe('lg');
	});

	it('shows defaultChecked and reports toggling through onCheckedChange when uncontrolled', () => {
		const onCheckedChange = vi.fn();
		render(() => <Checkbox aria-label='Флажок' defaultChecked onCheckedChange={onCheckedChange}/>);
		const input = screen.getByRole<HTMLInputElement>('checkbox');
		expect(input.checked).toBe(true);
		fireEvent.click(input);
		expect(onCheckedChange).toHaveBeenLastCalledWith(false);
		expect(input.checked).toBe(false);
		fireEvent.click(input);
		expect(onCheckedChange).toHaveBeenLastCalledWith(true);
		expect(input.checked).toBe(true);
	});

	it('toggles when the label text is clicked', () => {
		render(() => <Checkbox>Согласен</Checkbox>);
		fireEvent.click(screen.getByText('Согласен'));
		expect(screen.getByRole<HTMLInputElement>('checkbox').checked).toBe(true);
	});

	it('shows the controlled value and follows the parent', () => {
		const [checked, setChecked] = createSignal(true);
		const onCheckedChange = vi.fn((next: boolean) => setChecked(next));
		render(() => <Checkbox aria-label='Флажок' checked={checked()} onCheckedChange={onCheckedChange}/>);
		const input = screen.getByRole<HTMLInputElement>('checkbox');
		expect(input.checked).toBe(true);
		fireEvent.click(input);
		expect(onCheckedChange).toHaveBeenLastCalledWith(false);
		expect(input.checked).toBe(false);
		setChecked(true);
		expect(input.checked).toBe(true);
	});

	it('returns to the controlled value when the parent does not accept the change', () => {
		const onCheckedChange = vi.fn();
		render(() => <Checkbox aria-label='Флажок' checked={false} onCheckedChange={onCheckedChange}/>);
		const input = screen.getByRole<HTMLInputElement>('checkbox');
		fireEvent.click(input);
		expect(onCheckedChange).toHaveBeenCalledWith(true);
		expect(input.checked).toBe(false);
	});

	it('sets the indeterminate property and keeps it after a click until the caller changes it', () => {
		const [indeterminate, setIndeterminate] = createSignal(true);
		const onCheckedChange = vi.fn();
		render(() => <Checkbox aria-label='Все' checked={false} indeterminate={indeterminate()} onCheckedChange={onCheckedChange}/>);
		const input = screen.getByRole<HTMLInputElement>('checkbox');
		expect(input.indeterminate).toBe(true);
		fireEvent.click(input);
		expect(onCheckedChange).toHaveBeenCalledWith(true);
		expect(input.indeterminate).toBe(true);
		setIndeterminate(false);
		expect(input.indeterminate).toBe(false);
	});

	it('is not indeterminate by default', () => {
		render(() => <Checkbox aria-label='Флажок'/>);
		expect(screen.getByRole<HTMLInputElement>('checkbox').indeterminate).toBe(false);
	});

	it('disables the input and marks the root when disabled', () => {
		const onCheckedChange = vi.fn();
		render(() => <Checkbox aria-label='Флажок' disabled onCheckedChange={onCheckedChange}/>);
		const input = screen.getByRole<HTMLInputElement>('checkbox');
		expect(input.disabled).toBe(true);
		expect(input.closest('label')?.hasAttribute('data-disabled')).toBe(true);
		fireEvent.click(input);
		expect(onCheckedChange).not.toHaveBeenCalled();
	});

	it('does not mark the root as disabled by default', () => {
		render(() => <Checkbox aria-label='Флажок'/>);
		expect(screen.getByRole('checkbox').closest('label')?.hasAttribute('data-disabled')).toBe(false);
	});

	it('passes native attributes to the input and class and style to the root', () => {
		render(() => (
			<Checkbox
				aria-label='Флажок'
				id='agree'
				name='agree'
				value='yes'
				aria-describedby='hint'
				aria-invalid={true}
				class='custom'
				style={{ color: 'red' }}
			/>
		));
		const input = screen.getByRole<HTMLInputElement>('checkbox');
		expect(input.id).toBe('agree');
		expect(input.name).toBe('agree');
		expect(input.value).toBe('yes');
		expect(input.getAttribute('aria-describedby')).toBe('hint');
		expect(input.getAttribute('aria-invalid')).toBe('true');
		const root = input.closest('label');
		expect(root?.classList.contains('custom')).toBe(true);
		expect(root?.style.color).toBe('red');
	});
});
```

- [ ] **Step 2: Убедиться, что тесты падают**

Run: `pnpm exec vitest run src/components/checkbox`
Expected: FAIL (модуль `./checkbox` не найден).

- [ ] **Step 3: Реализовать компонент**

Создать `src/components/checkbox/checkbox.tsx`:

```tsx
import styles from './checkbox.module.css';

import { children, type JSX, Show, splitProps } from 'solid-js';

import { createControllableSignal } from '../../utils/create-controllable-signal';

export type CheckboxSize = 'sm' | 'md' | 'lg';

export interface CheckboxProps
	extends Omit<
		JSX.InputHTMLAttributes<HTMLInputElement>,
		'class' | 'style' | 'size' | 'type' | 'checked' | 'defaultChecked' | 'onChange' | 'onInput' | 'children'
	> {
	checked?: boolean | undefined;
	defaultChecked?: boolean | undefined;
	onCheckedChange?: ((checked: boolean) => void) | undefined;
	/** Только вид: состоянием владеет вызывающий (после щелчка значение пропа возвращается). */
	indeterminate?: boolean | undefined;
	size?: CheckboxSize | undefined;
	class?: string | undefined;
	style?: JSX.CSSProperties | undefined;
	/** Подпись. */
	children?: JSX.Element;
}

export function Checkbox(props: CheckboxProps): JSX.Element {
	const [local, rest] = splitProps(props, [
		'checked',
		'defaultChecked',
		'onCheckedChange',
		'indeterminate',
		'size',
		'class',
		'style',
		'children'
	]);
	const label = children(() => local.children);

	const [checked, setChecked] = createControllableSignal<boolean>({
		name: 'Checkbox',
		value: () => local.checked,
		defaultValue: () => local.defaultChecked ?? false,
		onChange: (next) => local.onCheckedChange?.(next)
	});

	const handleChange: JSX.EventHandler<HTMLInputElement, Event> = (event) => {
		setChecked(event.currentTarget.checked);
		// контролируемый режим: родитель мог не принять значение, тогда флажок возвращается к нему;
		// браузер сам снимает indeterminate после щелчка, возвращаем значение пропа
		if (event.currentTarget.checked !== checked()) {
			event.currentTarget.checked = checked();
		}
		event.currentTarget.indeterminate = local.indeterminate === true;
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
					class={styles['input']}
					checked={checked()}
					prop:indeterminate={local.indeterminate === true}
					onChange={handleChange}
				/>
				<svg class={styles['mark']} data-mark='check' viewBox='0 0 16 16' aria-hidden='true' focusable='false'>
					<path d='M4 8.5l2.5 2.5L12 5.5' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/>
				</svg>
				<svg class={styles['mark']} data-mark='dash' viewBox='0 0 16 16' aria-hidden='true' focusable='false'>
					<path d='M4.5 8h7' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round'/>
				</svg>
			</span>
			<Show when={label.toArray().length > 0}>
				<span class={styles['label']} data-checkbox-label>{label()}</span>
			</Show>
		</label>
	);
}
```

- [ ] **Step 4: CSS**

Создать `src/components/checkbox/checkbox.module.css`:

```css
/*
 * Компонентные токены Checkbox (публичный API кастомизации, читаются с фолбэком на глобальные):
 *   --s-kit-checkbox-size, --s-kit-checkbox-radius, --s-kit-checkbox-gap
 * Корень label имеет высоту контрола (спек этапа 1, раздел 3.6); отметка это нативный input с appearance: none,
 * галочка и тире рисуются соседними SVG поверх него. Кольцо фокуса на самом input.
 */

.root {
    cursor: pointer;
    user-select: none;

    display: inline-flex;
    flex: none;
    gap: var(--s-kit-checkbox-gap, 8px);
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
    inline-size: var(--s-kit-checkbox-size, 16px);
    block-size: var(--s-kit-checkbox-size, 16px);
    margin: 0;
    border: 1px solid var(--s-kit-color-control-edge);
    border-radius: var(--s-kit-checkbox-radius, 4px);

    background: var(--s-kit-color-surface);

    transition: background-color 150ms, border-color 150ms;
}

.input:hover:not(:disabled) {
    background: var(--s-kit-color-hover);
}

.input:checked,
.input:indeterminate {
    border-color: var(--s-kit-color-primary);
    background: var(--s-kit-color-primary);
}

.input:checked:hover:not(:disabled),
.input:indeterminate:hover:not(:disabled) {
    border-color: var(--s-kit-color-primary-hover);
    background: var(--s-kit-color-primary-hover);
}

.input:checked:active:not(:disabled),
.input:indeterminate:active:not(:disabled) {
    border-color: var(--s-kit-color-primary-active);
    background: var(--s-kit-color-primary-active);
}

.input:focus-visible {
    outline: var(--s-kit-focus-width) solid var(--s-kit-color-focus-ring);
    outline-offset: var(--s-kit-focus-ring-offset, var(--s-kit-focus-offset));
}

.input:checked:focus-visible,
.input:indeterminate:focus-visible {
    outline-color: var(--s-kit-focus-ring-on-fill, var(--s-kit-color-focus-ring));
}

.input[aria-invalid="true"]:not(:checked, :indeterminate) {
    border-color: var(--s-kit-color-danger);
}

.input[aria-invalid="true"]:focus-visible {
    outline-color: var(--s-kit-color-danger);
}

.mark {
    pointer-events: none;

    position: absolute;
    inset: 0;

    display: none;

    inline-size: 100%;
    block-size: 100%;

    color: var(--s-kit-color-primary-contrast);
}

.input:checked:not(:indeterminate) ~ .mark[data-mark="check"],
.input:indeterminate ~ .mark[data-mark="dash"] {
    display: block;
}

@media (prefers-reduced-motion: reduce) {
    .input {
        transition: none;
    }
}
```

Run: `pnpm exec stylelint --fix src/components/checkbox/checkbox.module.css`
Expected: без замечаний (порядок свойств stylelint поправит сам; если правило ругается на `:not(:checked, :indeterminate)` или `appearance`, переписать эквивалентно и записать причину).

- [ ] **Step 5: Публичный путь**

Создать `src/components/checkbox/index.ts`:

```ts
export type { CheckboxProps, CheckboxSize } from './checkbox';
export { Checkbox } from './checkbox';
```

- [ ] **Step 6: Проверки**

Run: `pnpm exec eslint --fix src/components/checkbox && pnpm check`
Expected: зелёный, тестов 196 + 13 = 209 (точное число записать по факту). Если TypeScript не принимает `prop:indeterminate` или `data-checkbox-label` на `span`, исправить без изменения публичного API и записать причину; если `solid/reactivity` придирается к `rest.disabled` в JSX, это чтение внутри отслеживаемого атрибута (допустимо).

- [ ] **Step 7: Закоммитить**

```bash
git add src/components/checkbox
git commit -m "feat: Checkbox, флажок с подписью, состоянием indeterminate и границей control-edge" -m "$TRAILERS"
```

---

### Task 2: Checkbox в playground и проверки

**Files:**
- Modify: `playground/src/row-checks.ts`
- Modify: `playground/src/demo-controls.tsx`
- Create: `playground/src/demo-checkboxes.tsx`
- Create: `playground/src/checkbox-checks.ts`
- Modify: `playground/src/controls-row-page.tsx`
- Modify: `playground/src/playground.css`

**Interfaces:**
- Consumes: `Checkbox` из `@stark/solid-kit/checkbox`; `blend`, `contrastRatio`, `Rgb` из `../../src/utils/color-math`; `CheckResult`, `resolveColor`, `Rgba` из `./theme-checks`.
- Produces: два контрола ряда (`checkbox`, `checkbox-bare`, оба с `data-row-control` на `input`); раздел с четырьмя демо-флажками (`data-checkbox-demo` на `input`: `unchecked`, `checked`, `indeterminate`, `invalid`); `runCheckboxChecks(page: HTMLElement): CheckResult[]`; два флажка в блоках фокуса (`data-focus-name='checkbox'`, `'checkbox-checked'`).

- [ ] **Step 1: Корень контрола в проверках рядов**

В `playground/src/row-checks.ts` измерять не сам элемент с `data-row-control`, а корень контрола: ближайший `[data-s-kit]` (у Button, IconButton, Input и групп это сам элемент; у Checkbox `data-row-control` стоит на `input`, а корень это `label`). Заменить

```ts
			const rect = control.getBoundingClientRect();
```

на

```ts
			const root = control.closest<HTMLElement>('[data-s-kit]') ?? control;
			const rect = root.getBoundingClientRect();
```

и в блоке `data-row-group` заменить `[...control.children]` на `[...root.children]` (сегменты группы это дети корня).

- [ ] **Step 2: Флажки в ряду**

В `playground/src/demo-controls.tsx` добавить `import { Checkbox } from '@stark/solid-kit/checkbox';` (по порядку импортов, после `button-group`) и в конец массива `DEMO_CONTROLS` (после `toggle-group`, не забыв запятую):

```tsx
	{
		id: 'checkbox',
		render: (size) => <Checkbox data-row-control='checkbox' defaultChecked size={size}>Флажок</Checkbox>
	},
	{
		id: 'checkbox-bare',
		render: (size) => <Checkbox data-row-control='checkbox-bare' aria-label='Без подписи' size={size}/>
	}
```

- [ ] **Step 3: Раздел с состояниями флажка**

Создать `playground/src/demo-checkboxes.tsx`:

```tsx
import { Checkbox } from '@stark/solid-kit/checkbox';
import type { JSX } from 'solid-js';

/** Четыре состояния для проверок в checkbox-checks.ts плюс недоступный флажок. */
export function DemoCheckboxes(): JSX.Element {
	return (
		<div class='checkbox-demos'>
			<Checkbox data-checkbox-demo='unchecked'>Не выбран</Checkbox>
			<Checkbox data-checkbox-demo='checked' defaultChecked>Выбран</Checkbox>
			<Checkbox data-checkbox-demo='indeterminate' indeterminate>Частично</Checkbox>
			<Checkbox data-checkbox-demo='invalid' aria-invalid={true}>С ошибкой</Checkbox>
			<Checkbox disabled defaultChecked>Недоступен</Checkbox>
		</div>
	);
}
```

В `playground/src/playground.css` рядом с `.field-demos` добавить:

```css
.checkbox-demos {
    display: flex;
    flex-wrap: wrap;
    gap: 24px;
    align-items: center;
}
```

- [ ] **Step 4: Проверки флажка**

Создать `playground/src/checkbox-checks.ts`:

```ts
import { blend, contrastRatio, type Rgb } from '../../src/utils/color-math';

import { type CheckResult, resolveColor, type Rgba } from './theme-checks';

function rgb([red, green, blue]: Rgba): Rgb {
	return [red, green, blue];
}

/** Цвет поверх поверхности страницы (граница control-edge полупрозрачна). */
function over(color: Rgba, surface: Rgba): Rgb {
	return blend(rgb(color), color[3] / 255, rgb(surface));
}

/**
 * Связь подписи и флажка, контраст границы (не выбран, с ошибкой), заливки и отметки (выбран, частично) у каждого флажка
 * с data-checkbox-demo. Видимость галочки и тире определяется по display соседнего SVG.
 */
export function runCheckboxChecks(page: HTMLElement): CheckResult[] {
	const results: CheckResult[] = [];
	const check = (name: string, ok: boolean, detail: string): void => {
		results.push({ name, ok, detail });
	};
	const surface = resolveColor(getComputedStyle(page).backgroundColor);

	for (const input of page.querySelectorAll<HTMLInputElement>('[data-checkbox-demo]')) {
		const id = input.dataset['checkboxDemo'] ?? '?';
		const root = input.closest('label');
		if (!root) {
			throw new Error(`Playground element is missing in Checkbox ${id}`);
		}
		check(`Checkbox ${id}: подпись связана с флажком`, root.control === input, `label.control = ${root.control?.tagName ?? 'null'}`);

		const style = getComputedStyle(input);
		if (id === 'unchecked' || id === 'invalid') {
			const edge = over(resolveColor(style.borderTopColor), surface);
			const ratio = contrastRatio(edge, rgb(surface));
			check(`Checkbox ${id}: граница контрастна к поверхности (3:1)`, ratio >= 3, `контраст ${ratio.toFixed(2)}:1`);
		}
		else {
			const fill = resolveColor(style.backgroundColor);
			const fillRatio = contrastRatio(rgb(fill), rgb(surface));
			check(`Checkbox ${id}: заливка контрастна к поверхности (3:1)`, fillRatio >= 3, `контраст ${fillRatio.toFixed(2)}:1`);

			const mark = input.parentElement?.querySelector<SVGElement>(`[data-mark="${id === 'checked' ? 'check' : 'dash'}"]`);
			if (!mark) {
				throw new Error(`Playground element is missing in Checkbox ${id}: mark`);
			}
			const visible = getComputedStyle(mark).display !== 'none';
			const markRatio = contrastRatio(rgb(resolveColor(getComputedStyle(mark).color)), rgb(fill));
			check(`Checkbox ${id}: отметка видна и контрастна к заливке (3:1)`, visible && markRatio >= 3, `display ${getComputedStyle(mark).display}, контраст ${markRatio.toFixed(2)}:1`);
		}
	}
	return results;
}
```

(Если строка с `display ${…}` длиннее 140 символов, разбить, как делает `eslint --fix`/ручная правка.)

- [ ] **Step 5: Подключить на страницу**

В `playground/src/controls-row-page.tsx`:
1. импорты: `import { Checkbox } from '@stark/solid-kit/checkbox';`, `import { runCheckboxChecks } from './checkbox-checks';`, `import { DemoCheckboxes } from './demo-checkboxes';` (порядок поправит `eslint --fix`);
2. в `renderFocusControls()` в конец массива (после `ToggleGroup.Root`, с запятой перед ним) добавить:

```tsx
		<Checkbox aria-label='Флажок' data-focus-name='checkbox'/>,
		<Checkbox aria-label='Выбранный флажок' defaultChecked data-focus-name='checkbox-checked'/>
```

3. в `runChecks` добавить `...runCheckboxChecks(page)` последним элементом списка;
4. после раздела ToggleGroup добавить раздел:

```tsx
			<section>
				<h2>Checkbox: состояния и контраст отметки</h2>
				<DemoCheckboxes/>
			</section>
```

- [ ] **Step 6: Статическая проверка**

Run: `pnpm exec eslint --fix playground/src && pnpm exec stylelint --fix "playground/src/**/*.css" && pnpm check`
Expected: зелёный, тесты как в конце Task 1.

- [ ] **Step 7: Проверка в браузере (Chrome)**

`pnpm dev` в фоне (PID сохранить, порт из вывода Vite), открыть `<адрес>/#controls-row`, запустить проверки с клавиатуры (Tab до «Запустить проверки», Enter), затем темы light, dark, system через переключатель (после смены темы ждать 700 мс; в system вернуться через другую тему).

Expected в каждой теме:
- в каждом из пяти рядов флажок с подписью и флажок без подписи стоят на одной линии с остальными контролами, верх и низ корня совпадают с соседями;
- **все проверки OK**, число должно стать 246 (было 214: +10 высот двух флажков в пяти рядах, +12 колец у двух флажков в двух блоках фокуса, +10 проверок четырёх демо-флажков). Если число или результат другие, выяснить причину до коммита;
- контраст границы не выбранного флажка не ниже 3:1, заливки выбранного не ниже 3:1, отметки к заливке не ниже 3:1 (значения записать в итоги);
- реальными действиями: щелчок по подписи «Не выбран» ставит флажок; Tab даёт кольцо у флажка (внутри в блоке с `data-s-kit-focus-inset`, снаружи в обычном, не обрезано), Space переключает; недоступный флажок не реагирует;
- глазами: выбранный, частично выбранный, с ошибкой и недоступный выглядят по разделу 3.6 в обеих темах; консоль без ошибок и dev-предупреждений `[solid-kit]`.

Остановить dev-сервер по PID (после проверки cwd).

- [ ] **Step 8: Закоммитить**

```bash
git add playground
git commit -m "feat(playground): Checkbox в рядах, состояния, проверки контраста и кольца" -m "$TRAILERS"
```

---

### Task 3: Checkbox в матрице формы пакета

**Files:**
- Modify: `scripts/consumer/src/main.tsx`
- Modify: `scripts/verify-package-form.sh`

**Interfaces:**
- Consumes: путь `@stark/solid-kit/checkbox`; токен `--s-kit-checkbox-radius` как маркер стилей в собранном CSS.
- Produces: один новый пункт матрицы (стили Checkbox в CSS; порядка нет: компонент не использует `composes`).

- [ ] **Step 1: Потребитель импортирует Checkbox**

В `scripts/consumer/src/main.tsx` добавить `import { Checkbox } from '@stark/solid-kit/checkbox';` (по порядку, после `button-group`) и рядом с остальными элементами:

```tsx
			<Checkbox defaultChecked>Согласен</Checkbox>
```

- [ ] **Step 2: Проверка сборки**

В `scripts/verify-package-form.sh` после пункта про ToggleGroup добавить:

```bash
grep -lq -- '--s-kit-checkbox-radius' dist/assets/*.css && ok "Checkbox styles are in the built CSS" || fail "Checkbox styles are missing from the built CSS"
```

- [ ] **Step 3: Коммит и прогон матрицы**

```bash
git add scripts
git commit -m "test: Checkbox в матрице формы пакета" -m "$TRAILERS"
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

В таблице порядка (раздел 1) у строки Checkbox добавить **Готов** и коммиты (`git log --oneline -5`), с точкой в конце ячейки, как у соседних строк. Добавить раздел «14. Итоги Checkbox (2026-10-29)» по образцу разделов 8–13: число проверок страницы (из Task 2 Step 7), измеренные контрасты (граница, заливка, отметка) в обеих темах, кольцо фокуса снаружи и внутри, результаты реальных щелчков и клавиш, что матрица зелёная на обоих TypeScript, и список непроверенного: Firefox 125, Safari 17.5 (`appearance: none` на чекбоксе и `:indeterminate`), hover и active мышью, `forced-colors` (отметка рисуется SVG и заливкой, при принудительных цветах может пропасть), экранный диктор (проверена только разметка: нативный `input`, `mixed` по `indeterminate`), группа флажков. Если по ходу принималось решение, отличающееся от раздела 3.6, исправить раздел 3.6 тем же коммитом.

- [ ] **Step 2: Итоговая проверка и коммит**

Run: `pnpm check` и `git status` (чисто). Затем:

```bash
git add docs
git commit -m "docs: Checkbox готов" -m "$TRAILERS"
```

Тег не ставится. Следующий компонент по порядку: Radio + RadioGroup.

---

## Самопроверка плана

- **Покрытие спека (раздел 3.6):** корень `label` и атрибуты на `input` (Task 1 тесты и код), высота корня равна высоте контрола (Task 1 CSS, проверка рядов Task 2), граница `control-edge` и контраст (Task 1 CSS, проверки Task 2), controlled/uncontrolled и возврат при отказе (Task 1), `indeterminate` как свойство с возвратом (Task 1), `disabled` (Task 1), кольцо фокуса снаружи и внутри (Task 2, блоки фокуса), токены (Task 1, маркер в Task 3), закрытие (Task 4).
- **Типы:** `CheckboxProps` и `CheckboxSize` экспортируются из `index.ts`; `data-checkbox-demo` ставится на `input` через `rest` и читается как `dataset['checkboxDemo']`; `data-mark` читается в `checkbox-checks.ts` тем же селектором, которым ставится в компоненте; `data-row-control` на `input`, а `row-checks.ts` измеряет `closest('[data-s-kit]')`; число 246 выведено расчётом (10 + 12 + 10).
- **Известные риски:** `prop:indeterminate` и `data-*` на `span` в типах Solid JSX (Task 1 Step 6); `:not(:checked, :indeterminate)` в stylelint; строка ряда ещё длиннее, страница даст горизонтальную прокрутку при узком окне (на проверки не влияет: они читают `getBoundingClientRect`); `appearance: none` и `:indeterminate` в Firefox 125 и Safari 17.5 не проверяются.
- **Не покрыто сознательно:** цикл «частично → выбрано → снято» внутри компонента, `CheckboxGroup`, иконка вместо галочки через проп, `required` и сообщения валидации.
