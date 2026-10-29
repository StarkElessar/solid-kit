# solid-kit, этап 1: ToggleGroup — план реализации

> **Для исполнителей:** ОБЯЗАТЕЛЬНЫЙ суб-скил: superpowers:executing-plans (или subagent-driven-development). Шаги отмечены чекбоксами (`- [ ]`).

**Цель:** шестой компонент этапа 1. ToggleGroup: compound `ToggleGroup.Root` и `ToggleGroup.Item` поверх ButtonGroup и Button, режимы `single` (сегментированный контрол) и `multi`, контракт `value`/`defaultValue`/`onValueChange`, `aria-pressed` у сегментов, выбранный сегмент виден заливкой и цветом текста. В ряду «Контролы в ряд» оболочка стоит на одной линии с остальными контролами, кольцо фокуса сегментов (в том числе выбранного) внутри оболочки, контраст выбранного сегмента измеряется на странице, компонент входит в матрицу формы пакета.

**Архитектура:** `ToggleGroup.Root` рендерит `ButtonGroup` (геометрия, размер, внутреннее кольцо приходят от него) и держит состояние выбора через `createControllableSignal<readonly string[]>`; части получают его через контекст (`isSelected`, `toggle`, `disabled`). `ToggleGroup.Item` это `Button` с `variant='plain'`, `aria-pressed` и `data-selected`. Чистая логика (приведение значения к списку, переход выбора по режиму) вынесена в `toggle-group-selection.ts` и тестируется отдельно. Правила выбранного сегмента написаны с повышенной специфичностью, порядок CSS в бандле не важен.

**Стек:** как в этапе 0 и предыдущих планах этапа 1.

**Спеки:** `docs/superpowers/specs/2026-10-29-stage-1-simple-controls-design.md` (основной; раздел 3.5 описывает ToggleGroup, разделы 2 и 4 общие соглашения и страницу, раздел 7 вопрос 4 про вид выбранного сегмента), `docs/superpowers/specs/2026-10-28-solid-kit-umbrella-design.md` (разделы 1 не-цели a11y, 4.1, 5, 5.1, 7, 11.1, 12).

## Global Constraints

- Репозиторий публичный: ни ключей, ни токенов, ни `.env*` в коммитах. Не делать `git push`, не ставить теги в этом плане, не добавлять `LICENSE`, не менять git-идентичность, не переписывать историю (никаких `--amend`/`rebase`). Тег `v0.2.0` ставится в конце всего этапа 1, не здесь.
- Один класс — один файл; kebab-case; именованные экспорты; пропсы не деструктурируются (`splitProps`/`mergeProps`). Один компонент на файл (демо-компоненты playground тоже).
- В CSS компонентов: только токены, без литералов цветов, без `outline: none/0`, без голого `var(--s-kit-control-height)` (всегда с фолбэком `var(--s-kit-control-height, var(--s-kit-control-height-md))`).
- Стиль: ESLint (табы, одинарные кавычки, без висячих запятых, Stroustrup, max-len 140, `solid/reactivity` как ошибка: сигнал в тесте читать нельзя, использовать `vi.fn`), Stylelint (4 пробела, двойные кавычки, логические свойства; `pnpm exec stylelint --fix <файл>`). Перед каждым коммитом `pnpm check` зелёный.
- Коммиты оканчиваются трейлерами: `export TRAILERS=$'Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_017cEinKKFDiYmGrLaaKPqZu'`, затем `git commit -m "msg" -m "$TRAILERS"`.
- Dev-серверы убивать только по PID после проверки cwd (`lsof -a -p <PID> -d cwd -Fn`), никогда `pkill` по имени. Порт 5173 может быть занят чужим процессом: брать порт из вывода Vite.
- Браузерные проверки в Chrome; окно должно быть в фокусе (клик по странице), иначе кольца фокуса дают ложные FAIL; JS-инструмент иногда возвращает `[BLOCKED: Cookie/query string data]`: повторить коротким строковым результатом. Firefox и Safari не проверяются (записывается в отчёте).
- Начало плана: `git status` чистый, `pnpm check` зелёный (171 тест).

## Решения, которые нужно подтвердить вместе с планом

1. **Single не снимает выбор** повторным щелчком (сегментированный контрол). `deselectable` не вводим.
2. **Только `aria-pressed`, без стрелок и roving tabindex** (зонтичный спек, раздел 1, не-цели): Tab проходит по каждому сегменту, Space и Enter переключают.
3. **Вид выбранного сегмента:** заливка `primary-subtle` и текст цвета primary (спек, раздел 3.5 и вопрос 4). Заливка почти сливается с `tint` оболочки, поэтому добавлен второй признак. Окончательный вид владелец смотрит на странице в Task 3; смена вида не меняет API.
4. **У `Item` нет `onClick`, `variant`, `size`**: сегмент только переключает выбор, реакция в `onValueChange` корня.

---

### Task 1: Чистая логика выбора и контекст

**Files:**
- Create: `src/components/toggle-group/toggle-group-selection.ts`
- Create: `src/components/toggle-group/toggle-group-context.ts`
- Test: `src/components/toggle-group/toggle-group-selection.test.ts`

**Interfaces:**
- Consumes: ничего из кода кита.
- Produces:
  - `type ToggleGroupMode = 'single' | 'multi'`
  - `toSelection(value: string | null | readonly string[] | undefined): readonly string[] | undefined`
  - `nextSelection(mode: ToggleGroupMode, current: readonly string[], value: string): readonly string[] | undefined` (`undefined` значит «выбор не меняется»)
  - `ToggleGroupContextValue { isSelected(value: string): boolean; toggle(value: string): void; disabled(): boolean }`, `ToggleGroupContext`, `useToggleGroupContext()` (бросает `Error`, если контекста нет).

