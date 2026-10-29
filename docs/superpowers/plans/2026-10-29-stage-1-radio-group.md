# solid-kit, этап 1: Radio и RadioGroup — план реализации

> **Для исполнителей:** ОБЯЗАТЕЛЬНЫЙ суб-скил: superpowers:executing-plans (или subagent-driven-development). Шаги отмечены чекбоксами (`- [ ]`).

**Цель:** восьмой компонент этапа 1. `RadioGroup.Root` и `RadioGroup.Item` (Radio это Item): нативные радио с общим `name`, круглая отметка 16 px с границей `control-edge`, контракт `value`/`defaultValue`/`onValueChange`. Строка «отметка + подпись» (и без подписи) имеет высоту контрола и стоит в одной линии с остальными контролами во всех пяти рядах; контраст отметки, кольцо фокуса и общий `name` группы проверяются на странице; компонент входит в матрицу формы пакета.

**Архитектура:** compound по образцу ToggleGroup: корень держит состояние (`createControllableSignal<string | null>`) и отдаёт его через контекст (`name`, `isSelected`, `select`, `disabled`); Item рисуется как Checkbox (`label` > `span` > нативный `input` с `appearance: none` + SVG с точкой). Клавиатуру (один Tab-стоп, стрелки, пропуск отключённых) даёт браузер благодаря общему `name`. В контролируемом режиме после выбора корень возвращает `checked` всех радио к значению родителя.

**Стек:** как в этапе 0 и предыдущих планах этапа 1.

**Спеки:** `docs/superpowers/specs/2026-10-29-stage-1-simple-controls-design.md` (основной; раздел 3.7 описывает RadioGroup, разделы 2 и 4 общие соглашения и страницу), `docs/superpowers/specs/2026-10-28-solid-kit-umbrella-design.md` (разделы 4.1, 5, 5.1, 7, 11.1, 12).

## Global Constraints

- Репозиторий публичный: ни ключей, ни токенов, ни `.env*` в коммитах. Не делать `git push`, не ставить теги в этом плане, не добавлять `LICENSE`, не менять git-идентичность, не переписывать историю (никаких `--amend`/`rebase`). Тег `v0.2.0` ставится в конце всего этапа 1, не здесь.
- Один класс — один файл; kebab-case; именованные экспорты; пропсы не деструктурируются (`splitProps`/`mergeProps`). Один компонент на файл (демо-компоненты playground тоже).
- В CSS компонентов: только токены, без литералов цветов, без `outline: none/0`, без голого `var(--s-kit-control-height)` (всегда с фолбэком `var(--s-kit-control-height, var(--s-kit-control-height-md))`).
- Стиль: ESLint (табы, одинарные кавычки, без висячих запятых, Stroustrup, max-len 140, `solid/reactivity` как ошибка: сигнал в тесте читать нельзя, использовать `vi.fn`), Stylelint (4 пробела, двойные кавычки, логические свойства; `pnpm exec stylelint --fix <файл>`). Перед каждым коммитом `pnpm check` зелёный.
- Коммиты оканчиваются трейлерами: `export TRAILERS=$'Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_017cEinKKFDiYmGrLaaKPqZu'`, затем `git commit -m "msg" -m "$TRAILERS"`.
- Dev-серверы убивать только по PID после проверки cwd (`lsof -a -p <PID> -d cwd -Fn`), никогда `pkill` по имени. Порт 5173 может быть занят чужим процессом: брать порт из вывода Vite.
- Браузерные проверки в Chrome. Кольца фокуса дают ложные FAIL, если проверки запущены щелчком мыши: запускать с клавиатуры (сфокусировать кнопку «Запустить проверки» через JS и нажать Enter) или сменой темы через переключатель. Координаты скриншота (1505 px) отличаются от CSS-пикселей страницы: клики по координатам из `getBoundingClientRect` пересчитывать (делить на `innerWidth / 1505`), прокрутку делать `scrollIntoView({behavior:'instant'})` и ждать. JS-инструмент иногда возвращает `[BLOCKED: Cookie/query string data]`: повторить коротким строковым результатом. Firefox и Safari не проверяются.
- Начало плана: `git status` чистый, `pnpm check` зелёный (209 тестов).

---

### Task 1: Компонент RadioGroup

**Files:**
- Create: `src/components/radio-group/radio-group-context.ts`
- Create: `src/components/radio-group/radio-group-root.tsx`
- Create: `src/components/radio-group/radio-group-item.tsx`
- Create: `src/components/radio-group/radio-group.module.css`
- Create: `src/components/radio-group/index.ts`
- Test: `src/components/radio-group/radio-group.test.tsx`

