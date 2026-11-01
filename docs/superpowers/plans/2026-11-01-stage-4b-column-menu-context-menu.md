# Меню колонки: дополнения ContextMenu — план реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Дополнить ContextMenu: пункт-переключатель `ContextMenu.CheckboxItem`, группа с подписью `ContextMenu.Group`, открытие от элемента-якоря (`Root.anchorElement`) и проп `Content.placement`.

**Architecture:** `MenuItemElement` получает `role` и слот `leading`; `menu-items.ts` учитывает обе роли. Якорь-элемент приходит через контекст Root и имеет приоритет над точкой; клик по якорю не считается кликом снаружи (`dismissExempt`), фокус при закрытии возвращается на якорь, если прежний владелец фокуса ушёл. Поведение точки клика и меню строки не меняется.

**Tech Stack:** Solid 1.9, @floating-ui/dom (через `FloatingPanel`), vitest + @solidjs/testing-library (jsdom).

**Spec:** `docs/superpowers/specs/2026-11-01-stage-4b-column-menu-design.md` (разделы 2.3, 4).

## Global Constraints

- Один компонент на файл, kebab-case; тесты рядом.
- ESLint: табы, одинарные кавычки, длина строки до 140, без висящих комментариев в конце строки, `simple-import-sort`, `jsx-first-prop-new-line` / `jsx-max-props-per-line`.
- CSS: нативная вложенность с явным `&`, собственные декларации перед вложенными правилами, только токены (без литеральных цветов), порядок свойств чинится `pnpm exec stylelint --fix "src/**/*.css" "playground/src/**/*.css"`.
- Русские комментарии только про неочевидное «почему». Без jsdom-проверок в боевом коде.
- Команды pnpm: `env -u HTTPS_PROXY -u HTTP_PROXY -u https_proxy -u http_proxy pnpm …`; код возврата `pnpm check` проверять отдельно.
- Коммит с трейлерами:

```bash
T=$'Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_017cEinKKFDiYmGrLaaKPqZu'
git commit -m "сообщение" -m "$T"
```

- Не пушить и не ставить теги без слова владельца.

---

### Task 1: роль и слот пункта, поиск пунктов по обеим ролям

**Files:**
- Modify: `src/components/context-menu/menu-item-element.tsx`
- Modify: `src/components/context-menu/menu-items.ts`
- Modify: `src/components/context-menu/context-menu-item.tsx` (`Omit` расширяется на `role`, `leading`)
- Modify: `src/components/context-menu/context-menu-sub-trigger.tsx` (то же, если он наследует `MenuItemElementProps`)
- Test: `src/components/context-menu/menu-items.test.ts`

**Interfaces:**
- Produces: `MenuItemElementProps.role?: 'menuitem' | 'menuitemcheckbox'`, `MenuItemElementProps.leading?: JSX.Element`; `menuItems(panel)`, `itemOf(panel, target)` находят пункты обеих ролей.

- [ ] **Step 1: Write the failing test**

В `menu-items.test.ts` (сначала прочитать файл и повторить его стиль вызова) добавить в `describe('menuItems')` и `describe('itemOf')` случаи:

```ts
it('находит и пункты-переключатели', () => {
	const panel = document.createElement('div');
	panel.setAttribute('role', 'menu');
	panel.innerHTML = '<div role="menuitem" id="a"></div><div role="group"><div role="menuitemcheckbox" id="b"></div></div>';
	expect(menuItems(panel).map((item) => item.id)).toEqual(['a', 'b']);
});

it('itemOf возвращает переключатель по цели внутри него', () => {
	const panel = document.createElement('div');
	panel.setAttribute('role', 'menu');
	panel.innerHTML = '<div role="menuitemcheckbox" id="c"><span id="inner"></span></div>';
	expect(itemOf(panel, panel.querySelector('#inner'))?.id).toBe('c');
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `env -u HTTPS_PROXY -u HTTP_PROXY -u https_proxy -u http_proxy pnpm exec vitest run src/components/context-menu/menu-items.test.ts`
Expected: FAIL (переключатели не находятся).

- [ ] **Step 3: Implement**

`menu-items.ts`, первая строка:

```ts
const ITEM = '[role="menuitem"], [role="menuitemcheckbox"]';
```

`menu-item-element.tsx`:

```tsx
type OwnedAttribute = 'class' | 'style' | 'ref' | 'onClick' | 'onPointerMove' | 'onFocus' | 'children';