- [ ] **Step 1: Написать падающие тесты чистых функций**

Создать `src/components/toggle-group/toggle-group-selection.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import { nextSelection, toSelection } from './toggle-group-selection';

describe('toSelection', () => {
	it('keeps undefined so that the group stays uncontrolled', () => {
		expect(toSelection(undefined)).toBeUndefined();
	});

	it('turns null into an empty selection', () => {
		expect(toSelection(null)).toEqual([]);
	});

	it('turns a single value into a one-item list', () => {
		expect(toSelection('week')).toEqual(['week']);
	});

	it('keeps a list as it is', () => {
		const list = ['day', 'month'];
		expect(toSelection(list)).toBe(list);
	});
});

describe('nextSelection in single mode', () => {
	it('selects the clicked item', () => {
		expect(nextSelection('single', [], 'day')).toEqual(['day']);
	});

	it('replaces the previous selection', () => {
		expect(nextSelection('single', ['day'], 'week')).toEqual(['week']);
	});

	it('does not change anything when the selected item is clicked again', () => {
		expect(nextSelection('single', ['day'], 'day')).toBeUndefined();
	});
});

describe('nextSelection in multi mode', () => {
	it('adds the clicked item at the end', () => {
		expect(nextSelection('multi', ['day'], 'month')).toEqual(['day', 'month']);
	});

	it('removes the clicked item when it is selected', () => {
		expect(nextSelection('multi', ['day', 'month'], 'day')).toEqual(['month']);
	});

	it('does not mutate the current list', () => {
		const current = ['day'];
		nextSelection('multi', current, 'month');
		nextSelection('multi', current, 'day');
		expect(current).toEqual(['day']);
	});
});
```

- [ ] **Step 2: Убедиться, что тесты падают**

Run: `pnpm exec vitest run src/components/toggle-group`
Expected: FAIL (модуль `./toggle-group-selection` не найден).

- [ ] **Step 3: Реализовать чистые функции**

Создать `src/components/toggle-group/toggle-group-selection.ts`:

```ts
export type ToggleGroupMode = 'single' | 'multi';

/** Значение пропса в список выбранных. `undefined` остаётся `undefined` («не контролируется»), `null` это пустой выбор. */
export function toSelection(value: string | null | readonly string[] | undefined): readonly string[] | undefined {
	if (value === undefined) {
		return undefined;
	}
	if (value === null) {
		return [];
	}
	return typeof value === 'string' ? [value] : value;
}

/** Выбор после щелчка по сегменту; `undefined`, если выбор не меняется (повторный щелчок по выбранному в single). */
export function nextSelection(mode: ToggleGroupMode, current: readonly string[], value: string): readonly string[] | undefined {
	const selected = current.includes(value);
	if (mode === 'single') {
		return selected ? undefined : [value];
	}
	return selected ? current.filter((item) => item !== value) : [...current, value];
}
```

- [ ] **Step 4: Создать контекст**

Создать `src/components/toggle-group/toggle-group-context.ts`:

```ts
import { createContext, useContext } from 'solid-js';

export interface ToggleGroupContextValue {
	isSelected: (value: string) => boolean;
	toggle: (value: string) => void;
	disabled: () => boolean;
}

export const ToggleGroupContext = createContext<ToggleGroupContextValue>();

export function useToggleGroupContext(): ToggleGroupContextValue {
	const context = useContext(ToggleGroupContext);
	if (!context) {
		throw new Error('ToggleGroup.Item must be used inside ToggleGroup.Root');
	}
	return context;
}
```

- [ ] **Step 5: Тесты и статические проверки**

Run: `pnpm exec eslint --fix src/components/toggle-group && pnpm exec vitest run src/components/toggle-group`
Expected: 10 тестов зелёные, eslint без замечаний.

- [ ] **Step 6: Закоммитить**

```bash
git add src/components/toggle-group
git commit -m "feat: логика выбора и контекст ToggleGroup" -m "$TRAILERS"
```

(`pnpm check` на этом коммите не требуется: компонента ещё нет; полная проверка в конце Task 2.)

---

### Task 2: Компоненты Root и Item, CSS, публичный путь

**Files:**
- Create: `src/components/toggle-group/toggle-group-root.tsx`
- Create: `src/components/toggle-group/toggle-group-item.tsx`
- Create: `src/components/toggle-group/toggle-group.module.css`
- Create: `src/components/toggle-group/index.ts`
- Test: `src/components/toggle-group/toggle-group.test.tsx`

**Interfaces:**
- Consumes: `ButtonGroup`, `ButtonGroupProps` из `../button-group`; `Button`, `ButtonProps` из `../button`; `createControllableSignal` из `../../utils/create-controllable-signal`; всё из Task 1.
- Produces:
  - `ToggleGroupRoot(props: ToggleGroupRootProps): JSX.Element`, типы `ToggleGroupBaseProps`, `ToggleGroupSingleProps`, `ToggleGroupMultiProps`, `ToggleGroupRootProps`;
  - `ToggleGroupItem(props: ToggleGroupItemProps): JSX.Element`, тип `ToggleGroupItemProps`;
  - `ToggleGroup = { Root: ToggleGroupRoot, Item: ToggleGroupItem }`; публичный путь `@stark/solid-kit/toggle-group`; токены `--s-kit-toggle-group-selected-bg`, `--s-kit-toggle-group-selected-color`.