**Interfaces:**
- Consumes: `createControllableSignal` из `../../utils/create-controllable-signal`.
- Produces: `RadioGroupRoot(props: RadioGroupRootProps)`, `RadioGroupItem(props: RadioGroupItemProps)`, `RadioGroupContextValue { name: string; isSelected(value: string): boolean; select(value: string): void; disabled(): boolean }`, `useRadioGroupContext()` (бросает `Error` вне корня), `RadioGroup = { Root, Item }`; публичный путь `@stark/solid-kit/radio-group`; токены `--s-kit-radio-size`, `--s-kit-radio-gap`, `--s-kit-radio-group-gap`.

- [ ] **Step 1: Написать падающие тесты**

Создать `src/components/radio-group/radio-group.test.tsx`:

```tsx
import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library';
import { createSignal, type JSX } from 'solid-js';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { RadioGroup } from './index';

afterEach(cleanup);

function Items(): JSX.Element {
	return (
		<>
			<RadioGroup.Item value='a'>Первый</RadioGroup.Item>
			<RadioGroup.Item value='b'>Второй</RadioGroup.Item>
			<RadioGroup.Item value='c'>Третий</RadioGroup.Item>
		</>
	);
}

function radio(name: string): HTMLInputElement {
	return screen.getByRole<HTMLInputElement>('radio', { name });
}

function checkedValues(): string[] {
	return screen.getAllByRole<HTMLInputElement>('radio').filter((item) => item.checked).map((item) => item.value);
}

describe('RadioGroup', () => {
	it('renders a labelled radiogroup with the kit root attributes and radios named by their text', () => {
		render(() => (
			<RadioGroup.Root aria-label='Тариф'>
				<Items/>
			</RadioGroup.Root>
		));
		const group = screen.getByRole('radiogroup', { name: 'Тариф' });
		expect(group.hasAttribute('data-s-kit')).toBe(true);
		expect(group.getAttribute('data-orientation')).toBe('vertical');
		expect(screen.getAllByRole('radio').map((item) => item.getAttribute('value'))).toEqual(['a', 'b', 'c']);
		expect(radio('Второй').closest('label')?.hasAttribute('data-s-kit')).toBe(true);
		expect(radio('Второй').hasAttribute('data-s-kit')).toBe(false);
	});

	it('gives every radio of a group the same generated name and a different one to another group', () => {
		render(() => (
			<>
				<RadioGroup.Root aria-label='Первая'><Items/></RadioGroup.Root>
				<RadioGroup.Root aria-label='Вторая'><RadioGroup.Item value='x' aria-label='Икс'/></RadioGroup.Root>
			</>
		));
		const [first, second, third, other] = screen.getAllByRole<HTMLInputElement>('radio');
		expect(first?.name).not.toBe('');
		expect(second?.name).toBe(first?.name);
		expect(third?.name).toBe(first?.name);
		expect(other?.name).not.toBe(first?.name);
	});

	it('uses the name prop when it is given', () => {
		render(() => (
			<RadioGroup.Root aria-label='Тариф' name='plan'>
				<Items/>
			</RadioGroup.Root>
		));
		expect(screen.getAllByRole<HTMLInputElement>('radio').every((item) => item.name === 'plan')).toBe(true);
	});

	it('has nothing checked by default and shows defaultValue', () => {
		render(() => (
			<>
				<RadioGroup.Root aria-label='Пустая'><Items/></RadioGroup.Root>
				<RadioGroup.Root aria-label='С выбором' defaultValue='b'>
					<RadioGroup.Item value='a' aria-label='А'/>
					<RadioGroup.Item value='b' aria-label='Б'/>
				</RadioGroup.Root>
			</>
		));
		expect(radio('Первый').checked).toBe(false);
		expect(radio('А').checked).toBe(false);
		expect(radio('Б').checked).toBe(true);
	});

	it('selects the clicked radio and reports its value when uncontrolled', () => {
		const onValueChange = vi.fn();
		render(() => (
			<RadioGroup.Root aria-label='Тариф' defaultValue='a' onValueChange={onValueChange}>
				<Items/>
			</RadioGroup.Root>
		));
		fireEvent.click(radio('Третий'));
		expect(onValueChange).toHaveBeenCalledTimes(1);
		expect(onValueChange).toHaveBeenCalledWith('c');
		expect(checkedValues()).toEqual(['c']);
	});

	it('stays silent when the checked radio is clicked again', () => {
		const onValueChange = vi.fn();
		render(() => (
			<RadioGroup.Root aria-label='Тариф' defaultValue='a' onValueChange={onValueChange}>
				<Items/>
			</RadioGroup.Root>
		));
		fireEvent.click(radio('Первый'));
		expect(onValueChange).not.toHaveBeenCalled();
		expect(checkedValues()).toEqual(['a']);
	});

	it('shows the controlled value, goes back when the parent does not accept the change and follows the parent', () => {
		const [value, setValue] = createSignal<string | null>('a');
		const onValueChange = vi.fn();
		render(() => (
			<RadioGroup.Root aria-label='Тариф' value={value()} onValueChange={onValueChange}>
				<Items/>
			</RadioGroup.Root>
		));
		expect(checkedValues()).toEqual(['a']);
		fireEvent.click(radio('Второй'));
		expect(onValueChange).toHaveBeenCalledWith('b');
		expect(checkedValues()).toEqual(['a']);
		setValue('b');
		expect(checkedValues()).toEqual(['b']);
	});

	it('treats the value null as a controlled empty selection', () => {
		const onValueChange = vi.fn();
		render(() => (
			<RadioGroup.Root aria-label='Тариф' value={null} onValueChange={onValueChange}>
				<Items/>
			</RadioGroup.Root>
		));
		fireEvent.click(radio('Первый'));
		expect(onValueChange).toHaveBeenCalledWith('a');
		expect(checkedValues()).toEqual([]);
	});

	it('disables every radio when the group is disabled', () => {
		const onValueChange = vi.fn();
		render(() => (
			<RadioGroup.Root aria-label='Тариф' disabled onValueChange={onValueChange}>
				<Items/>
			</RadioGroup.Root>
		));
		expect(screen.getAllByRole<HTMLInputElement>('radio').every((item) => item.disabled)).toBe(true);
		expect(radio('Первый').closest('label')?.hasAttribute('data-disabled')).toBe(true);
		// fireEvent обходит disabled в jsdom, а нативный click() его уважает, как браузер
		radio('Первый').click();
		expect(onValueChange).not.toHaveBeenCalled();
	});

	it('disables a single radio and leaves the others enabled', () => {
		render(() => (
			<RadioGroup.Root aria-label='Тариф'>
				<RadioGroup.Item value='a' disabled>Первый</RadioGroup.Item>
				<RadioGroup.Item value='b'>Второй</RadioGroup.Item>
			</RadioGroup.Root>
		));
		expect(radio('Первый').disabled).toBe(true);
		expect(radio('Второй').disabled).toBe(false);
		expect(radio('Второй').closest('label')?.hasAttribute('data-disabled')).toBe(false);
	});

	it('sets data-s-kit-size only when size is passed and reflects the orientation', () => {
		render(() => (
			<>
				<RadioGroup.Root aria-label='Без размера'><Items/></RadioGroup.Root>
				<RadioGroup.Root aria-label='Малая' size='sm' orientation='horizontal'><Items/></RadioGroup.Root>
			</>
		));
		expect(screen.getByRole('radiogroup', { name: 'Без размера' }).hasAttribute('data-s-kit-size')).toBe(false);
		const small = screen.getByRole('radiogroup', { name: 'Малая' });
		expect(small.getAttribute('data-s-kit-size')).toBe('sm');
		expect(small.getAttribute('data-orientation')).toBe('horizontal');
	});

	it('passes attributes to the group and native attributes to the input of an item', () => {
		render(() => (
			<RadioGroup.Root aria-label='Тариф' class='custom' style={{ color: 'red' }} aria-invalid={true} data-testid='group'>
				<RadioGroup.Item value='a' id='first' aria-describedby='hint' class='mine' style={{ color: 'blue' }}>Первый</RadioGroup.Item>
			</RadioGroup.Root>
		));
		const group = screen.getByTestId('group');
		expect(group.classList.contains('custom')).toBe(true);
		expect(group.style.color).toBe('red');
		expect(group.getAttribute('aria-invalid')).toBe('true');
		const input = radio('Первый');
		expect(input.id).toBe('first');
		expect(input.getAttribute('aria-describedby')).toBe('hint');
		const root = input.closest('label');
		expect(root?.classList.contains('mine')).toBe(true);
		expect(root?.style.color).toBe('blue');
	});

	it('works without a label text when aria-label is given', () => {
		render(() => (
			<RadioGroup.Root aria-label='Тариф'>
				<RadioGroup.Item value='a' aria-label='Базовый'/>
			</RadioGroup.Root>
		));
		expect(radio('Базовый').closest('label')?.querySelector('[data-radio-label]')).toBeNull();
	});

	it('throws a clear error when an item is rendered outside the group', () => {
		expect(() => render(() => <RadioGroup.Item value='a'>Первый</RadioGroup.Item>)).toThrow('RadioGroup.Item');
	});
});
```