export interface MenuItemElementProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, OwnedAttribute | 'role'> {
	/** `menuitemcheckbox` у переключателей; по умолчанию `menuitem`. */
	role?: 'menuitem' | 'menuitemcheckbox' | undefined;
	variant?: 'default' | 'danger' | undefined;
	// ...остальные поля без изменений...
	/** Содержимое перед подписью (отметка переключателя). */
	leading?: JSX.Element;
	/** Содержимое после подписи, не обрезаемое многоточием (стрелка подменю). */
	trailing?: JSX.Element;
```

В `splitProps` добавить `'role'` и `'leading'`; в разметке заменить `role='menuitem'` на `role={local.role ?? 'menuitem'}` и перед `<span data-s-kit-menu-label …>` вставить `{local.leading}`.

`context-menu-item.tsx`: `Omit<MenuItemElementProps, 'rootRef' | 'trailing' | 'role' | 'leading'>`. Аналогично в `context-menu-sub-trigger.tsx`, если там `Omit<MenuItemElementProps, …>`; иначе оставить.

- [ ] **Step 4: Run to verify it passes**

Run: `env -u HTTPS_PROXY -u HTTP_PROXY -u https_proxy -u http_proxy pnpm exec vitest run src/components/context-menu`
Expected: PASS (все старые тесты ContextMenu тоже).

- [ ] **Step 5: Commit**

```bash
git add src/components/context-menu
# коммит: feat(context-menu): роль и слот пункта, поиск пунктов-переключателей
```

---

### Task 2: CheckboxItem и Group

**Files:**
- Create: `src/components/context-menu/context-menu-checkbox-item.tsx`
- Create: `src/components/context-menu/context-menu-group.tsx`
- Modify: `src/components/context-menu/context-menu.module.css`
- Modify: `src/components/context-menu/index.ts`
- Test: `src/components/context-menu/context-menu-checkbox-item.test.tsx`

**Interfaces:**
- Consumes: `MenuItemElement` (`role`, `leading`), `useMenuLevelContext`.
- Produces: `ContextMenu.CheckboxItem` (`checked: boolean`, `onCheckedChange?: (checked: boolean) => void`, `closeOnSelect?: boolean` по умолчанию `false`, `disabled`, `variant`, `class`, `style`), `ContextMenu.Group` (`label: string`, `class`, `style`, `children`); экспорт типов `ContextMenuCheckboxItemProps`, `ContextMenuGroupProps`.

- [ ] **Step 1: Write the failing test**

`src/components/context-menu/context-menu-checkbox-item.test.tsx`:

```tsx
import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library';
import { createSignal } from 'solid-js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ContextMenu } from './index';

beforeEach(() => {
	// jsdom не реализует Popover API и считает содержимое закрытого [popover] нефокусируемым: «показ» снимает атрибут
	HTMLElement.prototype.showPopover = vi.fn(function (this: HTMLElement) {
		this.removeAttribute('popover');
	});
	HTMLElement.prototype.hidePopover = vi.fn();
});

afterEach(cleanup);

function Harness(props: { onOpenChange?: (open: boolean) => void; closeOnSelect?: boolean; disabled?: boolean }) {
	const [checked, setChecked] = createSignal(false);
	return (
		<ContextMenu.Root open anchorPoint={{ x: 10, y: 20 }} onOpenChange={props.onOpenChange}>
			<ContextMenu.Content aria-label='Меню'>
				<ContextMenu.Item>Обычный</ContextMenu.Item>
				<ContextMenu.Group label='Колонки'>
					<ContextMenu.CheckboxItem
						checked={checked()}
						onCheckedChange={setChecked}
						closeOnSelect={props.closeOnSelect}
						disabled={props.disabled}
					>Первая</ContextMenu.CheckboxItem>
					<ContextMenu.CheckboxItem checked>Вторая</ContextMenu.CheckboxItem>
				</ContextMenu.Group>
			</ContextMenu.Content>
		</ContextMenu.Root>
	);
}

describe('ContextMenu.CheckboxItem', () => {
	it('имеет роль menuitemcheckbox и aria-checked по checked', () => {
		render(() => <Harness/>);
		expect(screen.getByRole('menuitemcheckbox', { name: 'Первая' }).getAttribute('aria-checked')).toBe('false');
		expect(screen.getByRole('menuitemcheckbox', { name: 'Вторая' }).getAttribute('aria-checked')).toBe('true');
	});

	it('клик сообщает противоположное значение и по умолчанию не закрывает меню', () => {
		const onOpenChange = vi.fn();
		render(() => <Harness onOpenChange={onOpenChange}/>);
		const item = screen.getByRole('menuitemcheckbox', { name: 'Первая' });
		fireEvent.click(item);
		expect(item.getAttribute('aria-checked')).toBe('true');
		fireEvent.click(item);
		expect(item.getAttribute('aria-checked')).toBe('false');
		expect(onOpenChange).not.toHaveBeenCalled();
	});

	it('closeOnSelect закрывает меню', () => {
		const onOpenChange = vi.fn();
		render(() => <Harness onOpenChange={onOpenChange} closeOnSelect/>);
		fireEvent.click(screen.getByRole('menuitemcheckbox', { name: 'Первая' }));
		expect(onOpenChange).toHaveBeenCalledWith(false);
	});

	it('отключённый переключатель помечен aria-disabled и не реагирует', () => {
		render(() => <Harness disabled/>);
		const item = screen.getByRole('menuitemcheckbox', { name: 'Первая' });
		expect(item.getAttribute('aria-disabled')).toBe('true');
		fireEvent.click(item);
		expect(item.getAttribute('aria-checked')).toBe('false');
	});

	it('Enter и Space переключают, меню остаётся открытым', () => {
		const onOpenChange = vi.fn();
		render(() => <Harness onOpenChange={onOpenChange}/>);
		const item = screen.getByRole('menuitemcheckbox', { name: 'Первая' });
		item.focus();
		fireEvent.keyDown(item, { key: 'Enter' });
		expect(item.getAttribute('aria-checked')).toBe('true');
		fireEvent.keyDown(item, { key: ' ' });
		expect(item.getAttribute('aria-checked')).toBe('false');
		expect(onOpenChange).not.toHaveBeenCalled();
	});

	it('стрелки ходят между обычным пунктом и переключателями внутри группы', () => {
		render(() => <Harness/>);
		const first = screen.getByRole('menuitem', { name: 'Обычный' });
		first.focus();
		fireEvent.keyDown(first, { key: 'ArrowDown' });
		expect(document.activeElement).toBe(screen.getByRole('menuitemcheckbox', { name: 'Первая' }));
		fireEvent.keyDown(document.activeElement ?? first, { key: 'End' });
		expect(document.activeElement).toBe(screen.getByRole('menuitemcheckbox', { name: 'Вторая' }));
	});
});

describe('ContextMenu.Group', () => {
	it('это role=group с именем из подписи', () => {
		render(() => <Harness/>);
		expect(screen.getByRole('group', { name: 'Колонки' })).toBeTruthy();
	});
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `env -u HTTPS_PROXY -u HTTP_PROXY -u https_proxy -u http_proxy pnpm exec vitest run src/components/context-menu/context-menu-checkbox-item.test.tsx`
Expected: FAIL (`ContextMenu.CheckboxItem` не определён).

- [ ] **Step 3: Implement**

`context-menu-checkbox-item.tsx`:

```tsx
import styles from './context-menu.module.css';

import { type JSX, splitProps } from 'solid-js';

import { MenuItemElement, type MenuItemElementProps } from './menu-item-element';
import { useMenuLevelContext } from './menu-level-context';

export interface ContextMenuCheckboxItemProps extends Omit<MenuItemElementProps, 'rootRef' | 'trailing' | 'leading' | 'role'> {
	checked: boolean;
	onCheckedChange?: ((checked: boolean) => void) | undefined;
	/** По умолчанию `false`: переключатель оставляет меню открытым. */
	closeOnSelect?: boolean | undefined;
}

/** Пункт-переключатель: отметка слева, `role="menuitemcheckbox"`. Состояние хранит вызывающий (controlled). */
export function ContextMenuCheckboxItem(props: ContextMenuCheckboxItemProps): JSX.Element {
	const level = useMenuLevelContext('ContextMenu.CheckboxItem');
	const [local, rest] = splitProps(props, ['checked', 'onCheckedChange', 'closeOnSelect', 'onClick']);

	return (
		<MenuItemElement
			{...rest}
			role='menuitemcheckbox'
			aria-checked={local.checked}
			leading={
				<svg class={styles['check']} data-checked={local.checked ? '' : undefined} viewBox='0 0 16 16' aria-hidden='true'>
					<path d='M3.5 8.5l3 3 6-7' fill='none' stroke='currentColor' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'/>
				</svg>
			}
			onClick={(event) => {
				local.onClick?.(event);
				if (event.defaultPrevented) {
					return;
				}
				const next = !local.checked;
				// меню закрывается раньше команды, как у ContextMenu.Item
				if (local.closeOnSelect === true) {
					level.closeAll();
				}
				local.onCheckedChange?.(next);
			}}
		/>
	);
}
```

`context-menu-group.tsx`:

```tsx
import styles from './context-menu.module.css';

import { createUniqueId, type JSX, splitProps } from 'solid-js';

export interface ContextMenuGroupProps
	extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'class' | 'style' | 'role' | 'aria-labelledby' | 'aria-label'> {
	/** Видимая подпись группы; она же даёт группе accessible name. */
	label: string;
	class?: string | undefined;
	style?: JSX.CSSProperties | undefined;
}

/** Группа пунктов с подписью. Сама в навигации стрелками не участвует: фокус ходит по пунктам внутри. */
export function ContextMenuGroup(props: ContextMenuGroupProps): JSX.Element {
	const [local, rest] = splitProps(props, ['label', 'class', 'style', 'children']);
	const labelId = createUniqueId();

	return (
		<div {...rest} role='group' aria-labelledby={labelId} class={local.class} style={local.style}>
			<div id={labelId} class={styles['group-label']}>{local.label}</div>
			{local.children}
		</div>
	);
}
```

`context-menu.module.css` (дописать после `.chevron`, затем `stylelint --fix`):

```css
/* отметка переключателя: место под неё занято всегда, чтобы подписи не прыгали */
.check {
    visibility: hidden;
    flex: none;
    inline-size: 14px;
    block-size: 14px;

    &[data-checked] {
        visibility: visible;
    }
}

.group-label {
    padding-block: 6px 2px;
    padding-inline: 10px;

    font-size: 0.85em;
    font-weight: 600;
    color: var(--s-kit-color-muted);
}
```

`index.ts`: импорты `ContextMenuCheckboxItem`, `ContextMenuGroup` (по алфавиту, `simple-import-sort`), `export type { ContextMenuCheckboxItemProps }`, `export type { ContextMenuGroupProps }`, в объект `ContextMenu` добавить `CheckboxItem: ContextMenuCheckboxItem` и `Group: ContextMenuGroup`.

- [ ] **Step 4: Run to verify it passes**

Run: `env -u HTTPS_PROXY -u HTTP_PROXY -u https_proxy -u http_proxy pnpm exec stylelint --fix "src/**/*.css"; env -u HTTPS_PROXY -u HTTP_PROXY -u https_proxy -u http_proxy pnpm exec vitest run src/components/context-menu`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/context-menu
# коммит: feat(context-menu): пункт-переключатель CheckboxItem и группа Group
```

---

### Task 3: anchorElement у Root и placement у Content

**Files:**
- Modify: `src/components/context-menu/context-menu-context.ts` (поле `anchorElement`)
- Modify: `src/components/context-menu/context-menu-root.tsx` (проп `anchorElement`)
- Modify: `src/components/context-menu/context-menu-content.tsx` (якорь-элемент, `dismissExempt`, `restoreFocusTo`, `placement`)
- Test: `src/components/context-menu/context-menu-anchor-element.test.tsx`

**Interfaces:**
- Produces: `ContextMenu.Root` проп `anchorElement?: HTMLElement | undefined` (приоритет над точкой, клик по нему не закрывает меню, фокус возвращается на него, если прежний владелец фокуса ушёл); `ContextMenu.Content` проп `placement?: Placement | undefined` (по умолчанию `'bottom-start'`).

- [ ] **Step 1: Write the failing test**

`src/components/context-menu/context-menu-anchor-element.test.tsx`:

```tsx
import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library';
import { createSignal, type JSX } from 'solid-js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ContextMenu } from './index';

beforeEach(() => {
	// jsdom не реализует Popover API и считает содержимое закрытого [popover] нефокусируемым: «показ» снимает атрибут
	HTMLElement.prototype.showPopover = vi.fn(function (this: HTMLElement) {
		this.removeAttribute('popover');
	});
	HTMLElement.prototype.hidePopover = vi.fn();
});

afterEach(cleanup);

function Harness(props: { initiallyOpen?: boolean; onOpenChange?: (open: boolean) => void; children?: JSX.Element }) {
	const [anchor, setAnchor] = createSignal<HTMLElement>();
	const [open, setOpen] = createSignal(props.initiallyOpen ?? true);
	return (
		<>
			<button type='button' data-testid='anchor' ref={setAnchor}>якорь</button>
			<button type='button' data-testid='outside'>снаружи</button>
			<button type='button' data-testid='toggle' onClick={() => setOpen(!open())}>переключить</button>
			<ContextMenu.Root
				open={open()}
				onOpenChange={(next) => {
					setOpen(next);
					props.onOpenChange?.(next);
				}}
				anchorElement={anchor()}
			>
				<ContextMenu.Content aria-label='Меню' placement='bottom-end'>
					<ContextMenu.Item>Один</ContextMenu.Item>
				</ContextMenu.Content>
			</ContextMenu.Root>
		</>
	);
}

describe('ContextMenu: anchorElement', () => {
	it('открывается от элемента без точки', () => {
		render(() => <Harness/>);
		expect(screen.getByRole('menu', { name: 'Меню' })).toBeTruthy();
	});

	it('без якоря и без точки меню не показывается', () => {
		render(() => (
			<ContextMenu.Root open>
				<ContextMenu.Content aria-label='Меню'>
					<ContextMenu.Item>Один</ContextMenu.Item>
				</ContextMenu.Content>
			</ContextMenu.Root>
		));
		expect(screen.queryByRole('menu')).toBeNull();
	});

	it('pointerdown по якорю не закрывает меню, снаружи закрывает', () => {
		const onOpenChange = vi.fn();
		render(() => <Harness onOpenChange={onOpenChange}/>);
		fireEvent.pointerDown(screen.getByTestId('anchor'));
		expect(onOpenChange).not.toHaveBeenCalled();
		fireEvent.pointerDown(screen.getByTestId('outside'));
		expect(onOpenChange).toHaveBeenCalledWith(false);
	});

	it('Esc закрывает меню', () => {
		const onOpenChange = vi.fn();
		render(() => <Harness onOpenChange={onOpenChange}/>);
		fireEvent.keyDown(document.body, { key: 'Escape' });
		expect(onOpenChange).toHaveBeenCalledWith(false);
	});

	it('после закрытия фокус возвращается на якорь, если прежнего владельца фокуса не было', () => {
		render(() => <Harness initiallyOpen={false}/>);
		fireEvent.click(screen.getByTestId('toggle'));
		expect(screen.getByRole('menu')).toBeTruthy();
		fireEvent.click(screen.getByTestId('toggle'));
		expect(screen.queryByRole('menu')).toBeNull();
		expect(document.activeElement).toBe(screen.getByTestId('anchor'));
	});
});
```

В последнем тесте кнопка `toggle` в jsdom не получает фокус от `fireEvent.click`, поэтому прежнего владельца фокуса нет (`document.body`), и фокус должен прийти на якорь.

- [ ] **Step 2: Run to verify it fails**

Run: `env -u HTTPS_PROXY -u HTTP_PROXY -u https_proxy -u http_proxy pnpm exec vitest run src/components/context-menu/context-menu-anchor-element.test.tsx`
Expected: FAIL (меню не показывается без точки; фокус не на якоре).

- [ ] **Step 3: Implement**

`context-menu-context.ts`: в `ContextMenuContextValue` добавить

```ts
	/** Элемент-якорь (кнопка меню колонки): приоритетнее точки, клик по нему не считается кликом снаружи. */
	anchorElement: Accessor<HTMLElement | undefined>;
```

`context-menu-root.tsx`: в `ContextMenuRootProps`

```ts
	/** Якорь-элемент: меню позиционируется по его прямоугольнику, `ContextMenu.Trigger` и точка не нужны. */
	anchorElement?: HTMLElement | undefined;
```

и в `context`: `anchorElement: () => props.anchorElement,`.

`context-menu-content.tsx`:

```tsx
import type { Placement } from '@floating-ui/dom';
import { createMemo, type JSX, splitProps } from 'solid-js';

import type { AnchorElement } from '../../utils/create-anchored-position';
// ...остальные импорты как были...

export interface ContextMenuContentProps extends MenuPanelAttributes {
	size?: 'sm' | 'md' | 'lg' | undefined;
	/** Сторона и выравнивание относительно якоря; по умолчанию `bottom-start`. */
	placement?: Placement | undefined;
	// ...
}

const [local, rest] = splitProps(props, ['size', 'placement', 'onKeyDown', 'ref', 'class', 'style', 'children']);
const anchor = createMemo<AnchorElement | undefined>(() => {
	const element = context.anchorElement();
	if (element) {
		return element;
	}
	const point = context.point();
	return point ? pointAnchor(point) : undefined;
});
```

В `<MenuPanel>`:

```tsx
restoreFocusTo={() => {
	// инициатора или строки грида могло не стать в документе: тогда фокус получает якорь, а если и его нет, область вызова
	const opener = context.opener();
	if (opener?.isConnected === true) {
		return opener;
	}
	const anchored = context.anchorElement();
	return anchored?.isConnected === true ? anchored : context.area();
}}
// клик по якорю-элементу не снаружи: переключением занимается его обработчик; область вызова не часть меню (раздел 3.3 спека)
dismissExempt={context.anchorElement}
placement={local.placement ?? 'bottom-start'}
```

(прежний комментарий про область вызова заменить этим.)

- [ ] **Step 4: Run to verify it passes**

Run: `env -u HTTPS_PROXY -u HTTP_PROXY -u https_proxy -u http_proxy pnpm exec vitest run src/components/context-menu`
Expected: PASS, включая старые тесты ContextMenu и меню строки грида.

- [ ] **Step 5: Check and commit**

Run: `env -u HTTPS_PROXY -u HTTP_PROXY -u https_proxy -u http_proxy pnpm check; echo "exit=$?"` — ожидается `exit=0`.

```bash
git add src/components/context-menu
# коммит: feat(context-menu): открытие от элемента-якоря и placement
```