- [ ] **Step 1: Написать падающие тесты компонента**

Создать `src/components/toggle-group/toggle-group.test.tsx`:

```tsx
import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library';
import { createSignal, type JSX } from 'solid-js';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ToggleGroup } from './index';

afterEach(cleanup);

function Items(): JSX.Element {
	return (
		<>
			<ToggleGroup.Item value='day'>День</ToggleGroup.Item>
			<ToggleGroup.Item value='week'>Неделя</ToggleGroup.Item>
			<ToggleGroup.Item value='month'>Месяц</ToggleGroup.Item>
		</>
	);
}

function button(name: string): HTMLElement {
	return screen.getByRole('button', { name });
}

function isPressed(name: string): boolean {
	return button(name).getAttribute('aria-pressed') === 'true';
}

describe('ToggleGroup', () => {
	it('renders a labelled group of buttons with the kit root attributes', () => {
		render(() => (
			<ToggleGroup.Root aria-label='Период'>
				<Items/>
			</ToggleGroup.Root>
		));
		const group = screen.getByRole('group', { name: 'Период' });
		expect(group.hasAttribute('data-s-kit')).toBe(true);
		expect(group.hasAttribute('data-s-kit-focus-inset')).toBe(true);
		expect(screen.getAllByRole('button').map((item) => item.textContent)).toEqual(['День', 'Неделя', 'Месяц']);
	});

	it('has nothing pressed by default in single mode', () => {
		render(() => (
			<ToggleGroup.Root aria-label='Период'>
				<Items/>
			</ToggleGroup.Root>
		));
		expect(screen.getAllByRole('button').map((item) => item.getAttribute('aria-pressed'))).toEqual(['false', 'false', 'false']);
		expect(screen.getAllByRole('button').some((item) => item.hasAttribute('data-selected'))).toBe(false);
	});

	it('marks the selected item with aria-pressed and data-selected', () => {
		render(() => (
			<ToggleGroup.Root aria-label='Период' defaultValue='week'>
				<Items/>
			</ToggleGroup.Root>
		));
		expect(isPressed('Неделя')).toBe(true);
		expect(button('Неделя').hasAttribute('data-selected')).toBe(true);
		expect(isPressed('День')).toBe(false);
		expect(button('День').hasAttribute('data-selected')).toBe(false);
	});

	it('moves the selection in single mode and reports the new value', () => {
		const onValueChange = vi.fn();
		render(() => (
			<ToggleGroup.Root aria-label='Период' defaultValue='week' onValueChange={onValueChange}>
				<Items/>
			</ToggleGroup.Root>
		));
		fireEvent.click(button('Месяц'));
		expect(onValueChange).toHaveBeenCalledTimes(1);
		expect(onValueChange).toHaveBeenCalledWith('month');
		expect(isPressed('Месяц')).toBe(true);
		expect(isPressed('Неделя')).toBe(false);
	});

	it('keeps the selection and stays silent when the selected item is clicked again in single mode', () => {
		const onValueChange = vi.fn();
		render(() => (
			<ToggleGroup.Root aria-label='Период' defaultValue='week' onValueChange={onValueChange}>
				<Items/>
			</ToggleGroup.Root>
		));
		fireEvent.click(button('Неделя'));
		expect(onValueChange).not.toHaveBeenCalled();
		expect(isPressed('Неделя')).toBe(true);
	});

	it('shows the controlled value and moves only when the parent accepts the change', () => {
		const [value, setValue] = createSignal<string | null>('day');
		const onValueChange = vi.fn();
		render(() => (
			<ToggleGroup.Root aria-label='Период' value={value()} onValueChange={onValueChange}>
				<Items/>
			</ToggleGroup.Root>
		));
		fireEvent.click(button('Неделя'));
		expect(onValueChange).toHaveBeenCalledWith('week');
		expect(isPressed('День')).toBe(true);
		expect(isPressed('Неделя')).toBe(false);
		setValue('week');
		expect(isPressed('Неделя')).toBe(true);
		expect(isPressed('День')).toBe(false);
	});

	it('treats the value null as a controlled empty selection', () => {
		const onValueChange = vi.fn();
		render(() => (
			<ToggleGroup.Root aria-label='Период' value={null} onValueChange={onValueChange}>
				<Items/>
			</ToggleGroup.Root>
		));
		fireEvent.click(button('День'));
		expect(onValueChange).toHaveBeenCalledWith('day');
		expect(isPressed('День')).toBe(false);
	});

	it('toggles items independently in multi mode and reports the whole selection', () => {
		const onValueChange = vi.fn();
		render(() => (
			<ToggleGroup.Root aria-label='Дни' mode='multi' onValueChange={onValueChange}>
				<Items/>
			</ToggleGroup.Root>
		));
		fireEvent.click(button('День'));
		fireEvent.click(button('Месяц'));
		expect(onValueChange).toHaveBeenLastCalledWith(['day', 'month']);
		expect(isPressed('День')).toBe(true);
		expect(isPressed('Месяц')).toBe(true);
		expect(isPressed('Неделя')).toBe(false);
		fireEvent.click(button('День'));
		expect(onValueChange).toHaveBeenLastCalledWith(['month']);
		expect(isPressed('День')).toBe(false);
	});

	it('shows defaultValue in multi mode', () => {
		render(() => (
			<ToggleGroup.Root aria-label='Дни' mode='multi' defaultValue={['day', 'month']}>
				<Items/>
			</ToggleGroup.Root>
		));
		expect(isPressed('День')).toBe(true);
		expect(isPressed('Неделя')).toBe(false);
		expect(isPressed('Месяц')).toBe(true);
	});

	it('follows the controlled array in multi mode', () => {
		const [value, setValue] = createSignal<readonly string[]>(['day']);
		const onValueChange = vi.fn();
		render(() => (
			<ToggleGroup.Root aria-label='Дни' mode='multi' value={value()} onValueChange={onValueChange}>
				<Items/>
			</ToggleGroup.Root>
		));
		fireEvent.click(button('Неделя'));
		expect(onValueChange).toHaveBeenCalledWith(['day', 'week']);
		expect(isPressed('Неделя')).toBe(false);
		setValue(['week']);
		expect(isPressed('Неделя')).toBe(true);
		expect(isPressed('День')).toBe(false);
	});

	it('disables every item when the group is disabled', () => {
		const onValueChange = vi.fn();
		render(() => (
			<ToggleGroup.Root aria-label='Период' disabled onValueChange={onValueChange}>
				<Items/>
			</ToggleGroup.Root>
		));
		const items = screen.getAllByRole<HTMLButtonElement>('button');
		expect(items.every((item) => item.disabled)).toBe(true);
		fireEvent.click(button('День'));
		expect(onValueChange).not.toHaveBeenCalled();
	});

	it('disables a single item', () => {
		const onValueChange = vi.fn();
		render(() => (
			<ToggleGroup.Root aria-label='Период' onValueChange={onValueChange}>
				<ToggleGroup.Item value='day' disabled>День</ToggleGroup.Item>
				<ToggleGroup.Item value='week'>Неделя</ToggleGroup.Item>
			</ToggleGroup.Root>
		));
		fireEvent.click(button('День'));
		expect(onValueChange).not.toHaveBeenCalled();
		fireEvent.click(button('Неделя'));
		expect(onValueChange).toHaveBeenCalledWith('week');
	});

	it('sets data-s-kit-size on the group only when size is passed', () => {
		render(() => (
			<>
				<ToggleGroup.Root aria-label='Без размера'><Items/></ToggleGroup.Root>
				<ToggleGroup.Root aria-label='Малая' size='sm'><Items/></ToggleGroup.Root>
			</>
		));
		expect(screen.getByRole('group', { name: 'Без размера' }).hasAttribute('data-s-kit-size')).toBe(false);
		expect(screen.getByRole('group', { name: 'Малая' }).getAttribute('data-s-kit-size')).toBe('sm');
	});

	it('passes class, style and native attributes through to the group and to an item', () => {
		render(() => (
			<ToggleGroup.Root aria-label='Период' class='custom' style={{ color: 'red' }} data-testid='group'>
				<ToggleGroup.Item value='day' class='mine' data-testid='item'>День</ToggleGroup.Item>
			</ToggleGroup.Root>
		));
		const group = screen.getByTestId('group');
		expect(group.classList.contains('custom')).toBe(true);
		expect(group.style.color).toBe('red');
		const item = screen.getByTestId('item');
		expect(item.classList.contains('mine')).toBe(true);
		expect(item.tagName).toBe('BUTTON');
	});

	it('throws a clear error when an item is rendered outside the group', () => {
		expect(() => render(() => <ToggleGroup.Item value='day'>День</ToggleGroup.Item>)).toThrow('ToggleGroup.Item');
	});
});
```