- [ ] **Step 2: Убедиться, что тесты падают**

Run: `pnpm exec vitest run src/components/radio-group`
Expected: FAIL (модуль `./index` не найден).

- [ ] **Step 3: Контекст**

Создать `src/components/radio-group/radio-group-context.ts`:

```ts
import { createContext, useContext } from 'solid-js';

export interface RadioGroupContextValue {
	name: string;
	isSelected: (value: string) => boolean;
	select: (value: string) => void;
	disabled: () => boolean;
}

export const RadioGroupContext = createContext<RadioGroupContextValue>();

export function useRadioGroupContext(): RadioGroupContextValue {
	const context = useContext(RadioGroupContext);
	if (!context) {
		throw new Error('RadioGroup.Item must be used inside RadioGroup.Root');
	}
	return context;
}
```

- [ ] **Step 4: Корень**

Создать `src/components/radio-group/radio-group-root.tsx`:

```tsx
import styles from './radio-group.module.css';

import { createUniqueId, type JSX, mergeProps, splitProps } from 'solid-js';

import { createControllableSignal } from '../../utils/create-controllable-signal';

import { RadioGroupContext, type RadioGroupContextValue } from './radio-group-context';

export type RadioGroupSize = 'sm' | 'md' | 'lg';
export type RadioGroupOrientation = 'vertical' | 'horizontal';

export interface RadioGroupRootProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'class' | 'style'> {
	value?: string | null | undefined;
	defaultValue?: string | null | undefined;
	onValueChange?: ((value: string) => void) | undefined;
	name?: string | undefined;
	disabled?: boolean | undefined;
	orientation?: RadioGroupOrientation | undefined;
	size?: RadioGroupSize | undefined;
	class?: string | undefined;
	style?: JSX.CSSProperties | undefined;
}

export function RadioGroupRoot(props: RadioGroupRootProps): JSX.Element {
	const merged = mergeProps({ orientation: 'vertical' } as const, props);
	const [local, rest] = splitProps(merged, [
		'value',
		'defaultValue',
		'onValueChange',
		'name',
		'disabled',
		'orientation',
		'size',
		'class',
		'style'
	]);
	const generatedName = createUniqueId();
	let root: HTMLDivElement | undefined;

	const [value, setValue] = createControllableSignal<string | null>({
		name: 'RadioGroup',
		value: () => local.value,
		defaultValue: () => local.defaultValue ?? null,
		onChange: (next) => {
			if (next !== null) {
				local.onValueChange?.(next);
			}
		}
	});

	// контролируемый режим: браузер уже перенёс выбор, а родитель мог его не принять, тогда радио возвращаются к значению родителя
	const syncDom = (): void => {
		for (const input of root?.querySelectorAll<HTMLInputElement>('input[type="radio"]') ?? []) {
			input.checked = input.value === value();
		}
	};

	const context: RadioGroupContextValue = {
		get name() {
			return local.name ?? generatedName;
		},
		isSelected: (itemValue) => value() === itemValue,
		select: (itemValue) => {
			setValue(itemValue);
			syncDom();
		},
		disabled: () => local.disabled === true
	};

	return (
		<RadioGroupContext.Provider value={context}>
			<div
				role='radiogroup'
				{...rest}
				ref={root}
				data-s-kit
				data-s-kit-size={local.size}
				data-orientation={local.orientation}
				class={local.class ? `${styles['root']} ${local.class}` : styles['root']}
				style={local.style}
			/>
		</RadioGroupContext.Provider>
	);
}
```

- [ ] **Step 5: Item**

Создать `src/components/radio-group/radio-group-item.tsx`:

```tsx
import styles from './radio-group.module.css';

import { children, type JSX, Show, splitProps } from 'solid-js';

import { useRadioGroupContext } from './radio-group-context';

export interface RadioGroupItemProps
	extends Omit<
		JSX.InputHTMLAttributes<HTMLInputElement>,
		'class' | 'style' | 'size' | 'type' | 'name' | 'value' | 'checked' | 'defaultChecked' | 'onChange' | 'onInput' | 'children'
	> {
	value: string;
	class?: string | undefined;
	style?: JSX.CSSProperties | undefined;
	/** Подпись. */
	children?: JSX.Element;
}

export function RadioGroupItem(props: RadioGroupItemProps): JSX.Element {
	const group = useRadioGroupContext();
	const [local, rest] = splitProps(props, ['value', 'disabled', 'class', 'style', 'children']);
	const label = children(() => local.children);
	const disabled = (): boolean => group.disabled() || local.disabled === true;

	return (
		<label
			data-s-kit
			data-disabled={disabled() ? '' : undefined}
			class={local.class ? `${styles['item']} ${local.class}` : styles['item']}
			style={local.style}
		>
			<span class={styles['box']}>
				<input
					{...rest}
					type='radio'
					name={group.name}
					value={local.value}
					class={styles['input']}
					checked={group.isSelected(local.value)}
					disabled={disabled()}
					onChange={() => group.select(local.value)}
				/>
				<svg class={styles['mark']} viewBox='0 0 16 16' aria-hidden='true'>
					<circle cx='8' cy='8' r='3' fill='currentColor'/>
				</svg>
			</span>
			<Show when={label.toArray().length > 0}>
				<span class={styles['label']} data-radio-label>{label()}</span>
			</Show>
		</label>
	);
}
```