- [ ] **Step 2: Убедиться, что тесты падают**

Run: `pnpm exec vitest run src/components/toggle-group/toggle-group.test.tsx`
Expected: FAIL (модуль `./index` не найден).

- [ ] **Step 3: Реализовать Root**

Создать `src/components/toggle-group/toggle-group-root.tsx` (собственного класса у `Root` нет: правила CSS привязаны к `Item`, поэтому модуль CSS здесь не импортируется):

```tsx
import { type JSX, splitProps } from 'solid-js';

import { createControllableSignal } from '../../utils/create-controllable-signal';
import { ButtonGroup, type ButtonGroupProps } from '../button-group';

import { ToggleGroupContext, type ToggleGroupContextValue } from './toggle-group-context';
import { nextSelection, type ToggleGroupMode, toSelection } from './toggle-group-selection';

export interface ToggleGroupBaseProps extends ButtonGroupProps {
	disabled?: boolean | undefined;
}

export interface ToggleGroupSingleProps extends ToggleGroupBaseProps {
	mode?: 'single' | undefined;
	value?: string | null | undefined;
	defaultValue?: string | null | undefined;
	onValueChange?: ((value: string) => void) | undefined;
}

export interface ToggleGroupMultiProps extends ToggleGroupBaseProps {
	mode: 'multi';
	value?: readonly string[] | undefined;
	defaultValue?: readonly string[] | undefined;
	onValueChange?: ((value: string[]) => void) | undefined;
}

export type ToggleGroupRootProps = ToggleGroupSingleProps | ToggleGroupMultiProps;

export function ToggleGroupRoot(props: ToggleGroupRootProps): JSX.Element {
	const [, rest] = splitProps(props, ['mode', 'value', 'defaultValue', 'onValueChange', 'disabled']);
	const mode = (): ToggleGroupMode => props.mode ?? 'single';

	// в обоих режимах состояние это список выбранных; наружу он уходит значением режима
	const [selection, setSelection] = createControllableSignal<readonly string[]>({
		name: 'ToggleGroup',
		value: () => toSelection(props.value),
		defaultValue: () => toSelection(props.defaultValue) ?? [],
		onChange: (next) => {
			if (props.mode === 'multi') {
				props.onValueChange?.([...next]);
			}
			else if (next[0] !== undefined) {
				props.onValueChange?.(next[0]);
			}
		}
	});

	const context: ToggleGroupContextValue = {
		isSelected: (value) => selection().includes(value),
		toggle: (value) => {
			const next = nextSelection(mode(), selection(), value);
			if (next) {
				setSelection(next);
			}
		},
		disabled: () => props.disabled === true
	};

	return (
		<ToggleGroupContext.Provider value={context}>
			<ButtonGroup {...rest}/>
		</ToggleGroupContext.Provider>
	);
}
```

- [ ] **Step 4: Реализовать Item**

Создать `src/components/toggle-group/toggle-group-item.tsx`:

```tsx
import styles from './toggle-group.module.css';

import { type JSX, splitProps } from 'solid-js';

import { Button, type ButtonProps } from '../button';

import { useToggleGroupContext } from './toggle-group-context';

export interface ToggleGroupItemProps extends Omit<ButtonProps, 'variant' | 'size' | 'onClick' | 'aria-pressed'> {
	value: string;
}

export function ToggleGroupItem(props: ToggleGroupItemProps): JSX.Element {
	const group = useToggleGroupContext();
	const [local, rest] = splitProps(props, ['value', 'disabled', 'class']);
	const selected = (): boolean => group.isSelected(local.value);

	return (
		<Button
			{...rest}
			variant='plain'
			aria-pressed={selected()}
			data-selected={selected() ? '' : undefined}
			disabled={group.disabled() || local.disabled === true}
			class={local.class ? `${styles['item']} ${local.class}` : styles['item']}
			onClick={() => group.toggle(local.value)}
		/>
	);
}
```

- [ ] **Step 5: CSS**

Создать `src/components/toggle-group/toggle-group.module.css`:

```css
/*
 * Компонентные токены ToggleGroup (публичный API кастомизации, читаются с фолбэком на глобальные):
 *   --s-kit-toggle-group-selected-bg, --s-kit-toggle-group-selected-color
 * Геометрия, размер и внутреннее кольцо фокуса приходят от ButtonGroup. Правила выбранного сегмента написаны со специфичностью
 * выше, чем у правил Button и ButtonGroup для plain (в том числе hover и active): порядок CSS в бандле не важен.
 * Наведение и нажатие на выбранный сегмент заливку не меняют.
 */

[data-s-kit-focus-inset] .item[data-selected][data-variant="plain"] {
    color: var(--s-kit-toggle-group-selected-color, var(--s-kit-color-primary));
    background: var(--s-kit-toggle-group-selected-bg, var(--s-kit-color-primary-subtle));
}

[data-s-kit-focus-inset] .item[data-selected][data-variant="plain"]:hover:not(:disabled),
[data-s-kit-focus-inset] .item[data-selected][data-variant="plain"]:active:not(:disabled) {
    background: var(--s-kit-toggle-group-selected-bg, var(--s-kit-color-primary-subtle));
}
```

Run: `pnpm exec stylelint --fix src/components/toggle-group/toggle-group.module.css`
Expected: без замечаний (если `no-descending-specificity` или другое правило ругается, поправить порядок так, чтобы смысл остался: сначала общее правило, затем hover/active).

- [ ] **Step 6: Публичный путь**

Создать `src/components/toggle-group/index.ts`:

```ts
import { ToggleGroupItem } from './toggle-group-item';
import { ToggleGroupRoot } from './toggle-group-root';

export type { ToggleGroupItemProps } from './toggle-group-item';
export type { ToggleGroupBaseProps, ToggleGroupMultiProps, ToggleGroupRootProps, ToggleGroupSingleProps } from './toggle-group-root';
export type { ToggleGroupMode } from './toggle-group-selection';

export const ToggleGroup = { Root: ToggleGroupRoot, Item: ToggleGroupItem };
```

- [ ] **Step 7: Тесты, типы, линтеры**

Run: `pnpm exec eslint --fix src/components/toggle-group && pnpm check`
Expected: зелёный; тестов около 171 + 10 + 15 = 196 (точное число записать по факту). Если TypeScript не принимает `<ToggleGroup.Root mode='multi' defaultValue={[...]}>` (дискриминация объединения по `mode`) или `props.mode === 'multi'` не сужает `props`, исправить типы так, чтобы публичное API из спека (раздел 3.5) не менялось, и записать причину. Если `solid/reactivity` придирается к `props.value` в `value: () => …`, это замыкание внутри отслеживаемой функции хелпера: допустимо, как в Input.

- [ ] **Step 8: Закоммитить**

```bash
git add src/components/toggle-group
git commit -m "feat: ToggleGroup, группа переключателей single и multi поверх ButtonGroup" -m "$TRAILERS"
```

---

### Task 3: ToggleGroup в playground, проверки и просмотр в браузере

**Files:**
- Modify: `playground/src/demo-controls.tsx`
- Create: `playground/src/demo-toggle-groups.tsx`
- Create: `playground/src/toggle-group-checks.ts`
- Modify: `playground/src/controls-row-page.tsx`
- Modify: `playground/src/playground.css`

**Interfaces:**
- Consumes: `ToggleGroup` из `@stark/solid-kit/toggle-group`; `resolveColor`, `CheckResult`, `Rgba` из `./theme-checks`; `contrastRatio`, `Rgb` из `../../src/utils/color-math`.
- Produces: контроль `toggle-group` в пяти рядах (`data-row-control='toggle-group'`, `data-row-group`); два живых примера с `data-toggle-demo`; `runToggleGroupChecks(page: HTMLElement): CheckResult[]`; группа в блоках фокуса с `data-focus-name='toggle-selected'` и `'toggle-plain'`.