- [ ] **Step 6: CSS**

Создать `src/components/radio-group/radio-group.module.css`:

```css
/*
 * Компонентные токены RadioGroup (публичный API кастомизации, читаются с фолбэком на глобальные):
 *   --s-kit-radio-size, --s-kit-radio-gap, --s-kit-radio-group-gap
 * Корень Item (label) имеет высоту контрола (спек этапа 1, раздел 3.7); отметка это нативный input с appearance: none,
 * точка рисуется соседним SVG поверх него. Кольцо фокуса на самом input. Клавиатура нативная: общий name группы.
 */

.root {
    display: inline-flex;
    flex: none;
    flex-direction: column;
    gap: var(--s-kit-radio-group-gap, 0);
}

.root[data-orientation="horizontal"] {
    flex-direction: row;
    gap: var(--s-kit-radio-group-gap, 16px);
}

.item {
    cursor: pointer;
    user-select: none;

    display: inline-flex;
    flex: none;
    gap: var(--s-kit-radio-gap, 8px);
    align-items: center;

    box-sizing: border-box;
    block-size: var(--s-kit-control-height, var(--s-kit-control-height-md));

    font-family: var(--s-kit-font);
    font-size: var(--s-kit-control-font-size, var(--s-kit-control-font-size-md));
    line-height: 1.25;
    color: var(--s-kit-color-text);
}

.item[data-disabled] {
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
    inline-size: var(--s-kit-radio-size, 16px);
    block-size: var(--s-kit-radio-size, 16px);
    margin: 0;
    border: 1px solid var(--s-kit-color-control-edge);
    border-radius: 50%;

    background: var(--s-kit-color-surface);

    transition: background-color 150ms, border-color 150ms;
}

.input:hover:not(:disabled) {
    background: var(--s-kit-color-hover);
}

.input:checked {
    border-color: var(--s-kit-color-primary);
    background: var(--s-kit-color-primary);
}

.input:checked:hover:not(:disabled) {
    border-color: var(--s-kit-color-primary-hover);
    background: var(--s-kit-color-primary-hover);
}

.input:checked:active:not(:disabled) {
    border-color: var(--s-kit-color-primary-active);
    background: var(--s-kit-color-primary-active);
}

.input:focus-visible {
    outline: var(--s-kit-focus-width) solid var(--s-kit-color-focus-ring);
    outline-offset: var(--s-kit-focus-ring-offset, var(--s-kit-focus-offset));
}

.input:checked:focus-visible {
    outline-color: var(--s-kit-focus-ring-on-fill, var(--s-kit-color-focus-ring));
}

.root[aria-invalid="true"] .input:not(:checked) {
    border-color: var(--s-kit-color-danger);
}

.root[aria-invalid="true"] .input:not(:checked):focus-visible {
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

.input:checked ~ .mark {
    display: block;
}

@media (prefers-reduced-motion: reduce) {
    .input {
        transition: none;
    }
}
```

Run: `pnpm exec stylelint --fix src/components/radio-group/radio-group.module.css`
Expected: без замечаний.

- [ ] **Step 7: Публичный путь**

Создать `src/components/radio-group/index.ts`:

```ts
import { RadioGroupItem } from './radio-group-item';
import { RadioGroupRoot } from './radio-group-root';

export type { RadioGroupItemProps } from './radio-group-item';
export type { RadioGroupOrientation, RadioGroupRootProps, RadioGroupSize } from './radio-group-root';

export const RadioGroup = { Root: RadioGroupRoot, Item: RadioGroupItem };
```

- [ ] **Step 8: Проверки**

Run: `pnpm exec eslint --fix src/components/radio-group && pnpm check`
Expected: зелёный, тестов 209 + 15 = 224 (точное число записать по факту). Если TypeScript или `solid/reactivity` придираются (например, к геттеру `name` в контексте или к `ref={root}` после спреда), поправить без изменения публичного API из спека и записать причину.

- [ ] **Step 9: Закоммитить**

```bash
git add src/components/radio-group
git commit -m "feat: RadioGroup, группа радиокнопок с нативной клавиатурой и контрактом value" -m "$TRAILERS"
```

---

### Task 2: RadioGroup в playground и проверки

**Files:**
- Modify: `playground/src/demo-controls.tsx`
- Create: `playground/src/demo-radio-groups.tsx`
- Create: `playground/src/radio-checks.ts`
- Modify: `playground/src/controls-row-page.tsx`
- Modify: `playground/src/playground.css`

**Interfaces:**
- Consumes: `RadioGroup` из `@stark/solid-kit/radio-group`; `blend`, `contrastRatio`, `Rgb` из `../../src/utils/color-math`; `CheckResult`, `resolveColor`, `Rgba` из `./theme-checks`.
- Produces: группа в рядах (горизонтальная, два радио: `data-row-control='radio-a'` и `'radio-b'` на их `input`; высоту измеряет `row-checks.ts` по корню `label`, ничего менять в нём не нужно); раздел с демо (`data-radio-group` на корне, `data-radio-demo` на `input`: `unchecked`, `checked`, `invalid`); `runRadioChecks(page: HTMLElement): CheckResult[]`; группа из двух радио в блоках фокуса (`data-focus-name='radio'`, `'radio-checked'`).

- [ ] **Step 1: Группа в ряду**

В `playground/src/demo-controls.tsx` добавить `import { RadioGroup } from '@stark/solid-kit/radio-group';` (по порядку импортов, после `input`) и в конец массива `DEMO_CONTROLS` (запятую после `checkbox-bare` добавить):

```tsx
	{
		id: 'radio-group',
		render: (size) => (
			<RadioGroup.Root aria-label='Режим радио' orientation='horizontal' defaultValue='a' size={size}>
				<RadioGroup.Item value='a' data-row-control='radio-a'>Один</RadioGroup.Item>
				<RadioGroup.Item value='b' data-row-control='radio-b'>Два</RadioGroup.Item>
			</RadioGroup.Root>
		)
	}
```

- [ ] **Step 2: Раздел с демо**

Создать `playground/src/demo-radio-groups.tsx`:

```tsx
import { RadioGroup } from '@stark/solid-kit/radio-group';
import type { JSX } from 'solid-js';

/** Вертикальная группа с выбором, группа с ошибкой и недоступная группа для проверок в radio-checks.ts. */
export function DemoRadioGroups(): JSX.Element {
	return (
		<div class='radio-demos'>
			<RadioGroup.Root data-radio-group aria-label='Тариф' defaultValue='pro'>
				<RadioGroup.Item value='basic' data-radio-demo='unchecked'>Базовый</RadioGroup.Item>
				<RadioGroup.Item value='pro' data-radio-demo='checked'>Расширенный</RadioGroup.Item>
				<RadioGroup.Item value='max'>Максимальный</RadioGroup.Item>
			</RadioGroup.Root>
			<RadioGroup.Root data-radio-group aria-label='Группа с ошибкой' aria-invalid={true}>
				<RadioGroup.Item value='yes' data-radio-demo='invalid'>Да</RadioGroup.Item>
				<RadioGroup.Item value='no'>Нет</RadioGroup.Item>
			</RadioGroup.Root>
			<RadioGroup.Root aria-label='Недоступная группа' disabled defaultValue='a'>
				<RadioGroup.Item value='a'>Недоступен</RadioGroup.Item>
				<RadioGroup.Item value='b'>Тоже недоступен</RadioGroup.Item>
			</RadioGroup.Root>
		</div>
	);
}
```

В `playground/src/playground.css` рядом с `.checkbox-demos` добавить:

```css
.radio-demos {
    display: flex;
    flex-wrap: wrap;
    gap: 32px;
    align-items: flex-start;
}
```

- [ ] **Step 3: Проверки радио**

Создать `playground/src/radio-checks.ts`:

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
 * Общий name радио одной группы (у каждой группы с data-radio-group), связь подписи и радио, контраст границы
 * (не выбран, с ошибкой), заливки и точки (выбран) у каждого радио с data-radio-demo.
 */