- [ ] **Step 1: Контроль в ряду**

В `playground/src/demo-controls.tsx` добавить `import { ToggleGroup } from '@stark/solid-kit/toggle-group';` (по порядку импортов, после `input`) и в конец массива `DEMO_CONTROLS`:

```tsx
	{
		id: 'toggle-group',
		render: (size) => (
			<ToggleGroup.Root data-row-control='toggle-group' data-row-group aria-label='Режим' defaultValue='week' size={size}>
				<ToggleGroup.Item value='day'>День</ToggleGroup.Item>
				<ToggleGroup.Item value='week'>Неделя</ToggleGroup.Item>
				<ToggleGroup.Item value='month'>Месяц</ToggleGroup.Item>
			</ToggleGroup.Root>
		)
	}
```

(запятую после предыдущего элемента массива добавить.)

- [ ] **Step 2: Живые примеры обоих режимов**

Создать `playground/src/demo-toggle-groups.tsx`:

```tsx
import { ToggleGroup } from '@stark/solid-kit/toggle-group';
import { createSignal, type JSX } from 'solid-js';

/** Два управляемых примера: щелчок мышью меняет значение, которое тут же показано текстом. Для проверок в toggle-group-checks.ts. */
export function DemoToggleGroups(): JSX.Element {
	const [single, setSingle] = createSignal<string | null>('week');
	const [multi, setMulti] = createSignal<readonly string[]>(['day', 'month']);

	return (
		<div class='toggle-demos'>
			<div class='toggle-demo'>
				<ToggleGroup.Root data-toggle-demo='single' aria-label='Один' value={single()} onValueChange={(next) => setSingle(next)}>
					<ToggleGroup.Item value='day'>День</ToggleGroup.Item>
					<ToggleGroup.Item value='week'>Неделя</ToggleGroup.Item>
					<ToggleGroup.Item value='month'>Месяц</ToggleGroup.Item>
				</ToggleGroup.Root>
				<output data-toggle-output='single'>single: {single() ?? 'ничего'}</output>
			</div>
			<div class='toggle-demo'>
				<ToggleGroup.Root
					data-toggle-demo='multi'
					aria-label='Несколько'
					mode='multi'
					value={multi()}
					onValueChange={(next) => setMulti(next)}
				>
					<ToggleGroup.Item value='day'>День</ToggleGroup.Item>
					<ToggleGroup.Item value='week'>Неделя</ToggleGroup.Item>
					<ToggleGroup.Item value='month'>Месяц</ToggleGroup.Item>
				</ToggleGroup.Root>
				<output data-toggle-output='multi'>multi: {multi().join(', ') || 'ничего'}</output>
			</div>
		</div>
	);
}
```

В `playground/src/playground.css` добавить (рядом с `.field-demos`, Stylelint: 4 пробела, логические свойства):

```css
.toggle-demos {
    display: flex;
    flex-wrap: wrap;
    gap: 24px;
}

.toggle-demo {
    display: flex;
    gap: 12px;
    align-items: center;
}
```

- [ ] **Step 3: Проверки выбранного сегмента**

Создать `playground/src/toggle-group-checks.ts`:

```ts
import { contrastRatio, type Rgb } from '../../src/utils/color-math';

import { type CheckResult, resolveColor, type Rgba } from './theme-checks';

function rgb([red, green, blue]: Rgba): Rgb {
	return [red, green, blue];
}

/**
 * Согласованность aria-pressed и data-selected, читаемость текста выбранного сегмента, отличие выбранного от невыбранного
 * (заливка и цвет текста) и неизменность высоты у каждой группы с data-toggle-demo. В группе должны быть выбранный и невыбранный сегменты.
 */
export function runToggleGroupChecks(page: HTMLElement): CheckResult[] {
	const results: CheckResult[] = [];
	const check = (name: string, ok: boolean, detail: string): void => {
		results.push({ name, ok, detail });
	};

	for (const group of page.querySelectorAll<HTMLElement>('[data-toggle-demo]')) {
		const id = group.dataset['toggleDemo'] ?? '?';
		const items = [...group.querySelectorAll<HTMLElement>('button')];
		const selected = items.filter((item) => item.getAttribute('aria-pressed') === 'true');
		const plain = items.filter((item) => item.getAttribute('aria-pressed') === 'false');
		const firstSelected = selected[0];
		const firstPlain = plain[0];
		if (!firstSelected || !firstPlain) {
			throw new Error(`Playground element is missing in ToggleGroup ${id}`);
		}

		check(
			`ToggleGroup ${id}: aria-pressed совпадает с data-selected`,
			items.every((item) => item.hasAttribute('data-selected') === (item.getAttribute('aria-pressed') === 'true')),
			`выбрано ${selected.length} из ${items.length}`
		);

		const ratios = selected.map((item) => {
			const style = getComputedStyle(item);
			return contrastRatio(rgb(resolveColor(style.color)), rgb(resolveColor(style.backgroundColor)));
		});
		const lowest = Math.min(...ratios);
		check(`ToggleGroup ${id}: текст выбранного сегмента читаем (4.5:1)`, lowest >= 4.5, `наименьший контраст ${lowest.toFixed(2)}:1`);

		const selectedStyle = getComputedStyle(firstSelected);
		const plainStyle = getComputedStyle(firstPlain);
		const trackFill = resolveColor(getComputedStyle(group).backgroundColor);
		const fillRatio = contrastRatio(rgb(resolveColor(selectedStyle.backgroundColor)), rgb(trackFill));
		check(
			`ToggleGroup ${id}: выбранный сегмент отличается от невыбранного заливкой и цветом текста`,
			selectedStyle.backgroundColor !== plainStyle.backgroundColor && selectedStyle.color !== plainStyle.color,
			`заливка к оболочке ${fillRatio.toFixed(2)}:1, текст ${selectedStyle.color} и ${plainStyle.color}`
		);

		const selectedHeight = firstSelected.getBoundingClientRect().height;
		const plainHeight = firstPlain.getBoundingClientRect().height;
		check(
			`ToggleGroup ${id}: выбор не меняет высоту сегмента`,
			Math.abs(selectedHeight - plainHeight) <= 0.01,
			`выбранный ${selectedHeight}px, невыбранный ${plainHeight}px`
		);
	}
	return results;
}
```