export function runRadioChecks(page: HTMLElement): CheckResult[] {
	const results: CheckResult[] = [];
	const check = (name: string, ok: boolean, detail: string): void => {
		results.push({ name, ok, detail });
	};
	const surface = resolveColor(getComputedStyle(page).backgroundColor);

	for (const group of page.querySelectorAll<HTMLElement>('[data-radio-group]')) {
		const label = group.getAttribute('aria-label') ?? '?';
		const names = new Set([...group.querySelectorAll('input[type="radio"]')].map((input) => input.getAttribute('name')));
		check(`RadioGroup «${label}»: радио группы делят один name`, names.size === 1 && !names.has(null) && !names.has(''), `имён ${names.size}`);
	}

	for (const input of page.querySelectorAll<HTMLInputElement>('[data-radio-demo]')) {
		const id = input.dataset['radioDemo'] ?? '?';
		const root = input.closest('label');
		if (!root) {
			throw new Error(`Playground element is missing in Radio ${id}`);
		}
		check(`Radio ${id}: подпись связана с радио`, root.control === input, `label.control = ${root.control?.tagName ?? 'null'}`);

		const style = getComputedStyle(input);
		if (id === 'checked') {
			const fill = resolveColor(style.backgroundColor);
			const fillRatio = contrastRatio(rgb(fill), rgb(surface));
			check(`Radio ${id}: заливка контрастна к поверхности (3:1)`, fillRatio >= 3, `контраст ${fillRatio.toFixed(2)}:1`);

			const mark = input.parentElement?.querySelector('svg');
			if (!mark) {
				throw new Error(`Playground element is missing in Radio ${id}: mark`);
			}
			const markStyle = getComputedStyle(mark);
			const markRatio = contrastRatio(rgb(resolveColor(markStyle.color)), rgb(fill));
			check(
				`Radio ${id}: точка видна и контрастна к заливке (3:1)`,
				markStyle.display !== 'none' && markRatio >= 3,
				`display ${markStyle.display}, контраст ${markRatio.toFixed(2)}:1`
			);
		}
		else {
			const edge = over(resolveColor(style.borderTopColor), surface);
			const ratio = contrastRatio(edge, rgb(surface));
			check(`Radio ${id}: граница контрастна к поверхности (3:1)`, ratio >= 3, `контраст ${ratio.toFixed(2)}:1`);
		}
	}
	return results;
}
```

- [ ] **Step 4: Подключить на страницу**

В `playground/src/controls-row-page.tsx`:
1. импорты: `import { RadioGroup } from '@stark/solid-kit/radio-group';`, `import { DemoRadioGroups } from './demo-radio-groups';`, `import { runRadioChecks } from './radio-checks';` (порядок поправит `eslint --fix`);
2. в `renderFocusControls()` в конец массива (запятую после предыдущего элемента добавить) добавить:

```tsx
		<RadioGroup.Root aria-label='Радио' orientation='horizontal' defaultValue='two'>
			<RadioGroup.Item value='one' aria-label='Радио' data-focus-name='radio'/>
			<RadioGroup.Item value='two' aria-label='Выбранное радио' data-focus-name='radio-checked'/>
		</RadioGroup.Root>
```

3. в `runChecks` добавить `...runRadioChecks(page)` последним элементом списка;
4. после раздела Checkbox добавить раздел:

```tsx
			<section>
				<h2>RadioGroup: группа, состояния и контраст отметки (стрелки двигают выбор)</h2>
				<DemoRadioGroups/>
			</section>
```

- [ ] **Step 5: Статическая проверка**

Run: `pnpm exec eslint --fix playground/src && pnpm exec stylelint --fix "playground/src/**/*.css" && pnpm check`
Expected: зелёный, тесты как в конце Task 1.

- [ ] **Step 6: Проверка в браузере (Chrome)**

`pnpm dev` в фоне (PID сохранить, порт из вывода Vite), открыть `<адрес>/#controls-row`, запустить проверки с клавиатуры, затем темы light, dark, system через переключатель (ждать 700 мс; в system вернуться через другую тему).

Expected в каждой теме:
- в каждом из пяти рядов два радио группы стоят на одной линии с остальными контролами, верх и низ корней совпадают с соседями;
- **все проверки OK**, число должно стать 277 (было 246: +10 высот двух радио в пяти рядах, +12 колец у двух радио в двух блоках фокуса, +9 проверок раздела: 2 группы по общему `name`, 3 демо-радио по подписи, граница не выбранного и с ошибкой, заливка и точка выбранного). Если число или результат другие, выяснить причину до коммита;
- контраст границы (не выбран, с ошибкой), заливки и точки не ниже 3:1 (значения записать в итоги);
- реальными действиями: щелчок по подписи «Базовый» переносит выбор; Tab входит в группу один раз (на выбранное радио), стрелка вниз и вверх двигает фокус и выбор, пропуская ничего лишнего; Tab выходит из группы; недоступная группа не реагирует; кольцо видно (снаружи и внутри блока с `data-s-kit-focus-inset`);
- глазами: выбранное, с ошибкой, недоступное выглядят по разделу 3.7 в обеих темах; консоль при загрузке чистая (перезагрузить страницу и прочитать консоль после этого).