(`fillRatio` только информирует: порог 3:1 для заливки здесь сознательно не проверяется, это вопрос 4 раздела 7 спека; число идёт в detail для владельца.)

- [ ] **Step 4: Подключить на страницу**

В `playground/src/controls-row-page.tsx`:
1. импорты: `import { ToggleGroup } from '@stark/solid-kit/toggle-group';`, `import { DemoToggleGroups } from './demo-toggle-groups';`, `import { runToggleGroupChecks } from './toggle-group-checks';` (по порядку импортов проекта; `eslint --fix` поправит);
2. в `renderFocusControls()` в конец массива добавить:

```tsx
		<ToggleGroup.Root aria-label='Переключатели' mode='multi' defaultValue={['one']}>
			<ToggleGroup.Item value='one' data-focus-name='toggle-selected'>Один</ToggleGroup.Item>
			<ToggleGroup.Item value='two' data-focus-name='toggle-plain'>Два</ToggleGroup.Item>
		</ToggleGroup.Root>
```

3. в `runChecks` добавить `...runToggleGroupChecks(page)` после `...runFieldChecks(page)`;
4. после раздела Field добавить раздел:

```tsx
			<section>
				<h2>ToggleGroup: щелчок меняет значение, выбранный сегмент отличается заливкой и цветом текста</h2>
				<DemoToggleGroups/>
			</section>
```

- [ ] **Step 5: Статическая проверка**

Run: `pnpm exec eslint --fix playground/src && pnpm exec stylelint --fix "playground/src/**/*.css" && pnpm check`
Expected: зелёный, тесты как в конце Task 2.

- [ ] **Step 6: Проверка в браузере (Chrome)**

`pnpm dev` в фоне (порт из вывода Vite, PID сохранить), открыть `<адрес>/#controls-row`, кликнуть по странице, нажать «Запустить проверки» (координаты кнопки [885,58]), проверить темы system, light, dark (после смены темы ждать 700 мс; в system вернуться через другую тему).

Expected в каждой теме:
- в каждом из пяти рядов группа ToggleGroup стоит на одной линии с остальными контролами, верх и низ оболочки совпадают с соседями; «Неделя» выделена;
- ряд помещается на страницу: проверить `document.documentElement.scrollWidth <= window.innerWidth`; если ряды вышли за ширину страницы, поднять `max-inline-size` у `.page` в `playground.css` (например, до 1600px) и записать это в итоги;
- **проверки все OK**, число должно стать 214 (было 184: +5 высот оболочки, +5 проверок сегментов, +12 колец у двух сегментов группы в двух блоках фокуса, +8 проверок двух живых примеров). Если число или результат другие, выяснить причину до коммита;
- контраст текста выбранного сегмента не ниже 4,5:1, кольцо фокуса на выбранном сегменте не ниже 3:1 к его заливке (проверки `…/toggle-selected: кольцо контрастно к фону`); значение «заливка к оболочке» из detail записать в итоги;
- реальным щелчком мыши: в примере single щелчок по «Месяц» переносит выделение, текст `single: month`, повторный щелчок по «Месяц» ничего не меняет; в примере multi щелчок по «Неделя» добавляет её, текст `multi: day, month, week` (по порядку включения), щелчок по «День» убирает его;
- реальным Tab: фокус проходит по каждому сегменту по очереди, кольцо внутри сегмента, на выбранном сегменте видно; Space и Enter переключают выбор в multi;
- глазами (владелец смотрит сам): виден ли выбранный сегмент на оболочке в светлой и тёмной темах, читается ли цвет текста; консоль без ошибок и без dev-предупреждений `[solid-kit]`.

Остановить dev-сервер по PID (после проверки cwd).

- [ ] **Step 7: Закоммитить**

```bash
git add playground
git commit -m "feat(playground): ToggleGroup в рядах, живые примеры и проверки выбранного сегмента" -m "$TRAILERS"
```

---

### Task 4: ToggleGroup в матрице формы пакета

**Files:**
- Modify: `scripts/consumer/src/main.tsx`
- Modify: `scripts/verify-package-form.sh`

**Interfaces:**
- Consumes: путь `@stark/solid-kit/toggle-group`; токен `--s-kit-toggle-group-selected-bg` как маркер стилей в собранном CSS.
- Produces: один новый пункт матрицы: стили ToggleGroup в CSS (порядок с Button и ButtonGroup не проверяется: специфичность правил выше). Compound-фасад `ToggleGroup.Root`/`ToggleGroup.Item` проходит `tsc` потребителя на TypeScript 5.9.3 и 7.0.2.

- [ ] **Step 1: Потребитель импортирует ToggleGroup**

В `scripts/consumer/src/main.tsx` добавить `import { ToggleGroup } from '@stark/solid-kit/toggle-group';` (по порядку, после `probe`) и рядом с остальными элементами:

```tsx
			<ToggleGroup.Root aria-label="Вид" defaultValue="list">
				<ToggleGroup.Item value="list">Список</ToggleGroup.Item>
				<ToggleGroup.Item value="grid">Сетка</ToggleGroup.Item>
			</ToggleGroup.Root>
			<ToggleGroup.Root aria-label="Дни" mode="multi" defaultValue={['mon']}>
				<ToggleGroup.Item value="mon">Пн</ToggleGroup.Item>
				<ToggleGroup.Item value="tue">Вт</ToggleGroup.Item>
			</ToggleGroup.Root>
```

(второй пример проверяет, что объединение пропсов по `mode` принимается `tsc` потребителя.)

- [ ] **Step 2: Проверка сборки**

В `scripts/verify-package-form.sh` после пункта про ButtonGroup добавить:

```bash
grep -lq -- '--s-kit-toggle-group-selected-bg' dist/assets/*.css && ok "ToggleGroup styles are in the built CSS" || fail "ToggleGroup styles are missing from the built CSS"
```

- [ ] **Step 3: Коммит и прогон матрицы**

Матрица ставит пакет по коммиту, поэтому сначала закоммитить:

```bash
git add scripts
git commit -m "test: ToggleGroup в матрице формы пакета" -m "$TRAILERS"
scripts/verify-package-form.sh "$(git rev-parse HEAD)"
```

Expected: все пункты OK, включая новый; `tsc` потребителя проходит на TypeScript 5.9.3 и 7.0.2. Если `tsc` на 7.0.2 не принимает объединение пропсов, исправить типы в `toggle-group-root.tsx` без изменения API из спека, закоммитить правку отдельным коммитом и прогнать матрицу заново.

- [ ] **Step 4: Удалить временный проект-потребитель**

Скрипт печатает `consumer project kept at: ...`; проверить, что каталог лежит вне репозитория, и удалить его (`git status` чистый).

---

### Task 5: Закрытие плана в спеке

**Files:**
- Modify: `docs/superpowers/specs/2026-10-29-stage-1-simple-controls-design.md`

- [ ] **Step 1: Таблица порядка и итоги**

В таблице порядка (раздел 1) у строки ToggleGroup добавить **Готов** и коммиты (`git log --oneline -6`), с точкой в конце ячейки, как у соседних строк. Добавить раздел «13. Итоги ToggleGroup (2026-10-29)» по образцу разделов 8–12: число проверок страницы (из Task 3 Step 6), измеренный контраст текста выбранного сегмента и заливки к оболочке в обеих темах, кольцо на выбранном сегменте, результаты реальных щелчков и Tab, что матрица зелёная на обоих TypeScript, и список непроверенного: Firefox 125, Safari 17.5, hover и active мышью, `forced-colors`, экранный диктор (`aria-pressed` проверен только разметкой), стрелки и roving tabindex не реализованы (ограничение), группа из пяти сегментов и перенос при нехватке места. Если по ходу принималось решение, отличающееся от раздела 3.5, исправить раздел 3.5 тем же коммитом. Вопрос 4 раздела 7 закрыть решением владельца после его просмотра страницы (если владелец ещё не смотрел, оставить открытым и написать об этом в итогах).

- [ ] **Step 2: Итоговая проверка и коммит**

Run: `pnpm check` и `git status` (чисто). Затем:

```bash
git add docs
git commit -m "docs: ToggleGroup готов" -m "$TRAILERS"
```

Тег не ставится. Следующий компонент по порядку: Checkbox.

---

## Самопроверка плана

- **Покрытие спека (раздел 3.5):** compound без фасада и контекст с понятной ошибкой (Task 1 и 2), режимы single и multi с контрактом `null`/`[]` и без снятия выбора в single (Task 1 функции, Task 2 тесты), `aria-pressed` и `data-selected` (Task 2), `disabled` корня и сегмента (Task 2), `size` только у группы (Task 2), вид выбранного сегмента с токенами и повышенной специфичностью (Task 2 CSS, измерение в Task 3), геометрия и кольцо от ButtonGroup (Task 3 проверки рядов и фокуса), матрица (Task 4), закрытие (Task 5).
- **Типы:** `ToggleGroupMode` определён в Task 1 и используется в Task 2; `ToggleGroupContextValue` из Task 1 используется в `toggle-group-root.tsx`; `data-toggle-demo` ставится в `demo-toggle-groups.tsx` и читается в `toggle-group-checks.ts` как `dataset['toggleDemo']`; `data-focus-name` читается кодом `button-checks.ts` как `dataset['focusName']`, имена `toggle-selected` и `toggle-plain` уникальны в блоке; число проверок 214 выведено расчётом (5 + 5 + 12 + 8).
- **Известные риски:** сужение объединения `ToggleGroupRootProps` по `props.mode` и приём его `tsc` на TypeScript 7.0.2 (Task 2 Step 7, Task 4 Step 3); `no-descending-specificity` в stylelint (Task 2 Step 5); ряды ширины 1100px могут не вместить ещё одну группу (Task 3 Step 6); ошибка в `Item` вне `Root` бросается при рендере, и `render` из testing-library пробрасывает её синхронно (если нет, изменить тест на проверку через `createRoot`); `fireEvent.click` по `disabled`-кнопке: Solid не вызывает делегированный обработчик для `node.disabled`, тест это подтверждает.
- **Не покрыто сознательно:** стрелки и roving tabindex, `deselectable`, вертикальная ориентация, иконочные сегменты, быстрая форма `<ToggleGroup items>`, вид выбранного сегмента «белая подложка» (вопрос 4).