Остановить dev-сервер по PID (после проверки cwd).

- [ ] **Step 7: Закоммитить**

```bash
git add playground
git commit -m "feat(playground): RadioGroup в рядах, демо, проверки name, контраста и кольца" -m "$TRAILERS"
```

---

### Task 3: RadioGroup в матрице формы пакета

**Files:**
- Modify: `scripts/consumer/src/main.tsx`
- Modify: `scripts/verify-package-form.sh`

**Interfaces:**
- Consumes: путь `@stark/solid-kit/radio-group`; токен `--s-kit-radio-size` как маркер стилей в собранном CSS.
- Produces: один новый пункт матрицы (стили RadioGroup в CSS; порядка нет: `composes` не используется).

- [ ] **Step 1: Потребитель импортирует RadioGroup**

В `scripts/consumer/src/main.tsx` добавить `import { RadioGroup } from '@stark/solid-kit/radio-group';` (по порядку, после `probe`) и рядом с остальными элементами:

```tsx
			<RadioGroup.Root aria-label="Тариф" defaultValue="basic">
				<RadioGroup.Item value="basic">Базовый</RadioGroup.Item>
				<RadioGroup.Item value="pro">Расширенный</RadioGroup.Item>
			</RadioGroup.Root>
```

- [ ] **Step 2: Проверка сборки**

В `scripts/verify-package-form.sh` после пункта про Checkbox добавить:

```bash
grep -lq -- '--s-kit-radio-size' dist/assets/*.css && ok "RadioGroup styles are in the built CSS" || fail "RadioGroup styles are missing from the built CSS"
```

- [ ] **Step 3: Коммит и прогон матрицы**

```bash
git add scripts
git commit -m "test: RadioGroup в матрице формы пакета" -m "$TRAILERS"
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

В таблице порядка (раздел 1) у строки «Radio + RadioGroup» добавить **Готов** и коммиты (`git log --oneline -5`), с точкой в конце ячейки, как у соседних строк. Добавить раздел «15. Итоги RadioGroup (2026-10-29)» по образцу разделов 8–14: число проверок страницы, измеренные контрасты в обеих темах, результаты реальных щелчков, Tab и стрелок (один Tab-стоп на группу, стрелки двигают выбор), кольцо снаружи и внутри, что матрица зелёная на обоих TypeScript, отличия от плана по ходу работы и список непроверенного: Firefox 125, Safari 17.5 (`appearance: none` на радио, поведение стрелок в группе с отключённым элементом), hover и active мышью, `forced-colors`, экранный диктор (проверена только разметка: `radiogroup` и нативные радио), карточки-радио. Если по ходу принималось решение, отличающееся от раздела 3.7, исправить раздел 3.7 тем же коммитом.

- [ ] **Step 2: Итоговая проверка и коммит**

Run: `pnpm check` и `git status` (чисто). Затем:

```bash
git add docs
git commit -m "docs: RadioGroup готов" -m "$TRAILERS"
```

Тег не ставится. Следующий компонент по порядку: Switch.

---

## Самопроверка плана

- **Покрытие спека (раздел 3.7):** compound и ошибка вне корня (Task 1), общий `name` и нативная клавиатура (Task 1 тесты и код, проверка стрелок в Task 2), контракт `value`/`null`, возврат при отказе (Task 1), `disabled` (Task 1), корень `radiogroup` с `orientation` и `size` (Task 1), атрибуты на корень и на `input` (Task 1), высота строки и контраст (Task 2), токены (Task 1, маркер Task 3), закрытие (Task 4).
- **Типы:** `RadioGroupContextValue` из контекста используется корнем и Item; `data-radio-group` ставится на корень и читается селектором `[data-radio-group]`; `data-radio-demo` на `input` читается как `dataset['radioDemo']`; `data-row-control` на `input` Item измеряется через ближайший `[data-s-kit]` (это `label` Item); число 277 выведено расчётом (10 + 12 + 9), тесты 224 (209 + 15).
- **Известные риски:** геттер `name` в объекте контекста и `ref={root}` после спреда с точки зрения `solid/reactivity`; в jsdom `fireEvent.click` по радио должен вызывать `change` (как у Checkbox); `createUniqueId` даёт разные имена двум группам и двум блокам фокуса (иначе радио блоков сбрасывали бы друг друга); `appearance: none` у радио в Firefox 125 и Safari 17.5 не проверяется.
- **Не покрыто сознательно:** одиночный `Radio` вне группы, `required`, карточки-радио, `aria-orientation`.
