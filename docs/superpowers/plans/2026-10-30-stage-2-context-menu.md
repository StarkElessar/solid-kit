# solid-kit, этап 2, часть 3: ContextMenu — план реализации

> **Для исполнителей:** ОБЯЗАТЕЛЬНЫЙ суб-скил: superpowers:executing-plans (или subagent-driven-development). Шаги отмечены чекбоксами (`- [ ]`).

**Цель:** публичный compound-компонент `ContextMenu` (`Root` / `Trigger` / `Content` / `Item` / `Separator` / `Sub` / `SubTrigger` / `SubContent`): меню в точке клика правой кнопкой (или у сфокусированного элемента по клавише ContextMenu и Shift+F10, или в точке `anchorPoint`, заданной снаружи), навигация стрелками с DOM-фокусом на пунктах, подменю любой глубины, закрытие по Esc, клику снаружи, активации пункта, Tab, прокрутке и изменению размера окна. В playground на страницу «Панели» добавляются демонстрации и проверки меню.

**Архитектура:** меню это `FloatingPanel` (часть 1) с виртуальным якорем-точкой. Общая оболочка уровня меню `MenuPanel` (корень и каждое подменю) задаёт `role="menu"`, `data-s-kit-focus-inset`, клавиатуру (стрелки, Home, End, Enter, Space, Tab) и контекст уровня (`closeAll`, активный пункт). Пункты (`Item`, `SubTrigger`) строятся на одном внутреннем элементе `MenuItemElement`. Подменю это вложенный слой стека: его `FloatingPanel` якорится на `SubTrigger`. Навигация считается чистой функцией `nextMenuItemIndex` по массиву флагов «недоступен». Две небольшие доработки основы: `FloatingPanel.initialFocus` принимает функцию, `FloatingPanel.restoreFocusTo` задаёт получателя фокуса при закрытии.

**Стек:** как в частях 1 и 2 (Solid 1.9.17, Vite 8, Vitest 5, jsdom 30, Floating UI).

**Спеки:** `docs/superpowers/specs/2026-10-29-stage-2-overlays-design.md` (основной; разделы 3, 6, 8, 10, 12, 13), `docs/superpowers/specs/2026-10-28-solid-kit-umbrella-design.md` (разделы 5.1, 8, 11, 11.1). Опирается на части 1 и 2: `FloatingPanel`, стек слоёв, `PanelHostContext`, `Popover`, `Dialog`, страницу «Панели».

## Global Constraints

- Репозиторий публичный: ни ключей, ни токенов, ни `.env*` в коммитах. Не делать `git push`, не ставить теги (тег `v0.3.0` после части 4), не добавлять `LICENSE`, не менять git-идентичность, не переписывать историю (никаких `--amend`/`rebase`).
- Один класс — один файл; kebab-case; именованные экспорты; пропсы не деструктурируются (`splitProps`/`mergeProps`). Один компонент на файл. Интерфейсы контекста и состояния в отдельных файлах. Чистые функции отдельными `.ts`.
- `exactOptionalPropertyTypes: true`: необязательные свойства в публичных пропсах пишутся `foo?: T | undefined`.
- Ошибки контекста: `${part} must be used inside ContextMenu.Root` (Trigger, Content), `… inside ContextMenu.Content` (Item, Sub, Separator не требует контекста), `… inside ContextMenu.Sub` (SubTrigger, SubContent).
- В CSS компонентов: только токены, без литералов цветов, без `outline: none/0`, без голого `var(--s-kit-control-height)` (всегда с фолбэком); `composes ... from "...";` с двойными кавычками.
- Стиль: ESLint (табы, одинарные кавычки, без висячих запятых, Stroustrup, max-len 140 с табами по 4, `solid/reactivity` как ошибка: свойства `props.*` читать только в JSX, `createEffect` или обработчиках; передаваемые в хуки аксессоры оборачивать в стрелки), Stylelint (4 пробела, двойные кавычки, порядок свойств; `pnpm exec stylelint --fix <файл>`). Перед каждым коммитом `pnpm check` зелёный.
- Если `pnpm` зависает на прокси, запускать так: `env -u HTTPS_PROXY -u HTTP_PROXY -u https_proxy -u http_proxy pnpm ...`.
- Коммиты оканчиваются трейлерами: `export TRAILERS=$'Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_017cEinKKFDiYmGrLaaKPqZu'`, затем `git commit -m "msg" -m "$TRAILERS"`.
- Dev-серверы убивать только по PID после проверки cwd (`lsof -a -p <PID> -d cwd -Fn`), никогда `pkill`.
- Браузерные проверки в Chrome (как в частях 1 и 2): Esc и клавиши настоящие (`computer key`), синтетические события не заменяют их; после смены темы ждать 1,5–2 с; Firefox и Safari не проверяются.
- Тесты, которым нужен Popover API, подменяют его в `beforeEach` (`showPopover` снимает атрибут `popover`, иначе jsdom считает содержимое нефокусируемым).
- Начало плана: `git status` чистый, `pnpm check` зелёный (записать число тестов: после части 2 их 373).

---

### Task 1: Доработки `FloatingPanel` для меню

**Files:**
- Modify: `src/internal/floating-panel/focus-initial.ts`, `src/internal/floating-panel/create-focus-on-open.ts`, `src/internal/floating-panel/floating-panel.tsx`
- Create: `src/internal/floating-panel/floating-panel-focus.test.tsx`

**Interfaces:**
- Produces: `type InitialFocusMode = InitialFocus | ((panel: HTMLElement) => void)`; `FloatingPanelProps.initialFocus?: InitialFocusMode | undefined`; `FloatingPanelProps.restoreFocusTo?: Accessor<Element | undefined> | undefined` (по умолчанию `anchorElement`).

- [ ] **Step 1: Падающий тест**

Создать `src/internal/floating-panel/floating-panel-focus.test.tsx`:

```tsx
import { cleanup, render, screen } from '@solidjs/testing-library';
import { createSignal } from 'solid-js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { FloatingPanel } from './floating-panel';

beforeEach(() => {
	HTMLElement.prototype.showPopover = vi.fn(function (this: HTMLElement) {
		this.removeAttribute('popover');
	});
	HTMLElement.prototype.hidePopover = vi.fn();
});

afterEach(cleanup);

describe('FloatingPanel focus options', () => {
	it('calls a function initialFocus with the shown panel instead of the built-in modes', () => {
		const focus = vi.fn();
		const [anchor, setAnchor] = createSignal<HTMLElement>();
		render(() => (
			<>
				<button type='button' ref={setAnchor}>anchor</button>
				<FloatingPanel open={() => true} onDismiss={() => undefined} anchor={anchor} initialFocus={focus} data-testid='panel'>
					<button type='button'>inside</button>
				</FloatingPanel>
			</>
		));
		expect(focus).toHaveBeenCalledExactlyOnceWith(screen.getByTestId('panel'));
		expect(document.activeElement).not.toBe(screen.getByText('inside'));
	});

	it('returns the focus to restoreFocusTo instead of the anchor when the panel closes', () => {
		const [open, setOpen] = createSignal(true);
		const [anchor, setAnchor] = createSignal<HTMLElement>();
		const [target, setTarget] = createSignal<HTMLElement>();
		render(() => (
			<>
				<button type='button' ref={setAnchor}>anchor</button>
				<button type='button' ref={setTarget}>target</button>
				<FloatingPanel open={open} onDismiss={() => undefined} anchor={anchor} restoreFocusTo={target}>
					<button type='button'>inside</button>
				</FloatingPanel>
			</>
		));
		expect(document.activeElement).toBe(screen.getByText('inside'));
		setOpen(false);
		expect(document.activeElement).toBe(screen.getByText('target'));
	});
});
```

- [ ] **Step 2: Запустить, убедиться что падает**

Run: `pnpm exec vitest run src/internal/floating-panel/floating-panel-focus.test.tsx`
Expected: оба теста FAIL (`initialFocus` не принимает функцию; фокус уходит на `anchor`).

- [ ] **Step 3: Реализовать**

В `src/internal/floating-panel/focus-initial.ts` после `export type InitialFocus = ...` добавить:

```ts
/** Куда переносится фокус при открытии: готовый режим или своя функция (меню фокусирует пункт, а не первый табулируемый элемент). */
export type InitialFocusMode = InitialFocus | ((panel: HTMLElement) => void);
```

В `src/internal/floating-panel/create-focus-on-open.ts` заменить импорт и тип опции, и тело эффекта:

```ts
import { type Accessor, createEffect, untrack } from 'solid-js';

import { focusInitial, type InitialFocusMode } from './focus-initial';

export interface FocusOnOpenOptions {
	panel: Accessor<HTMLElement | undefined>;
	open: Accessor<boolean>;
	mode: Accessor<InitialFocusMode>;
}

/** Переносит фокус в панель после показа. Создавать после createPanelLayer: до showPopover() панель скрыта и не фокусируется. */
export function createFocusOnOpen(options: FocusOnOpenOptions): void {
	createEffect(() => {
		const panel = options.panel();
		if (!options.open() || !panel) {
			return;
		}
		const mode = untrack(options.mode);
		if (typeof mode === 'function') {
			mode(panel);
			return;
		}
		focusInitial(panel, mode);
	});
}
```

В `src/internal/floating-panel/floating-panel.tsx`:
- импорт `import type { InitialFocus } from './focus-initial';` заменить на `import type { InitialFocusMode } from './focus-initial';`;
- в `FloatingPanelProps` заменить `initialFocus?: InitialFocus | undefined;` на `initialFocus?: InitialFocusMode | undefined;` и после `dismissExempt` добавить:

```ts
	/** Кому вернуть фокус при закрытии; по умолчанию инициатор (`anchorElement`). Меню возвращает фокус тому, кто держал его раньше. */
	restoreFocusTo?: Accessor<Element | undefined> | undefined;
```

- в `splitProps` добавить `'restoreFocusTo'` после `'dismissExempt'`;
- вызов `createFocusRestore` заменить на:

```ts
	createFocusRestore({ panel, anchor: () => (local.restoreFocusTo ? local.restoreFocusTo() : anchorElement()), open });
```

- [ ] **Step 4: Проверка и коммит**

Run: `pnpm check` — зелёный (373 + 2 теста).

```bash
git add -A && git commit -m "feat(floating-panel): initialFocus-функция и restoreFocusTo для меню" -m "$TRAILERS"
```

---

### Task 2: Чистые функции и хуки меню

**Files:**
- Create: `src/components/context-menu/context-menu-point.ts`, `menu-point-anchor.ts` (+ `.test.ts`), `menu-navigation.ts` (+ `.test.ts`), `menu-items.ts` (+ `.test.ts`), `create-close-on-viewport-change.ts` (+ `.test.tsx`)

**Interfaces:**
- Produces: `ContextMenuPoint { x; y }`; `pointAnchor(point): VirtualElement`; `elementPoint(element): ContextMenuPoint` (нижний левый угол); `nextMenuItemIndex(key, current, disabled): number | null`; `menuItems(panel)`, `isItemDisabled(item)`, `itemOf(panel, target)`, `focusFirstItem(panel)`, `revealTruncatedTitle(item)`; `createCloseOnViewportChange({ open, onClose })`.

- [ ] **Step 1: Точка и якорь**

Создать `src/components/context-menu/context-menu-point.ts`:

```ts
/** Координаты вьюпорта (`clientX`, `clientY`). */
export interface ContextMenuPoint {
	x: number;
	y: number;
}
```

Создать `src/components/context-menu/menu-point-anchor.ts`:

```ts
import type { VirtualElement } from '@floating-ui/dom';

import type { ContextMenuPoint } from './context-menu-point';

/** Виртуальный якорь нулевого размера в точке: Floating UI сам разворачивает меню через flip и shift у краёв вьюпорта. */
export function pointAnchor(point: ContextMenuPoint): VirtualElement {
	const rect = { x: point.x, y: point.y, width: 0, height: 0, top: point.y, right: point.x, bottom: point.y, left: point.x };
	return { getBoundingClientRect: () => rect };
}

/** Нижний левый угол элемента: точка открытия меню с клавиатуры. */
export function elementPoint(element: Element): ContextMenuPoint {
	const rect = element.getBoundingClientRect();
	return { x: rect.left, y: rect.bottom };
}
```

Создать `src/components/context-menu/menu-point-anchor.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import { elementPoint, pointAnchor } from './menu-point-anchor';

describe('pointAnchor', () => {
	it('is a zero-size rect at the point', () => {
		const rect = pointAnchor({ x: 12, y: 34 }).getBoundingClientRect();
		expect(rect).toMatchObject({ x: 12, y: 34, left: 12, right: 12, top: 34, bottom: 34, width: 0, height: 0 });
	});
});

describe('elementPoint', () => {
	it('is the bottom-left corner of the element', () => {
		const element = document.createElement('div');
		element.getBoundingClientRect = () => ({ left: 10, bottom: 50, top: 20, right: 90 }) as DOMRect;
		expect(elementPoint(element)).toEqual({ x: 10, y: 50 });
	});
});
```

- [ ] **Step 2: Навигация по пунктам**

Создать `src/components/context-menu/menu-navigation.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import { nextMenuItemIndex } from './menu-navigation';

const ALL = [false, false, false];
const MIDDLE_DISABLED = [false, true, false];

describe('nextMenuItemIndex', () => {
	it('ArrowDown and ArrowUp go around the circle', () => {
		expect(nextMenuItemIndex('ArrowDown', 0, ALL)).toBe(1);
		expect(nextMenuItemIndex('ArrowDown', 2, ALL)).toBe(0);
		expect(nextMenuItemIndex('ArrowUp', 1, ALL)).toBe(0);
		expect(nextMenuItemIndex('ArrowUp', 0, ALL)).toBe(2);
	});

	it('skips disabled items in both directions', () => {
		expect(nextMenuItemIndex('ArrowDown', 0, MIDDLE_DISABLED)).toBe(2);
		expect(nextMenuItemIndex('ArrowUp', 2, MIDDLE_DISABLED)).toBe(0);
	});

	it('Home and End take the first and the last enabled item', () => {
		expect(nextMenuItemIndex('Home', 2, [true, false, false])).toBe(1);
		expect(nextMenuItemIndex('End', 0, [false, false, true])).toBe(1);
	});

	it('with no current item ArrowDown takes the first and ArrowUp the last enabled one', () => {
		expect(nextMenuItemIndex('ArrowDown', -1, [true, false, false])).toBe(1);
		expect(nextMenuItemIndex('ArrowUp', -1, [false, false, true])).toBe(1);
	});

	it('returns the only enabled item for any arrow, even from itself', () => {
		expect(nextMenuItemIndex('ArrowDown', 1, [true, false, true])).toBe(1);
	});

	it('returns null for an empty menu, a menu of disabled items and non-navigation keys', () => {
		expect(nextMenuItemIndex('ArrowDown', -1, [])).toBeNull();
		expect(nextMenuItemIndex('Home', -1, [true, true])).toBeNull();
		expect(nextMenuItemIndex('a', 0, ALL)).toBeNull();
		expect(nextMenuItemIndex('ArrowRight', 0, ALL)).toBeNull();
	});
});
```

Создать `src/components/context-menu/menu-navigation.ts`:

```ts
/** Следующий доступный индекс от `from` в направлении `direction` по кругу; индексы вне массива допустимы как точка отсчёта. */
function step(disabled: readonly boolean[], from: number, direction: 1 | -1): number {
	const count = disabled.length;
	for (let offset = 1; offset <= count; offset++) {
		const index = (((from + direction * offset) % count) + count) % count;
		if (disabled[index] === false) {
			return index;
		}
	}
	return -1;
}

/**
 * Индекс пункта, на который ведёт клавиша; `disabled[i]` истинно, если пункт i недоступен. `null`, если клавиша не навигационная
 * или доступных пунктов нет. Стрелки идут по кругу и пропускают недоступные; без текущего пункта (`current` < 0)
 * ArrowDown берёт первый доступный, ArrowUp последний.
 */
export function nextMenuItemIndex(key: string, current: number, disabled: readonly boolean[]): number | null {
	if (!disabled.includes(false)) {
		return null;
	}
	if (key === 'Home') {
		return step(disabled, -1, 1);
	}
	if (key === 'End') {
		return step(disabled, disabled.length, -1);
	}
	if (key === 'ArrowDown') {
		return step(disabled, current < 0 ? -1 : current, 1);
	}
	if (key === 'ArrowUp') {
		return step(disabled, current < 0 ? disabled.length : current, -1);
	}
	return null;
}
```

- [ ] **Step 3: Пункты меню в DOM**

Создать `src/components/context-menu/menu-items.test.ts`:

```ts
import { afterEach, describe, expect, it } from 'vitest';

import { focusFirstItem, isItemDisabled, itemOf, menuItems, revealTruncatedTitle } from './menu-items';

afterEach(() => {
	document.body.innerHTML = '';
});

function build(html: string): HTMLElement {
	document.body.innerHTML = html;
	const panel = document.querySelector<HTMLElement>('[data-panel]');
	if (!panel) {
		throw new Error('panel is missing');
	}
	return panel;
}

describe('menuItems', () => {
	it('returns the items of this menu only, not the items of a submenu mounted inside its subtree', () => {
		const panel = build(`
			<div role="menu" data-panel>
				<div role="menuitem" id="a"></div>
				<div role="menu"><div role="menuitem" id="nested"></div></div>
				<div role="menuitem" id="b"></div>
			</div>`);
		expect(menuItems(panel).map((item) => item.id)).toEqual(['a', 'b']);
	});
});

describe('isItemDisabled and itemOf', () => {
	it('reads aria-disabled', () => {
		const panel = build('<div role="menu" data-panel><div role="menuitem" id="a" aria-disabled="true"></div></div>');
		expect(isItemDisabled(panel.querySelector<HTMLElement>('#a') as HTMLElement)).toBe(true);
	});

	it('finds the item of this menu for a target inside it and nothing for foreign targets', () => {
		const panel = build(`
			<div role="menu" data-panel>
				<div role="menuitem" id="a"><span id="label">x</span></div>
				<div role="menu"><div role="menuitem" id="nested"></div></div>
			</div>`);
		expect(itemOf(panel, panel.querySelector('#label'))?.id).toBe('a');
		expect(itemOf(panel, panel.querySelector('#nested'))).toBeUndefined();
		expect(itemOf(panel, panel)).toBeUndefined();
		expect(itemOf(panel, null)).toBeUndefined();
	});
});

describe('focusFirstItem', () => {
	it('focuses the first enabled item', () => {
		const panel = build(`
			<div role="menu" data-panel>
				<div role="menuitem" tabindex="-1" id="a" aria-disabled="true"></div>
				<div role="menuitem" tabindex="-1" id="b"></div>
			</div>`);
		focusFirstItem(panel);
		expect(document.activeElement?.id).toBe('b');
	});

	it('focuses the panel itself when there is no enabled item', () => {
		const panel = build('<div role="menu" data-panel></div>');
		focusFirstItem(panel);
		expect(document.activeElement).toBe(panel);
		expect(panel.getAttribute('tabindex')).toBe('-1');
	});
});

describe('revealTruncatedTitle', () => {
	function item(scrollWidth: number, clientWidth: number, title?: string): HTMLElement {
		const element = document.createElement('div');
		if (title) {
			element.setAttribute('title', title);
		}
		const label = document.createElement('span');
		label.setAttribute('data-s-kit-menu-label', '');
		label.textContent = 'Очень длинный пункт';
		Object.defineProperty(label, 'scrollWidth', { value: scrollWidth });
		Object.defineProperty(label, 'clientWidth', { value: clientWidth });
		element.append(label);
		return element;
	}

	it('sets the title from the text when the label is cut off', () => {
		const element = item(200, 100);
		revealTruncatedTitle(element);
		expect(element.getAttribute('title')).toBe('Очень длинный пункт');
	});

	it('leaves a fitting label and an own title alone', () => {
		const fitting = item(100, 100);
		revealTruncatedTitle(fitting);
		expect(fitting.hasAttribute('title')).toBe(false);
		const own = item(200, 100, 'свой');
		revealTruncatedTitle(own);
		expect(own.getAttribute('title')).toBe('свой');
	});
});
```

Создать `src/components/context-menu/menu-items.ts`:

```ts
const ITEM = '[role="menuitem"]';
const MENU = '[role="menu"]';

/**
 * Пункты именно этого меню. Панель подменю может оказаться в DOM-поддереве родительской панели (хост выбирается по якорю),
 * поэтому пункт принадлежит меню, только если оно его ближайшее.
 */
export function menuItems(panel: HTMLElement): HTMLElement[] {
	return Array.from(panel.querySelectorAll<HTMLElement>(ITEM)).filter((item) => item.closest(MENU) === panel);
}

export function isItemDisabled(item: HTMLElement): boolean {
	return item.getAttribute('aria-disabled') === 'true';
}

/** Пункт этого меню, внутри которого лежит цель события; `undefined`, если цель вне пунктов или в чужом меню. */
export function itemOf(panel: HTMLElement, target: EventTarget | null): HTMLElement | undefined {
	if (!(target instanceof Element)) {
		return undefined;
	}
	const item = target.closest<HTMLElement>(ITEM);
	return item && item.closest(MENU) === panel ? item : undefined;
}

/** Фокус на первый доступный пункт; если таких нет, на саму панель. */
export function focusFirstItem(panel: HTMLElement): void {
	const first = menuItems(panel).find((item) => !isItemDisabled(item));
	if (first) {
		first.focus({ preventScroll: true });
		return;
	}
	if (!panel.hasAttribute('tabindex')) {
		panel.setAttribute('tabindex', '-1');
	}
	panel.focus({ preventScroll: true });
}

/** Длинный пункт обрезан многоточием: текст целиком в `title` (свой `title` не перезаписывается). */
export function revealTruncatedTitle(item: HTMLElement): void {
	if (item.hasAttribute('title')) {
		return;
	}
	const label = item.querySelector<HTMLElement>(':scope > [data-s-kit-menu-label]');
	if (label && label.scrollWidth > label.clientWidth) {
		item.setAttribute('title', label.textContent);
	}
}
```

- [ ] **Step 4: Закрытие при прокрутке и изменении размера**

Создать `src/components/context-menu/create-close-on-viewport-change.test.tsx`:

```tsx
import { cleanup, render } from '@solidjs/testing-library';
import { createSignal } from 'solid-js';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createCloseOnViewportChange } from './create-close-on-viewport-change';

afterEach(cleanup);

function mount(initiallyOpen = true) {
	const onClose = vi.fn();
	const [open, setOpen] = createSignal(initiallyOpen);
	render(() => {
		createCloseOnViewportChange({ open, onClose });
		return <div data-s-kit-menu><span data-testid='inside'/></div>;
	});
	return { onClose, setOpen };
}

describe('createCloseOnViewportChange', () => {
	it('closes on a scroll of the page or of any element outside the menu', () => {
		const { onClose } = mount();
		document.dispatchEvent(new Event('scroll'));
		expect(onClose).toHaveBeenCalledTimes(1);
		const outside = document.createElement('div');
		document.body.append(outside);
		outside.dispatchEvent(new Event('scroll'));
		expect(onClose).toHaveBeenCalledTimes(2);
		outside.remove();
	});

	it('does not close on a scroll inside a menu', () => {
		const { onClose } = mount();
		document.querySelector('[data-testid="inside"]')?.dispatchEvent(new Event('scroll'));
		expect(onClose).not.toHaveBeenCalled();
	});

	it('closes on a window resize', () => {
		const { onClose } = mount();
		window.dispatchEvent(new Event('resize'));
		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it('listens only while open', () => {
		const { onClose, setOpen } = mount(false);
		document.dispatchEvent(new Event('scroll'));
		expect(onClose).not.toHaveBeenCalled();
		setOpen(true);
		window.dispatchEvent(new Event('resize'));
		expect(onClose).toHaveBeenCalledTimes(1);
		setOpen(false);
		window.dispatchEvent(new Event('resize'));
		expect(onClose).toHaveBeenCalledTimes(1);
	});
});
```

Создать `src/components/context-menu/create-close-on-viewport-change.ts`:

```ts
import { type Accessor, createEffect, onCleanup } from 'solid-js';

export interface CloseOnViewportChangeOptions {
	open: Accessor<boolean>;
	onClose: () => void;
}

/**
 * Меню в точке клика не должно висеть над сдвинувшимся содержимым: прокрутка страницы или любого предка и изменение размера окна
 * закрывают его. Прокрутка внутри самого меню (корень или подменю, атрибут `data-s-kit-menu`) его не закрывает.
 */
export function createCloseOnViewportChange(options: CloseOnViewportChangeOptions): void {
	createEffect(() => {
		if (!options.open()) {
			return;
		}
		const onScroll = (event: Event): void => {
			if (event.target instanceof Element && event.target.closest('[data-s-kit-menu]')) {
				return;
			}
			options.onClose();
		};
		const onResize = (): void => {
			options.onClose();
		};
		// scroll не всплывает: фаза захвата на window видит прокрутку любого элемента
		window.addEventListener('scroll', onScroll, true);
		window.addEventListener('resize', onResize);
		onCleanup(() => {
			window.removeEventListener('scroll', onScroll, true);
			window.removeEventListener('resize', onResize);
		});
	});
}
```

- [ ] **Step 5: Проверка и коммит**

Run: `pnpm check` — зелёный.

```bash
git add -A && git commit -m "feat(context-menu): чистые функции навигации, якорь-точка, закрытие при прокрутке" -m "$TRAILERS"
```

---

### Task 3: Root, Trigger, Content, Item, Separator

**Files:**
- Create: `src/components/context-menu/{context-menu-context.ts,context-menu-root.tsx,context-menu-trigger.tsx,menu-level-context.ts,menu-panel.tsx,context-menu-content.tsx,menu-item-element.tsx,context-menu-item.tsx,context-menu-separator.tsx,context-menu.module.css,index.ts,context-menu.test.tsx}`

**Interfaces:**
- Consumes: Task 1 (`initialFocus`-функция, `restoreFocusTo`), Task 2.
- Produces: `ContextMenu = { Root, Trigger, Content, Item, Separator }` (Task 4 добавляет `Sub*`); `MenuLevelContextValue { closeAll, activeItem, setActiveItem }`; `MenuPanel` (оболочка уровня меню), `MenuItemElement` (общий пункт).

- [ ] **Step 1: Падающие тесты**

Создать `src/components/context-menu/context-menu.test.tsx`:

```tsx
import { cleanup, createEvent, fireEvent, render, screen } from '@solidjs/testing-library';
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

function renderMenu(onSelect: () => void = vi.fn(), onOpenChange?: (open: boolean) => void) {
	render(() => (
		<ContextMenu.Root onOpenChange={onOpenChange}>
			<ContextMenu.Trigger data-testid='area'>
				<button type='button'>inner</button>
			</ContextMenu.Trigger>
			<ContextMenu.Content aria-label='Меню'>
				<ContextMenu.Item onSelect={onSelect}>Первый</ContextMenu.Item>
				<ContextMenu.Item disabled>Второй</ContextMenu.Item>
				<ContextMenu.Separator/>
				<ContextMenu.Item variant='danger'>Третий</ContextMenu.Item>
				<ContextMenu.Item closeOnSelect={false}>Четвёртый</ContextMenu.Item>
			</ContextMenu.Content>
		</ContextMenu.Root>
	));
	return { area: screen.getByTestId('area'), inner: screen.getByText('inner') };
}

function openByMouse(area: HTMLElement): boolean {
	return fireEvent.contextMenu(area, { clientX: 120, clientY: 80 });
}

function press(key: string, target: Element = document.activeElement ?? document.body): Event {
	const event = createEvent.keyDown(target, { key });
	fireEvent(target, event);
	return event;
}

describe('ContextMenu opening', () => {
	it('is closed by default and opens on contextmenu, cancelling the native menu', () => {
		const { area } = renderMenu();
		expect(screen.queryByRole('menu')).toBeNull();
		expect(openByMouse(area)).toBe(false);
		expect(screen.getByRole('menu', { name: 'Меню' })).toBeTruthy();
	});

	it('a disabled trigger leaves the native menu alone', () => {
		render(() => (
			<ContextMenu.Root>
				<ContextMenu.Trigger disabled data-testid='area'>area</ContextMenu.Trigger>
				<ContextMenu.Content>
					<ContextMenu.Item>Один</ContextMenu.Item>
				</ContextMenu.Content>
			</ContextMenu.Root>
		));
		expect(openByMouse(screen.getByTestId('area'))).toBe(true);
		expect(screen.queryByRole('menu')).toBeNull();
	});

	it('opens from the keyboard (ContextMenu key and Shift+F10) with the focus on the first enabled item', () => {
		const { inner } = renderMenu();
		inner.focus();
		const event = press('ContextMenu', inner);
		expect(event.defaultPrevented).toBe(true);
		expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'Первый' }));
		fireEvent.keyDown(document.body, { key: 'Escape' });
		expect(screen.queryByRole('menu')).toBeNull();
		fireEvent.keyDown(inner, { key: 'F10', shiftKey: true });
		expect(screen.getByRole('menu')).toBeTruthy();
	});

	it('opens by mouse with the focus on the menu itself, not on an item', () => {
		const { area } = renderMenu();
		openByMouse(area);
		expect(document.activeElement).toBe(screen.getByRole('menu'));
	});

	it('is opened from outside with open and anchorPoint, without a trigger', () => {
		render(() => (
			<ContextMenu.Root open anchorPoint={{ x: 10, y: 20 }}>
				<ContextMenu.Content>
					<ContextMenu.Item>Один</ContextMenu.Item>
				</ContextMenu.Content>
			</ContextMenu.Root>
		));
		expect(screen.getByRole('menu')).toBeTruthy();
	});

	it('shows nothing while it is open but has no point', () => {
		render(() => (
			<ContextMenu.Root open>
				<ContextMenu.Content>
					<ContextMenu.Item>Один</ContextMenu.Item>
				</ContextMenu.Content>
			</ContextMenu.Root>
		));
		expect(screen.queryByRole('menu')).toBeNull();
	});

	it('controlled: the contextmenu only reports the change, the prop decides', () => {
		const onOpenChange = vi.fn();
		render(() => (
			<ContextMenu.Root open={false} onOpenChange={onOpenChange}>
				<ContextMenu.Trigger data-testid='area'>area</ContextMenu.Trigger>
				<ContextMenu.Content>
					<ContextMenu.Item>Один</ContextMenu.Item>
				</ContextMenu.Content>
			</ContextMenu.Root>
		));
		openByMouse(screen.getByTestId('area'));
		expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(true);
		expect(screen.queryByRole('menu')).toBeNull();
	});

	it('a right click on the open menu does not bring up the native menu', () => {
		const { area } = renderMenu();
		openByMouse(area);
		expect(fireEvent.contextMenu(screen.getByRole('menuitem', { name: 'Первый' }))).toBe(false);
	});
});

describe('ContextMenu semantics', () => {
	it('gives the parts menu, menuitem and separator roles; a disabled item is aria-disabled; danger is marked', () => {
		const { area } = renderMenu();
		openByMouse(area);
		expect(screen.getAllByRole('menuitem')).toHaveLength(4);
		expect(screen.getByRole('separator')).toBeTruthy();
		expect(screen.getByRole('menuitem', { name: 'Второй' }).getAttribute('aria-disabled')).toBe('true');
		expect(screen.getByRole('menuitem', { name: 'Первый' }).hasAttribute('aria-disabled')).toBe(false);
		expect(screen.getByRole('menuitem', { name: 'Третий' }).getAttribute('data-variant')).toBe('danger');
		expect(screen.getByRole('menuitem', { name: 'Первый' }).getAttribute('tabindex')).toBe('-1');
	});

	it('marks the panel with the inset focus ring attribute', () => {
		const { area } = renderMenu();
		openByMouse(area);
		const menu = screen.getByRole('menu');
		expect(menu.hasAttribute('data-s-kit-focus-inset')).toBe(true);
		expect(menu.hasAttribute('data-s-kit-menu')).toBe(true);
	});
});

describe('ContextMenu keyboard', () => {
	it('arrows move the focus around the circle and skip the disabled item; Home and End jump', () => {
		const { area } = renderMenu();
		openByMouse(area);
		press('ArrowDown');
		expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'Первый' }));
		press('ArrowDown');
		expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'Третий' }));
		press('ArrowDown');
		press('ArrowDown');
		expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'Первый' }));
		press('ArrowUp');
		expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'Четвёртый' }));
		press('Home');
		expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'Первый' }));
		press('End');
		expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'Четвёртый' }));
		expect(press('ArrowDown').defaultPrevented).toBe(true);
	});

	it('Enter and Space activate the focused item, cancelling the default action', () => {
		const onSelect = vi.fn();
		const { area } = renderMenu(onSelect);
		openByMouse(area);
		press('ArrowDown');
		expect(press('Enter').defaultPrevented).toBe(true);
		expect(onSelect).toHaveBeenCalledTimes(1);
		openByMouse(area);
		press('ArrowDown');
		expect(press(' ').defaultPrevented).toBe(true);
		expect(onSelect).toHaveBeenCalledTimes(2);
	});

	it('Tab closes the menu, cancelling the move of the focus, and the focus goes back to who held it', () => {
		const { area, inner } = renderMenu();
		inner.focus();
		openByMouse(area);
		const event = press('Tab');
		expect(event.defaultPrevented).toBe(true);
		expect(screen.queryByRole('menu')).toBeNull();
		expect(document.activeElement).toBe(inner);
	});

	it('Escape closes the menu and returns the focus to the element that held it before', () => {
		const { area, inner } = renderMenu();
		inner.focus();
		openByMouse(area);
		fireEvent.keyDown(document.body, { key: 'Escape' });
		expect(screen.queryByRole('menu')).toBeNull();
		expect(document.activeElement).toBe(inner);
	});
});

describe('ContextMenu activation and pointer', () => {
	it('a click on an item runs onSelect and closes the menu once; the menu is already closed when onSelect runs', () => {
		const onOpenChange = vi.fn();
		let menuWasOpen = true;
		let focusedDuring: Element | null = null;
		const onSelect = vi.fn(() => {
			menuWasOpen = screen.queryByRole('menu') !== null;
			focusedDuring = document.activeElement;
		});
		const { area, inner } = renderMenu(onSelect, onOpenChange);
		inner.focus();
		openByMouse(area);
		fireEvent.click(screen.getByRole('menuitem', { name: 'Первый' }));
		expect(onSelect).toHaveBeenCalledTimes(1);
		expect(menuWasOpen).toBe(false);
		expect(focusedDuring).toBe(inner);
		expect(onOpenChange.mock.calls).toEqual([[true], [false]]);
	});

	it('closeOnSelect={false} keeps the menu open', () => {
		const { area } = renderMenu();
		openByMouse(area);
		fireEvent.click(screen.getByRole('menuitem', { name: 'Четвёртый' }));
		expect(screen.getByRole('menu')).toBeTruthy();
	});

	it('a disabled item neither activates nor takes the focus on hover', () => {
		const onSelect = vi.fn();
		render(() => (
			<ContextMenu.Root defaultOpen anchorPoint={{ x: 0, y: 0 }}>
				<ContextMenu.Content>
					<ContextMenu.Item disabled onSelect={onSelect}>Off</ContextMenu.Item>
				</ContextMenu.Content>
			</ContextMenu.Root>
		));
		const item = screen.getByRole('menuitem');
		fireEvent.click(item);
		fireEvent.pointerMove(item);
		expect(onSelect).not.toHaveBeenCalled();
		expect(document.activeElement).not.toBe(item);
		expect(screen.getByRole('menu')).toBeTruthy();
	});

	it('moving the pointer over an item focuses it', () => {
		const { area } = renderMenu();
		openByMouse(area);
		const item = screen.getByRole('menuitem', { name: 'Третий' });
		fireEvent.pointerMove(item);
		expect(document.activeElement).toBe(item);
	});

	it('a click outside closes the menu, a click inside does not', () => {
		const { area } = renderMenu();
		openByMouse(area);
		fireEvent.pointerDown(screen.getByRole('menuitem', { name: 'Четвёртый' }));
		expect(screen.getByRole('menu')).toBeTruthy();
		fireEvent.pointerDown(area);
		expect(screen.queryByRole('menu')).toBeNull();
	});

	it('a right click elsewhere in the area moves the menu: it closes and opens again', () => {
		const onOpenChange = vi.fn();
		const { area } = renderMenu(vi.fn(), onOpenChange);
		openByMouse(area);
		fireEvent.pointerDown(area, { button: 2 });
		openByMouse(area);
		expect(screen.getByRole('menu')).toBeTruthy();
		expect(onOpenChange.mock.calls).toEqual([[true], [false], [true]]);
	});

	it('closes on a scroll outside and on a window resize, but not on a scroll inside the menu', () => {
		const { area } = renderMenu();
		openByMouse(area);
		screen.getByRole('menu').dispatchEvent(new Event('scroll'));
		expect(screen.getByRole('menu')).toBeTruthy();
		document.dispatchEvent(new Event('scroll'));
		expect(screen.queryByRole('menu')).toBeNull();
		openByMouse(area);
		window.dispatchEvent(new Event('resize'));
		expect(screen.queryByRole('menu')).toBeNull();
	});

	it('isolates clicks inside the menu from logical ancestors', () => {
		const onAncestorClick = vi.fn();
		render(() => (
			<div onClick={onAncestorClick}>
				<ContextMenu.Root defaultOpen anchorPoint={{ x: 0, y: 0 }}>
					<ContextMenu.Content>
						<ContextMenu.Item>Один</ContextMenu.Item>
					</ContextMenu.Content>
				</ContextMenu.Root>
			</div>
		));
		fireEvent.click(screen.getByRole('menuitem'));
		expect(onAncestorClick).not.toHaveBeenCalled();
	});
});

describe('ContextMenu errors', () => {
	it('Trigger and Content outside Root throw', () => {
		vi.spyOn(console, 'error').mockImplementation(() => undefined);
		expect(() => render(() => <ContextMenu.Trigger>x</ContextMenu.Trigger>)).toThrow('ContextMenu.Trigger must be used inside ContextMenu.Root');
		expect(() => render(() => <ContextMenu.Content>x</ContextMenu.Content>)).toThrow('ContextMenu.Content must be used inside ContextMenu.Root');
	});

	it('Item outside Content throws', () => {
		vi.spyOn(console, 'error').mockImplementation(() => undefined);
		expect(() => render(() => <ContextMenu.Item>x</ContextMenu.Item>)).toThrow('ContextMenu.Item must be used inside ContextMenu.Content');
	});
});
```

- [ ] **Step 2: Контексты**

Создать `src/components/context-menu/context-menu-context.ts`:

```ts
import { type Accessor, createContext, useContext } from 'solid-js';

import type { ContextMenuPoint } from './context-menu-point';

/** Чем открыто меню: от этого зависит, куда уходит фокус (при открытии мышью на меню, с клавиатуры на первый пункт). */
export type MenuOpenSource = 'pointer' | 'keyboard';

export interface ContextMenuContextValue {
	open: Accessor<boolean>;
	setOpen: (open: boolean) => void;
	/** Открывает меню в точке; `source` решает, куда уйдёт фокус. */
	openAt: (point: ContextMenuPoint, source: MenuOpenSource) => void;
	point: Accessor<ContextMenuPoint | undefined>;
	source: Accessor<MenuOpenSource>;
	/** Область вызова: от неё считается хост панели, она же запасной получатель фокуса. */
	area: Accessor<HTMLElement | undefined>;
	setArea: (element: HTMLElement | undefined) => void;
	/** Элемент, державший фокус до открытия: ему вернётся фокус при закрытии. */
	opener: Accessor<Element | undefined>;
}

export const ContextMenuContext = createContext<ContextMenuContextValue>();

export function useContextMenuContext(part: string): ContextMenuContextValue {
	const context = useContext(ContextMenuContext);
	if (!context) {
		throw new Error(`${part} must be used inside ContextMenu.Root`);
	}
	return context;
}
```

Создать `src/components/context-menu/menu-level-context.ts`:

```ts
import { type Accessor, createContext, useContext } from 'solid-js';

/** Общее для пунктов одного уровня меню (корня или подменю): закрыть всю цепочку и узнать, какой пункт в фокусе. */
export interface MenuLevelContextValue {
	/** Закрывает корневое меню, а с ним все подменю. */
	closeAll: () => void;
	activeItem: Accessor<HTMLElement | undefined>;
	setActiveItem: (item: HTMLElement | undefined) => void;
}

export const MenuLevelContext = createContext<MenuLevelContextValue>();

export function useMenuLevelContext(part: string): MenuLevelContextValue {
	const context = useContext(MenuLevelContext);
	if (!context) {
		throw new Error(`${part} must be used inside ContextMenu.Content`);
	}
	return context;
}
```

- [ ] **Step 3: Root**

Создать `src/components/context-menu/context-menu-root.tsx`:

```tsx
import { createComputed, createSignal, type JSX } from 'solid-js';

import { createControllableSignal } from '../../utils/create-controllable-signal';

import { ContextMenuContext, type ContextMenuContextValue, type MenuOpenSource } from './context-menu-context';
import type { ContextMenuPoint } from './context-menu-point';

export interface ContextMenuRootProps {
	open?: boolean | undefined;
	defaultOpen?: boolean | undefined;
	onOpenChange?: ((open: boolean) => void) | undefined;
	/** Точка, заданная снаружи (контекстное меню строки грида): тогда `ContextMenu.Trigger` не нужен. Без точки меню не показывается. */
	anchorPoint?: ContextMenuPoint | null | undefined;
	children?: JSX.Element;
}

export function ContextMenuRoot(props: ContextMenuRootProps): JSX.Element {
	const [open, setOpen] = createControllableSignal<boolean>({
		name: 'ContextMenu',
		value: () => props.open,
		defaultValue: () => props.defaultOpen ?? false,
		onChange: (next) => props.onOpenChange?.(next)
	});
	const [ownPoint, setOwnPoint] = createSignal<ContextMenuPoint>();
	const [source, setSource] = createSignal<MenuOpenSource>('pointer');
	const [area, setArea] = createSignal<HTMLElement>();
	const [opener, setOpener] = createSignal<Element>();

	// фокус запоминается до того, как панель его заберёт: вычисление выполняется раньше эффектов панели
	let wasOpen = false;
	createComputed(() => {
		const isOpen = open();
		if (isOpen && !wasOpen) {
			const active = document.activeElement;
			setOpener(active instanceof HTMLElement && active !== document.body ? active : undefined);
		}
		wasOpen = isOpen;
	});

	const context: ContextMenuContextValue = {
		open,
		setOpen,
		openAt: (point, openSource) => {
			setOwnPoint(point);
			setSource(openSource);
			setOpen(true);
		},
		point: () => props.anchorPoint ?? ownPoint(),
		source,
		area,
		setArea: (element) => {
			setArea(element);
		},
		opener
	};

	return <ContextMenuContext.Provider value={context}>{props.children}</ContextMenuContext.Provider>;
}
```

- [ ] **Step 4: Trigger**

Создать `src/components/context-menu/context-menu-trigger.tsx`:

```tsx
import { type JSX, onCleanup, splitProps } from 'solid-js';

import { useContextMenuContext } from './context-menu-context';
import { elementPoint } from './menu-point-anchor';

export interface ContextMenuTriggerProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'class' | 'style' | 'ref' | 'onContextMenu' | 'onKeyDown'> {
	/** Отключённая область не перехватывает событие: появляется системное меню. */
	disabled?: boolean | undefined;
	onContextMenu?: JSX.EventHandler<HTMLDivElement, MouseEvent> | undefined;
	onKeyDown?: JSX.EventHandler<HTMLDivElement, KeyboardEvent> | undefined;
	ref?: ((element: HTMLDivElement) => void) | undefined;
	class?: string | undefined;
	style?: JSX.CSSProperties | undefined;
}

/** Область вызова меню. Клавиша ContextMenu и Shift+F10 на элементе внутри неё открывают меню у его нижнего левого угла. */
export function ContextMenuTrigger(props: ContextMenuTriggerProps): JSX.Element {
	const context = useContextMenuContext('ContextMenu.Trigger');
	const [local, rest] = splitProps(props, ['disabled', 'onContextMenu', 'onKeyDown', 'ref', 'class', 'style']);

	// общая область принадлежит той, из которой меню открыто
	let own: HTMLElement | undefined;
	onCleanup(() => {
		if (context.area() === own) {
			context.setArea(undefined);
		}
	});

	return (
		<div
			{...rest}
			ref={(element) => {
				own = element;
				context.setArea(element);
				local.ref?.(element);
			}}
			class={local.class}
			style={local.style}
			onContextMenu={(event) => {
				local.onContextMenu?.(event);
				if (local.disabled || event.defaultPrevented) {
					return;
				}
				event.preventDefault();
				context.setArea(event.currentTarget);
				context.openAt({ x: event.clientX, y: event.clientY }, 'pointer');
			}}
			onKeyDown={(event) => {
				local.onKeyDown?.(event);
				if (local.disabled || event.defaultPrevented) {
					return;
				}
				if (event.key === 'ContextMenu' || (event.key === 'F10' && event.shiftKey)) {
					event.preventDefault();
					context.setArea(event.currentTarget);
					context.openAt(elementPoint(event.target instanceof Element ? event.target : event.currentTarget), 'keyboard');
				}
			}}
		/>
	);
}
```

- [ ] **Step 5: CSS**

Создать `src/components/context-menu/context-menu.module.css`:

```css
/*
 * Компонентные токены ContextMenu (публичный API кастомизации):
 *   --s-kit-menu-bg, --s-kit-menu-min-width, --s-kit-menu-max-width, --s-kit-menu-item-radius, --s-kit-menu-padding
 * Сброс свойств, тень и размытие приходят из основы панелей (src/internal/floating-panel/panel-base.module.css).
 * Корень меню ставит data-s-kit-focus-inset: кольцо пункта внутри его рамки. Подсветка пункта это :focus
 * (мышь при наведении переводит на пункт фокус), поэтому :hover отдельно не стилизуется.
 */

.content {
    composes: panel material from "../../internal/floating-panel/panel-base.module.css";

    user-select: none;

    min-inline-size: var(--s-kit-menu-min-width, 180px);
    max-inline-size: var(--s-kit-menu-max-width, 320px);
    padding: var(--s-kit-menu-padding, 4px);
    border-radius: calc(var(--s-kit-radius) * 1.5);

    /* запасной сплошной фон, затем полупрозрачный материал (зонтичный, раздел 4.3) */
    background: var(--s-kit-menu-bg, var(--s-kit-color-surface));
}

@supports (backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)) {
    @media not (prefers-reduced-transparency: reduce) {
        .content {
            background: var(--s-kit-menu-bg, var(--s-kit-color-panel));
        }
    }
}

.item {
    cursor: default;

    display: flex;
    gap: 8px;
    align-items: center;

    box-sizing: border-box;
    min-block-size: var(--s-kit-control-height, var(--s-kit-control-height-md));
    padding-inline: 10px;
    border-radius: var(--s-kit-menu-item-radius, var(--s-kit-radius));

    color: var(--s-kit-color-text);
}

.item:focus,
.item[aria-expanded="true"] {
    background: var(--s-kit-color-tint);
}

.item:focus-visible {
    outline: var(--s-kit-focus-width) solid var(--s-kit-color-focus-ring);
    outline-offset: var(--s-kit-focus-ring-offset, var(--s-kit-focus-offset));
}

.item[data-variant="danger"] {
    color: var(--s-kit-color-danger);
}

.item[aria-disabled="true"] {
    cursor: not-allowed;
    opacity: var(--s-kit-disabled-opacity);
}

.label {
    overflow: hidden;
    flex: 1 1 auto;

    min-inline-size: 0;

    text-overflow: ellipsis;
    white-space: nowrap;
}

/* стрелка подменю: уголок из границ, цвет текста пункта */
.chevron {
    flex: none;

    box-sizing: border-box;
    inline-size: 6px;
    block-size: 6px;
    border-block-start: 1.5px solid currentcolor;
    border-inline-end: 1.5px solid currentcolor;

    transform: rotate(45deg);
}

.separator {
    block-size: 1px;
    margin-block: 4px;
    background: var(--s-kit-color-hairline);
}
```

- [ ] **Step 6: Оболочка уровня меню и панель корня**

Создать `src/components/context-menu/menu-panel.tsx`:

```tsx
import styles from './context-menu.module.css';

import type { Placement } from '@floating-ui/dom';
import { type Accessor, createEffect, createSignal, type JSX, splitProps } from 'solid-js';

import { FloatingPanel, type FloatingPanelAttributes } from '../../internal/floating-panel/floating-panel';
import type { InitialFocusMode } from '../../internal/floating-panel/focus-initial';
import type { AnchorElement } from '../../utils/create-anchored-position';

import { MenuLevelContext, type MenuLevelContextValue } from './menu-level-context';
import { isItemDisabled, itemOf, menuItems } from './menu-items';
import { nextMenuItemIndex } from './menu-navigation';

/** Атрибуты панели меню, кроме занятых компонентом (роль задаёт сама оболочка). */
export type MenuPanelAttributes = Omit<FloatingPanelAttributes, 'role'>;

export interface MenuPanelProps extends MenuPanelAttributes {
	open: Accessor<boolean>;
	onDismiss: () => void;
	anchor: Accessor<AnchorElement | undefined>;
	anchorElement?: Accessor<Element | undefined> | undefined;
	restoreFocusTo?: Accessor<Element | undefined> | undefined;
	dismissExempt?: Accessor<Element | undefined> | undefined;
	placement: Placement;
	gap: number;
	initialFocus?: InitialFocusMode | undefined;
	/** Закрывает корневое меню (а с ним все подменю): Tab и активация пункта. */
	closeAll: () => void;
	/** Вызывается раньше клавиатуры меню: подменю обрабатывает здесь ArrowLeft. */
	onKeyDown?: ((event: KeyboardEvent & { currentTarget: HTMLDivElement }) => void) | undefined;
	/** Корневой элемент панели. */
	ref?: ((element: HTMLDivElement) => void) | undefined;
	size?: 'sm' | 'md' | 'lg' | undefined;
	class?: string | undefined;
	style?: JSX.CSSProperties | undefined;
	children?: JSX.Element;
}

function preventDefault(event: Event): void {
	event.preventDefault();
}

/** Один уровень меню (корень или подменю): `role="menu"`, внутреннее кольцо фокуса, клавиатура и контекст уровня для пунктов. */
export function MenuPanel(props: MenuPanelProps): JSX.Element {
	const [local, rest] = splitProps(props, [
		'open',
		'onDismiss',
		'anchor',
		'anchorElement',
		'restoreFocusTo',
		'dismissExempt',
		'placement',
		'gap',
		'initialFocus',
		'closeAll',
		'onKeyDown',
		'ref',
		'size',
		'class',
		'style',
		'children'
	]);
	const [activeItem, setActiveItem] = createSignal<HTMLElement>();

	// пункты пересоздаются при каждом открытии: прежний активный пункт уже не в DOM
	createEffect(() => {
		if (!local.open()) {
			setActiveItem(undefined);
		}
	});

	const level: MenuLevelContextValue = {
		closeAll: () => {
			local.closeAll();
		},
		activeItem,
		setActiveItem: (item) => {
			setActiveItem(item);
		}
	};

	const handleKeyDown = (event: KeyboardEvent & { currentTarget: HTMLDivElement }): void => {
		local.onKeyDown?.(event);
		if (event.defaultPrevented) {
			return;
		}
		const panel = event.currentTarget;
		if (event.key === 'Tab') {
			// фокус не уходит дальше инициатора: меню закрывается, фокус возвращается тому, кто держал его до открытия
			event.preventDefault();
			local.closeAll();
			return;
		}
		if (event.key === 'Enter' || event.key === ' ') {
			const item = itemOf(panel, event.target);
			if (item) {
				event.preventDefault();
				item.click();
			}
			return;
		}
		const items = menuItems(panel);
		const current = items.findIndex((item) => item === document.activeElement);
		const next = nextMenuItemIndex(event.key, current, items.map(isItemDisabled));
		if (next !== null) {
			event.preventDefault();
			items[next]?.focus();
		}
	};

	return (
		<MenuLevelContext.Provider value={level}>
			<FloatingPanel
				{...rest}
				role='menu'
				tabIndex={-1}
				data-s-kit-menu
				data-s-kit-focus-inset
				open={local.open}
				onDismiss={local.onDismiss}
				anchor={local.anchor}
				anchorElement={local.anchorElement}
				restoreFocusTo={local.restoreFocusTo}
				dismissExempt={local.dismissExempt}
				placement={local.placement}
				gap={local.gap}
				initialFocus={local.initialFocus}
				onKeyDown={handleKeyDown}
				panelRef={(element) => {
					// правая кнопка по самому меню не вызывает системное меню; нативный слушатель не останавливает всплытие
					element.addEventListener('contextmenu', preventDefault);
					local.ref?.(element);
				}}
				size={local.size}
				class={local.class ? `${styles['content']} ${local.class}` : styles['content']}
				style={local.style}
			>
				{local.children}
			</FloatingPanel>
		</MenuLevelContext.Provider>
	);
}
```

Создать `src/components/context-menu/context-menu-content.tsx`:

```tsx
import { createMemo, type JSX, splitProps } from 'solid-js';

import { focusFirstItem } from './menu-items';
import { useContextMenuContext } from './context-menu-context';
import { createCloseOnViewportChange } from './create-close-on-viewport-change';
import { MenuPanel, type MenuPanelAttributes } from './menu-panel';
import { pointAnchor } from './menu-point-anchor';

export interface ContextMenuContentProps extends MenuPanelAttributes {
	size?: 'sm' | 'md' | 'lg' | undefined;
	/** Вызывается раньше клавиатуры меню. */
	onKeyDown?: ((event: KeyboardEvent & { currentTarget: HTMLDivElement }) => void) | undefined;
	/** Корневой элемент меню. */
	ref?: ((element: HTMLDivElement) => void) | undefined;
	class?: string | undefined;
	style?: JSX.CSSProperties | undefined;
	children?: JSX.Element;
}

export function ContextMenuContent(props: ContextMenuContentProps): JSX.Element {
	const context = useContextMenuContext('ContextMenu.Content');
	const [local, rest] = splitProps(props, ['size', 'onKeyDown', 'ref', 'class', 'style', 'children']);
	const anchor = createMemo(() => {
		const point = context.point();
		return point ? pointAnchor(point) : undefined;
	});
	// открытое меню без точки показать некуда
	const open = (): boolean => context.open() && anchor() !== undefined;
	const close = (): void => {
		context.setOpen(false);
	};

	createCloseOnViewportChange({ open, onClose: close });

	return (
		<MenuPanel
			{...rest}
			open={open}
			onDismiss={close}
			anchor={anchor}
			anchorElement={context.area}
			restoreFocusTo={() => context.opener() ?? context.area()}
			// область вызова не часть меню: клик в другом месте области закрывает меню (раздел 3.3 спека)
			dismissExempt={() => undefined}
			placement='bottom-start'
			gap={2}
			initialFocus={context.source() === 'keyboard' ? focusFirstItem : 'panel'}
			closeAll={close}
			onKeyDown={local.onKeyDown}
			ref={local.ref}
			size={local.size}
			class={local.class}
			style={local.style}
		>
			{local.children}
		</MenuPanel>
	);
}
```

- [ ] **Step 7: Пункты и разделитель**

Создать `src/components/context-menu/menu-item-element.tsx`:

```tsx
import styles from './context-menu.module.css';

import { type JSX, splitProps } from 'solid-js';

import { useMenuLevelContext } from './menu-level-context';
import { revealTruncatedTitle } from './menu-items';

export interface MenuItemElementProps
	extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'class' | 'style' | 'role' | 'ref' | 'onClick' | 'onPointerMove' | 'onFocus' | 'children'> {
	variant?: 'default' | 'danger' | undefined;
	disabled?: boolean | undefined;
	onClick?: JSX.EventHandler<HTMLDivElement, MouseEvent> | undefined;
	onPointerMove?: JSX.EventHandler<HTMLDivElement, PointerEvent> | undefined;
	/** Корневой элемент пункта. */
	rootRef?: ((element: HTMLDivElement) => void) | undefined;
	/** Содержимое после подписи, не обрезаемое многоточием (стрелка подменю). */
	trailing?: JSX.Element;
	class?: string | undefined;
	style?: JSX.CSSProperties | undefined;
	children?: JSX.Element;
}

/** Общий элемент пункта меню: роль, `tabindex="-1"`, фокус под указателем, подпись с многоточием. Поведение активации задают обёртки. */
export function MenuItemElement(props: MenuItemElementProps): JSX.Element {
	const level = useMenuLevelContext('ContextMenu.Item');
	const [local, rest] = splitProps(props, [
		'variant',
		'disabled',
		'onClick',
		'onPointerMove',
		'rootRef',
		'trailing',
		'class',
		'style',
		'children'
	]);

	return (
		<div
			{...rest}
			ref={(element) => {
				local.rootRef?.(element);
			}}
			role='menuitem'
			tabIndex={-1}
			aria-disabled={local.disabled ? 'true' : undefined}
			data-variant={local.variant === 'danger' ? 'danger' : undefined}
			class={local.class ? `${styles['item']} ${local.class}` : styles['item']}
			style={local.style}
			onFocus={(event) => {
				level.setActiveItem(event.currentTarget);
			}}
			onClick={(event) => {
				if (!local.disabled) {
					local.onClick?.(event);
				}
			}}
			onPointerMove={(event) => {
				local.onPointerMove?.(event);
				if (local.disabled) {
					return;
				}
				const item = event.currentTarget;
				if (document.activeElement !== item) {
					item.focus({ preventScroll: true });
				}
				revealTruncatedTitle(item);
			}}
		>
			<span data-s-kit-menu-label class={styles['label']}>{local.children}</span>
			{local.trailing}
		</div>
	);
}
```

Создать `src/components/context-menu/context-menu-item.tsx`:

```tsx
import { type JSX, splitProps } from 'solid-js';

import { MenuItemElement, type MenuItemElementProps } from './menu-item-element';
import { useMenuLevelContext } from './menu-level-context';

export interface ContextMenuItemProps extends Omit<MenuItemElementProps, 'rootRef' | 'trailing'> {
	/** По умолчанию `true`: закрывает всю цепочку меню, а не только подменю. */
	closeOnSelect?: boolean | undefined;
	onSelect?: (() => void) | undefined;
}

export function ContextMenuItem(props: ContextMenuItemProps): JSX.Element {
	const level = useMenuLevelContext('ContextMenu.Item');
	const [local, rest] = splitProps(props, ['closeOnSelect', 'onSelect', 'onClick']);

	return (
		<MenuItemElement
			{...rest}
			onClick={(event) => {
				local.onClick?.(event);
				if (event.defaultPrevented) {
					return;
				}
				const select = local.onSelect;
				// меню закрывается раньше команды: команда может открыть диалог, а тот должен запомнить уже вернувшийся фокус
				if (local.closeOnSelect !== false) {
					level.closeAll();
				}
				select?.();
			}}
		/>
	);
}
```

Создать `src/components/context-menu/context-menu-separator.tsx`:

```tsx
import { type JSX, splitProps } from 'solid-js';

import styles from './context-menu.module.css';

export interface ContextMenuSeparatorProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'class' | 'style' | 'role' | 'children'> {
	class?: string | undefined;
	style?: JSX.CSSProperties | undefined;
}

export function ContextMenuSeparator(props: ContextMenuSeparatorProps): JSX.Element {
	const [local, rest] = splitProps(props, ['class', 'style']);
	return (
		<div
			{...rest}
			role='separator'
			class={local.class ? `${styles['separator']} ${local.class}` : styles['separator']}
			style={local.style}
		/>
	);
}
```

- [ ] **Step 8: index.ts**

Создать `src/components/context-menu/index.ts`:

```ts
import { ContextMenuContent } from './context-menu-content';
import { ContextMenuItem } from './context-menu-item';
import { ContextMenuRoot } from './context-menu-root';
import { ContextMenuSeparator } from './context-menu-separator';
import { ContextMenuTrigger } from './context-menu-trigger';

export type { ContextMenuContentProps } from './context-menu-content';
export type { ContextMenuItemProps } from './context-menu-item';
export type { ContextMenuPoint } from './context-menu-point';
export type { ContextMenuRootProps } from './context-menu-root';
export type { ContextMenuSeparatorProps } from './context-menu-separator';
export type { ContextMenuTriggerProps } from './context-menu-trigger';

export const ContextMenu = {
	Root: ContextMenuRoot,
	Trigger: ContextMenuTrigger,
	Content: ContextMenuContent,
	Item: ContextMenuItem,
	Separator: ContextMenuSeparator
};
```

- [ ] **Step 9: Запустить тесты, типы, линт**

Run: `pnpm exec stylelint --fix src/components/context-menu/context-menu.module.css && pnpm check`
Expected: зелёный. Падения чинить в коде, не ослабляя тесты.

- [ ] **Step 10: Коммит**

```bash
git add -A && git commit -m "feat(context-menu): Root, Trigger, Content, Item, Separator" -m "$TRAILERS"
```

---

### Task 4: Подменю

**Files:**
- Create: `src/components/context-menu/{sub-context.ts,context-menu-sub.tsx,context-menu-sub-trigger.tsx,context-menu-sub-content.tsx,context-menu-sub.test.tsx}`
- Modify: `src/components/context-menu/index.ts`

**Interfaces:**
- Consumes: Task 3 (`MenuPanel`, `MenuItemElement`, `useMenuLevelContext`).
- Produces: `ContextMenu.Sub`, `ContextMenu.SubTrigger`, `ContextMenu.SubContent` (глубина вложенности не ограничена); `SubContextValue`.

- [ ] **Step 1: Падающие тесты**

Создать `src/components/context-menu/context-menu-sub.test.tsx`:

```tsx
import { cleanup, createEvent, fireEvent, render, screen } from '@solidjs/testing-library';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ContextMenu } from './index';

beforeEach(() => {
	HTMLElement.prototype.showPopover = vi.fn(function (this: HTMLElement) {
		this.removeAttribute('popover');
	});
	HTMLElement.prototype.hidePopover = vi.fn();
});

afterEach(() => {
	cleanup();
	vi.useRealTimers();
});

function renderMenu(onSelect: () => void = vi.fn()) {
	render(() => (
		<ContextMenu.Root defaultOpen anchorPoint={{ x: 10, y: 10 }}>
			<ContextMenu.Content aria-label='Корень'>
				<ContextMenu.Item>Переименовать</ContextMenu.Item>
				<ContextMenu.Sub>
					<ContextMenu.SubTrigger>Переместить в</ContextMenu.SubTrigger>
					<ContextMenu.SubContent>
						<ContextMenu.Item onSelect={onSelect}>Папка A</ContextMenu.Item>
						<ContextMenu.Item closeOnSelect={false}>Папка B</ContextMenu.Item>
						<ContextMenu.Sub>
							<ContextMenu.SubTrigger>Архив</ContextMenu.SubTrigger>
							<ContextMenu.SubContent aria-label='Архив'>
								<ContextMenu.Item>2024</ContextMenu.Item>
							</ContextMenu.SubContent>
						</ContextMenu.Sub>
					</ContextMenu.SubContent>
				</ContextMenu.Sub>
				<ContextMenu.Sub>
					<ContextMenu.SubTrigger disabled>Недоступное</ContextMenu.SubTrigger>
					<ContextMenu.SubContent>
						<ContextMenu.Item>Скрыто</ContextMenu.Item>
					</ContextMenu.SubContent>
				</ContextMenu.Sub>
			</ContextMenu.Content>
		</ContextMenu.Root>
	));
}

const subTrigger = (): HTMLElement => screen.getByRole('menuitem', { name: 'Переместить в' });

function press(key: string, target: Element = document.activeElement ?? document.body): Event {
	const event = createEvent.keyDown(target, { key });
	fireEvent(target, event);
	return event;
}

function openByKeyboard(): void {
	subTrigger().focus();
	press('ArrowRight');
}

describe('ContextMenu submenu', () => {
	it('SubTrigger announces a submenu and the state follows it', () => {
		renderMenu();
		expect(subTrigger().getAttribute('aria-haspopup')).toBe('menu');
		expect(subTrigger().getAttribute('aria-expanded')).toBe('false');
		expect(screen.queryByRole('menu', { name: 'Переместить в' })).toBeNull();
		openByKeyboard();
		expect(subTrigger().getAttribute('aria-expanded')).toBe('true');
		const sub = screen.getByRole('menu', { name: 'Переместить в' });
		expect(subTrigger().getAttribute('aria-controls')).toBe(sub.id);
		expect(sub.getAttribute('aria-labelledby')).toBe(subTrigger().id);
	});

	it('ArrowRight, Enter and Space open it with the focus on the first item; ArrowLeft closes it and returns the focus', () => {
		renderMenu();
		for (const key of ['ArrowRight', 'Enter', ' ']) {
			subTrigger().focus();
			expect(press(key).defaultPrevented).toBe(true);
			expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'Папка A' }));
			press('ArrowLeft');
			expect(screen.queryByRole('menu', { name: 'Переместить в' })).toBeNull();
			expect(document.activeElement).toBe(subTrigger());
		}
	});

	it('does not run the parent Enter handler for the SubTrigger (the submenu opens once, no activation)', () => {
		const onSelect = vi.fn();
		renderMenu(onSelect);
		subTrigger().focus();
		press('Enter');
		expect(onSelect).not.toHaveBeenCalled();
		expect(screen.getAllByRole('menu')).toHaveLength(2);
	});

	it('a click on SubTrigger opens it at once and a second click keeps it open', () => {
		renderMenu();
		fireEvent.click(subTrigger());
		expect(screen.getByRole('menu', { name: 'Переместить в' })).toBeTruthy();
		fireEvent.click(subTrigger());
		expect(screen.getByRole('menu', { name: 'Переместить в' })).toBeTruthy();
	});

	it('hovering opens it after 120 ms and keeps the focus on the SubTrigger; leaving earlier cancels', () => {
		vi.useFakeTimers();
		renderMenu();
		fireEvent.pointerMove(subTrigger());
		vi.advanceTimersByTime(119);
		expect(screen.queryByRole('menu', { name: 'Переместить в' })).toBeNull();
		vi.advanceTimersByTime(1);
		expect(screen.getByRole('menu', { name: 'Переместить в' })).toBeTruthy();
		expect(document.activeElement).toBe(subTrigger());
		fireEvent.keyDown(document.body, { key: 'Escape' });

		fireEvent.pointerMove(subTrigger());
		fireEvent.pointerLeave(subTrigger());
		vi.advanceTimersByTime(500);
		expect(screen.queryByRole('menu', { name: 'Переместить в' })).toBeNull();
	});

	it('ArrowRight on a hover-opened submenu moves the focus into it', () => {
		vi.useFakeTimers();
		renderMenu();
		fireEvent.pointerMove(subTrigger());
		vi.advanceTimersByTime(120);
		press('ArrowRight');
		expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'Папка A' }));
	});

	it('moving to another item of the parent menu closes the submenu', () => {
		renderMenu();
		openByKeyboard();
		subTrigger().focus();
		fireEvent.pointerMove(screen.getByRole('menuitem', { name: 'Переименовать' }));
		expect(screen.queryByRole('menu', { name: 'Переместить в' })).toBeNull();
		expect(screen.getByRole('menu', { name: 'Корень' })).toBeTruthy();
	});

	it('a disabled SubTrigger does not open', () => {
		vi.useFakeTimers();
		renderMenu();
		const disabled = screen.getByRole('menuitem', { name: 'Недоступное' });
		fireEvent.pointerMove(disabled);
		fireEvent.click(disabled);
		disabled.focus();
		press('ArrowRight', disabled);
		vi.advanceTimersByTime(500);
		expect(screen.getAllByRole('menu')).toHaveLength(1);
	});
});

describe('ContextMenu submenu layers', () => {
	it('Escape closes the submenu first, then the menu, and the focus returns to the SubTrigger', () => {
		renderMenu();
		openByKeyboard();
		fireEvent.keyDown(document.body, { key: 'Escape' });
		expect(screen.queryByRole('menu', { name: 'Переместить в' })).toBeNull();
		expect(screen.getByRole('menu', { name: 'Корень' })).toBeTruthy();
		expect(document.activeElement).toBe(subTrigger());
		fireEvent.keyDown(document.body, { key: 'Escape' });
		expect(screen.queryByRole('menu')).toBeNull();
	});

	it('a click outside both menus closes both with one click', () => {
		renderMenu();
		openByKeyboard();
		fireEvent.pointerDown(document.body);
		expect(screen.queryByRole('menu')).toBeNull();
	});

	it('a pointerdown inside the submenu or on its SubTrigger closes nothing; one on the parent menu closes only the submenu', () => {
		renderMenu();
		openByKeyboard();
		fireEvent.pointerDown(screen.getByRole('menuitem', { name: 'Папка B' }));
		fireEvent.pointerDown(subTrigger());
		expect(screen.getAllByRole('menu')).toHaveLength(2);
		fireEvent.pointerDown(screen.getByRole('menuitem', { name: 'Переименовать' }));
		expect(screen.queryByRole('menu', { name: 'Переместить в' })).toBeNull();
		expect(screen.getByRole('menu', { name: 'Корень' })).toBeTruthy();
	});

	it('an activated submenu item closes the whole chain, closeOnSelect={false} keeps both open', () => {
		const onSelect = vi.fn();
		renderMenu(onSelect);
		openByKeyboard();
		fireEvent.click(screen.getByRole('menuitem', { name: 'Папка B' }));
		expect(screen.getAllByRole('menu')).toHaveLength(2);
		fireEvent.click(screen.getByRole('menuitem', { name: 'Папка A' }));
		expect(onSelect).toHaveBeenCalledTimes(1);
		expect(screen.queryByRole('menu')).toBeNull();
	});

	it('Tab inside the submenu closes the whole chain', () => {
		renderMenu();
		openByKeyboard();
		expect(press('Tab').defaultPrevented).toBe(true);
		expect(screen.queryByRole('menu')).toBeNull();
	});

	it('arrows inside the submenu navigate only its items', () => {
		renderMenu();
		openByKeyboard();
		press('ArrowDown');
		expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'Папка B' }));
		press('ArrowUp');
		press('ArrowUp');
		expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'Архив' }));
	});

	it('nests without a depth limit: Escape closes three levels one by one', () => {
		renderMenu();
		openByKeyboard();
		screen.getByRole('menuitem', { name: 'Архив' }).focus();
		press('ArrowRight');
		expect(screen.getAllByRole('menu')).toHaveLength(3);
		expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: '2024' }));
		fireEvent.keyDown(document.body, { key: 'Escape' });
		expect(screen.getAllByRole('menu')).toHaveLength(2);
		fireEvent.keyDown(document.body, { key: 'Escape' });
		expect(screen.getAllByRole('menu')).toHaveLength(1);
		fireEvent.keyDown(document.body, { key: 'Escape' });
		expect(screen.queryByRole('menu')).toBeNull();
	});

	it('a scroll outside closes every level', () => {
		renderMenu();
		openByKeyboard();
		document.dispatchEvent(new Event('scroll'));
		expect(screen.queryByRole('menu')).toBeNull();
	});
});

describe('ContextMenu submenu errors', () => {
	it('SubTrigger and SubContent outside Sub throw', () => {
		vi.spyOn(console, 'error').mockImplementation(() => undefined);
		const wrap = (inner: () => ReturnType<typeof ContextMenu.SubTrigger>) => () => (
			<ContextMenu.Root defaultOpen anchorPoint={{ x: 0, y: 0 }}>
				<ContextMenu.Content>{inner()}</ContextMenu.Content>
			</ContextMenu.Root>
		);
		expect(() => render(wrap(() => <ContextMenu.SubTrigger>x</ContextMenu.SubTrigger>))).toThrow(
			'ContextMenu.SubTrigger must be used inside ContextMenu.Sub'
		);
		expect(() => render(wrap(() => <ContextMenu.SubContent>x</ContextMenu.SubContent>))).toThrow(
			'ContextMenu.SubContent must be used inside ContextMenu.Sub'
		);
	});

	it('Sub outside Content throws', () => {
		vi.spyOn(console, 'error').mockImplementation(() => undefined);
		expect(() => render(() => <ContextMenu.Sub>x</ContextMenu.Sub>)).toThrow('ContextMenu.Sub must be used inside ContextMenu.Content');
	});
});
```

- [ ] **Step 2: Контекст подменю**

Создать `src/components/context-menu/sub-context.ts`:

```ts
import { type Accessor, createContext, useContext } from 'solid-js';

import type { MenuOpenSource } from './context-menu-context';

export interface SubContextValue {
	open: Accessor<boolean>;
	/** Чем открыто: с клавиатуры фокус уходит на первый пункт подменю, мышью остаётся на `SubTrigger`. */
	source: Accessor<MenuOpenSource>;
	setOpen: (open: boolean, source?: MenuOpenSource) => void;
	trigger: Accessor<HTMLElement | undefined>;
	setTrigger: (element: HTMLElement | undefined) => void;
	triggerId: string;
	contentId: string;
}

export const SubContext = createContext<SubContextValue>();

export function useSubContext(part: string): SubContextValue {
	const context = useContext(SubContext);
	if (!context) {
		throw new Error(`${part} must be used inside ContextMenu.Sub`);
	}
	return context;
}
```

- [ ] **Step 3: Sub, SubTrigger, SubContent**

Создать `src/components/context-menu/context-menu-sub.tsx`:

```tsx
import { createEffect, createSignal, createUniqueId, type JSX, untrack } from 'solid-js';

import type { MenuOpenSource } from './context-menu-context';
import { useMenuLevelContext } from './menu-level-context';
import { SubContext, type SubContextValue } from './sub-context';

export interface ContextMenuSubProps {
	children?: JSX.Element;
}

/** Состояние одного подменю: открыто ли оно, чем открыто и какой пункт его вызывает. */
export function ContextMenuSub(props: ContextMenuSubProps): JSX.Element {
	const level = useMenuLevelContext('ContextMenu.Sub');
	const [open, setOpenState] = createSignal(false);
	const [source, setSource] = createSignal<MenuOpenSource>('pointer');
	const [trigger, setTrigger] = createSignal<HTMLElement>();
	const id = createUniqueId();

	// фокус ушёл на другой пункт родительского меню: подменю закрывается (фокус внутри подменю активный пункт родителя не меняет)
	createEffect(() => {
		const active = level.activeItem();
		if (active && active !== trigger() && untrack(open)) {
			setOpenState(false);
		}
	});

	const context: SubContextValue = {
		open,
		source,
		setOpen: (next, nextSource = 'pointer') => {
			if (next) {
				setSource(nextSource);
			}
			setOpenState(next);
		},
		trigger,
		setTrigger: (element) => {
			setTrigger(element);
		},
		triggerId: `${id}-trigger`,
		contentId: `${id}-content`
	};

	return <SubContext.Provider value={context}>{props.children}</SubContext.Provider>;
}
```

Создать `src/components/context-menu/context-menu-sub-trigger.tsx`:

```tsx
import styles from './context-menu.module.css';

import { type JSX, onCleanup, splitProps } from 'solid-js';

import { focusFirstItem } from './menu-items';
import { MenuItemElement, type MenuItemElementProps } from './menu-item-element';
import { useSubContext } from './sub-context';

/** Задержка наведения до открытия подменю, мс (спек этапа 2, раздел 6; «безопасный треугольник» это тех. долг SK-1). */
const HOVER_OPEN_DELAY = 120;

export interface ContextMenuSubTriggerProps
	extends Omit<MenuItemElementProps, 'rootRef' | 'trailing' | 'onKeyDown' | 'onPointerLeave'> {
	onKeyDown?: JSX.EventHandler<HTMLDivElement, KeyboardEvent> | undefined;
	onPointerLeave?: JSX.EventHandler<HTMLDivElement, PointerEvent> | undefined;
}

/** Пункт со стрелкой, открывающий подменю: ArrowRight, Enter, Space, клик, наведение через 120 мс. */
export function ContextMenuSubTrigger(props: ContextMenuSubTriggerProps): JSX.Element {
	const sub = useSubContext('ContextMenu.SubTrigger');
	const [local, rest] = splitProps(props, ['onClick', 'onKeyDown', 'onPointerMove', 'onPointerLeave']);

	let timer: ReturnType<typeof setTimeout> | undefined;
	const clearTimer = (): void => {
		if (timer !== undefined) {
			clearTimeout(timer);
			timer = undefined;
		}
	};
	onCleanup(clearTimer);

	// у подменю один вызывающий пункт; снимается только своим владельцем
	let own: HTMLElement | undefined;
	onCleanup(() => {
		if (sub.trigger() === own) {
			sub.setTrigger(undefined);
		}
	});

	return (
		<MenuItemElement
			{...rest}
			id={sub.triggerId}
			rootRef={(element) => {
				own = element;
				sub.setTrigger(element);
			}}
			aria-haspopup='menu'
			aria-expanded={sub.open()}
			aria-controls={sub.open() ? sub.contentId : undefined}
			trailing={<span class={styles['chevron']} aria-hidden='true'/>}
			onClick={(event) => {
				local.onClick?.(event);
				if (!event.defaultPrevented) {
					sub.setOpen(true, 'pointer');
				}
			}}
			onPointerMove={(event) => {
				local.onPointerMove?.(event);
				if (props.disabled || sub.open() || timer !== undefined) {
					return;
				}
				timer = setTimeout(() => {
					timer = undefined;
					sub.setOpen(true, 'pointer');
				}, HOVER_OPEN_DELAY);
			}}
			onPointerLeave={(event) => {
				local.onPointerLeave?.(event);
				clearTimer();
			}}
			onKeyDown={(event) => {
				local.onKeyDown?.(event);
				if (event.defaultPrevented || props.disabled) {
					return;
				}
				if (event.key === 'ArrowRight' || event.key === 'Enter' || event.key === ' ') {
					// отменённое событие клавиатура уровня пропускает: иначе Enter и Space вызвали бы там click()
					event.preventDefault();
					const wasOpen = sub.open();
					sub.setOpen(true, 'keyboard');
					const panel = document.getElementById(sub.contentId);
					if (wasOpen && panel) {
						focusFirstItem(panel);
					}
				}
			}}
		/>
	);
}
```

Создать `src/components/context-menu/context-menu-sub-content.tsx`:

```tsx
import { type JSX, splitProps } from 'solid-js';

import { focusFirstItem } from './menu-items';
import { MenuPanel, type MenuPanelAttributes } from './menu-panel';
import { useMenuLevelContext } from './menu-level-context';
import { useSubContext } from './sub-context';

export interface ContextMenuSubContentProps extends MenuPanelAttributes {
	size?: 'sm' | 'md' | 'lg' | undefined;
	/** Вызывается раньше клавиатуры меню. */
	onKeyDown?: ((event: KeyboardEvent & { currentTarget: HTMLDivElement }) => void) | undefined;
	/** Корневой элемент подменю. */
	ref?: ((element: HTMLDivElement) => void) | undefined;
	class?: string | undefined;
	style?: JSX.CSSProperties | undefined;
	children?: JSX.Element;
}

/** Панель подменю: вложенный слой стека с якорем на `SubTrigger`; ArrowLeft закрывает её, фокус возвращается на `SubTrigger`. */
export function ContextMenuSubContent(props: ContextMenuSubContentProps): JSX.Element {
	const sub = useSubContext('ContextMenu.SubContent');
	const level = useMenuLevelContext('ContextMenu.SubContent');
	const [local, rest] = splitProps(props, ['size', 'onKeyDown', 'ref', 'class', 'style', 'children']);

	return (
		<MenuPanel
			{...rest}
			id={sub.contentId}
			aria-labelledby={sub.triggerId}
			open={sub.open}
			onDismiss={() => {
				sub.setOpen(false);
			}}
			anchor={sub.trigger}
			placement='right-start'
			gap={2}
			initialFocus={sub.source() === 'keyboard' ? focusFirstItem : 'none'}
			closeAll={level.closeAll}
			onKeyDown={(event) => {
				local.onKeyDown?.(event);
				if (!event.defaultPrevented && event.key === 'ArrowLeft') {
					event.preventDefault();
					sub.setOpen(false);
				}
			}}
			ref={local.ref}
			size={local.size}
			class={local.class}
			style={local.style}
		>
			{local.children}
		</MenuPanel>
	);
}
```

- [ ] **Step 4: index.ts**

В `src/components/context-menu/index.ts` добавить импорты и экспорты:

```ts
import { ContextMenuSub } from './context-menu-sub';
import { ContextMenuSubContent } from './context-menu-sub-content';
import { ContextMenuSubTrigger } from './context-menu-sub-trigger';
```

```ts
export type { ContextMenuSubProps } from './context-menu-sub';
export type { ContextMenuSubContentProps } from './context-menu-sub-content';
export type { ContextMenuSubTriggerProps } from './context-menu-sub-trigger';
```

и в объект `ContextMenu` добавить `Sub: ContextMenuSub, SubTrigger: ContextMenuSubTrigger, SubContent: ContextMenuSubContent`.

- [ ] **Step 5: Запустить всё**

Run: `pnpm check` — зелёный. Затем мутации: убрать из `MenuPanel` `event.defaultPrevented`-проверку не нужно; обязательные мутации: (а) мутация с `stopPropagation` оказалась бесполезной (клавиатуру уровня и так останавливает `defaultPrevented`), поэтому `stopPropagation` из `SubTrigger` убран; (б) в `ContextMenuSub` убрать эффект закрытия по смене активного пункта — тест «moving to another item…» обязан упасть; (в) в `ContextMenuItem` поставить `select?.()` до `level.closeAll()` — тест «the menu is already closed when onSelect runs» обязан упасть. Вернуть код.

- [ ] **Step 6: Коммит**

```bash
git add -A && git commit -m "feat(context-menu): подменю Sub, SubTrigger, SubContent" -m "$TRAILERS"
```

---

### Task 5: Playground: демонстрации и проверки ContextMenu

**Files:**
- Create: `playground/src/demo-context-menus.tsx`, `playground/src/context-menu-checks.ts`
- Modify: `playground/src/panels-page.tsx`, `playground/src/playground.css`

**Interfaces:**
- Consumes: `ContextMenu`, `Dialog` (часть 2), `runDialogChecks`.
- Produces: на странице «Панели» секции «2. ContextMenu», «3. Проверки» (кнопка запускает проверки Dialog и ContextMenu).

- [ ] **Step 1: Демонстрации**

Создать `playground/src/demo-context-menus.tsx`:

```tsx
import { Button } from '@stark/solid-kit/button';
import { ContextMenu, type ContextMenuPoint } from '@stark/solid-kit/context-menu';
import { Dialog } from '@stark/solid-kit/dialog';
import { createSignal, type JSX } from 'solid-js';

/** Содержимое меню: пункты, подменю на два уровня, недоступный и опасный пункты. Команда пишется в журнал. */
function MenuItems(props: { log: (command: string) => void }): JSX.Element {
	return (
		<>
			<ContextMenu.Item data-menu-item='rename' onSelect={() => props.log('Переименовать')}>Переименовать</ContextMenu.Item>
			<ContextMenu.Sub>
				<ContextMenu.SubTrigger data-menu-item='move'>Переместить в</ContextMenu.SubTrigger>
				<ContextMenu.SubContent data-menu-sub='move'>
					<ContextMenu.Item onSelect={() => props.log('Папка A')}>Папка A</ContextMenu.Item>
					<ContextMenu.Item onSelect={() => props.log('Папка B')}>Папка B</ContextMenu.Item>
					<ContextMenu.Sub>
						<ContextMenu.SubTrigger>Архив</ContextMenu.SubTrigger>
						<ContextMenu.SubContent>
							<ContextMenu.Item onSelect={() => props.log('Архив 2024')}>2024</ContextMenu.Item>
						</ContextMenu.SubContent>
					</ContextMenu.Sub>
				</ContextMenu.SubContent>
			</ContextMenu.Sub>
			<ContextMenu.Item disabled>Недоступный пункт</ContextMenu.Item>
			<ContextMenu.Item closeOnSelect={false} onSelect={() => props.log('Отметить (меню остаётся)')}>Отметить, не закрывая</ContextMenu.Item>
			<ContextMenu.Item onSelect={() => props.log('Очень длинное название пункта меню, которое не помещается в максимальную ширину')}>
				Очень длинное название пункта меню, которое не помещается в максимальную ширину
			</ContextMenu.Item>
			<ContextMenu.Separator/>
			<ContextMenu.Item variant='danger' data-menu-item='delete' onSelect={() => props.log('Удалить')}>Удалить</ContextMenu.Item>
		</>
	);
}

/** Три сценария: область с меню, меню в диалоге (Esc три раза), меню в заданной снаружи точке. */
export function DemoContextMenus(): JSX.Element {
	const [last, setLast] = createSignal('нет');
	const [outsideOpen, setOutsideOpen] = createSignal(false);
	const [point, setPoint] = createSignal<ContextMenuPoint | null>(null);

	return (
		<div class='menu-demos'>
			<ContextMenu.Root>
				<ContextMenu.Trigger class='menu-area' data-menu-area='basic'>
					Правый клик в этой области (или Shift+F10 на кнопке ниже)
					<Button type='button' data-menu-area-button>Кнопка внутри области</Button>
				</ContextMenu.Trigger>
				<ContextMenu.Content data-menu-content='basic' aria-label='Действия'>
					<MenuItems log={setLast}/>
				</ContextMenu.Content>
			</ContextMenu.Root>

			<Dialog.Root>
				<Dialog.Trigger data-menu-dialog-trigger>Диалог с контекстным меню</Dialog.Trigger>
				<Dialog.Content>
					<Dialog.Title>Меню внутри диалога</Dialog.Title>
					<Dialog.Body>
						<ContextMenu.Root>
							<ContextMenu.Trigger class='menu-area' data-menu-area='dialog'>
								Правый клик здесь: Esc закрывает подменю, меню и диалог по очереди
							</ContextMenu.Trigger>
							<ContextMenu.Content aria-label='Действия в диалоге'>
								<MenuItems log={setLast}/>
							</ContextMenu.Content>
						</ContextMenu.Root>
					</Dialog.Body>
					<Dialog.Footer>
						<Dialog.Close>Закрыть</Dialog.Close>
					</Dialog.Footer>
				</Dialog.Content>
			</Dialog.Root>

			<ContextMenu.Root
				open={outsideOpen()}
				onOpenChange={setOutsideOpen}
				anchorPoint={point()}
			>
				<Button
					type='button'
					data-menu-outside-trigger
					onContextMenu={(event) => {
						event.preventDefault();
						setPoint({ x: event.clientX, y: event.clientY });
						setOutsideOpen(true);
					}}
				>
					Меню в заданной снаружи точке (правый клик)
				</Button>
				<ContextMenu.Content aria-label='Меню снаружи'>
					<MenuItems log={setLast}/>
				</ContextMenu.Content>
			</ContextMenu.Root>

			<p>
				Последняя команда: <output data-menu-log>{last()}</output>
			</p>
		</div>
	);
}
```

- [ ] **Step 2: Проверки**

Создать `playground/src/context-menu-checks.ts`:

```ts
import { blend, contrastRatio, type Rgb } from '../../src/utils/color-math';

import { type CheckResult, resolveColor, type Rgba } from './theme-checks';

function rgb([red, green, blue]: Rgba): Rgb {
	return [red, green, blue];
}

async function frames(count = 3): Promise<void> {
	for (let index = 0; index < count; index++) {
		await new Promise<void>((resolve) => {
			requestAnimationFrame(() => {
				resolve();
			});
		});
	}
}

function required(root: ParentNode, selector: string): HTMLElement {
	const found = root.querySelector<HTMLElement>(selector);
	if (!found) {
		throw new Error(`Playground element is missing: ${selector}`);
	}
	return found;
}

function openAt(area: HTMLElement, x: number, y: number): void {
	area.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: x, clientY: y }));
}

function closeWithEscape(): void {
	document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
}

/**
 * Открывает меню областью «basic» (событие `contextmenu` с координатами) и проверяет измеримое: позицию в точке клика и
 * удержание во вьюпорте у четырёх краёв, роли, контраст текста (в том числе `danger`) и материала на чёрной и белой подложке,
 * закрытие при прокрутке. Настоящие клавиши, Esc в диалоге и внутреннее кольцо фокуса проверяются вручную.
 */
export async function runContextMenuChecks(page: HTMLElement): Promise<CheckResult[]> {
	const results: CheckResult[] = [];
	const check = (name: string, ok: boolean, detail: string): void => {
		results.push({ name, ok, detail });
	};
	const area = required(page, '[data-menu-area="basic"]');

	openAt(area, 200, 200);
	await frames();
	const menu = required(document, '[data-menu-content="basic"]');
	try {
		const rect = menu.getBoundingClientRect();
		check(
			'ContextMenu: меню появляется у точки клика',
			Math.abs(rect.left - 200) <= 1 && Math.abs(rect.top - 202) <= 1,
			`угол меню (${rect.left.toFixed(0)}, ${rect.top.toFixed(0)}), точка (200, 200) плюс зазор 2 px`
		);
		check(
			'ContextMenu: роли меню и пунктов',
			menu.getAttribute('role') === 'menu' && menu.querySelectorAll('[role="menuitem"]').length >= 6 && menu.querySelector('[role="separator"]') !== null,
			`пунктов ${menu.querySelectorAll('[role="menuitem"]').length}`
		);
		check(
			'ContextMenu: меню в top layer',
			menu.matches(':popover-open'),
			`popover-open = ${String(menu.matches(':popover-open'))}`
		);

		const surface = getComputedStyle(menu);
		const fill = resolveColor(surface.backgroundColor);
		for (const [name, element] of [
			['пункта', required(menu, '[data-menu-item="rename"]')],
			['пункта danger', required(menu, '[data-menu-item="delete"]')]
		] as const) {
			const text = rgb(resolveColor(getComputedStyle(element).color));
			const worst = Math.min(
				...([
					[0, 0, 0],
					[255, 255, 255]
				] as const).map((backdrop) => contrastRatio(text, blend(rgb(fill), fill[3] / 255, backdrop)))
			);
			check(`ContextMenu: контраст текста ${name} на любом фоне под меню (4.5:1)`, worst >= 4.5, `минимум ${worst.toFixed(2)}:1`);
		}

		const longItem = [...menu.querySelectorAll<HTMLElement>('[role="menuitem"]')].find((item) => item.textContent.startsWith('Очень длинное'));
		const label = longItem?.querySelector<HTMLElement>('[data-s-kit-menu-label]');
		check(
			'ContextMenu: длинный пункт обрезан многоточием, меню не шире максимума',
			label !== undefined && label !== null && label.scrollWidth > label.clientWidth && rect.width <= 321,
			`ширина меню ${rect.width.toFixed(0)} px, подпись ${label?.scrollWidth ?? 0} > ${label?.clientWidth ?? 0}`
		);
	}
	finally {
		closeWithEscape();
		await frames();
	}

	const edges: ReadonlyArray<readonly [string, number, number]> = [
		['левый верхний угол', 2, 2],
		['правый верхний угол', window.innerWidth - 2, 2],
		['левый нижний угол', 2, window.innerHeight - 2],
		['правый нижний угол', window.innerWidth - 2, window.innerHeight - 2]
	];
	for (const [name, x, y] of edges) {
		openAt(area, x, y);
		await frames();
		const edgeMenu = required(document, '[data-menu-content="basic"]');
		const box = edgeMenu.getBoundingClientRect();
		check(
			`ContextMenu: клик у края (${name}) не выводит меню за вьюпорт`,
			box.left >= 0 && box.top >= 0 && box.right <= window.innerWidth && box.bottom <= window.innerHeight,
			`меню (${box.left.toFixed(0)}, ${box.top.toFixed(0)}) – (${box.right.toFixed(0)}, ${box.bottom.toFixed(0)}), окно ${window.innerWidth}×${window.innerHeight}`
		);
		closeWithEscape();
		await frames();
	}

	openAt(area, 200, 200);
	await frames();
	document.dispatchEvent(new Event('scroll'));
	await frames();
	check('ContextMenu: прокрутка страницы закрывает меню', document.querySelector('[data-menu-content="basic"]') === null, 'меню удалено');

	return results;
}
```

- [ ] **Step 3: Страница**

В `playground/src/panels-page.tsx`:
- импорты: добавить `import { runContextMenuChecks } from './context-menu-checks';` и `import { DemoContextMenus } from './demo-context-menus';` (в алфавитном порядке с имеющимися);
- `runChecks` заменить на:

```tsx
	const runChecks = (): void => {
		if (page) {
			const root = page;
			void Promise.all([runDialogChecks(root), runContextMenuChecks(root)]).then(([dialog, menu]) => {
				setResults([...dialog, ...menu]);
			});
		}
	};
```

Проверки выполняются параллельно только по вызову, но используют разные оверлеи: чтобы не мешали друг другу, заменить `Promise.all` на последовательное выполнение:

```tsx
	const runChecks = (): void => {
		if (page) {
			const root = page;
			void (async () => {
				const dialog = await runDialogChecks(root);
				const menu = await runContextMenuChecks(root);
				setResults([...dialog, ...menu]);
			})();
		}
	};
```

(использовать вторую форму);
- комментарий над компонентом: `Сейчас: Dialog и ContextMenu.`;
- после секции `1. Dialog` вставить:

```tsx
			<section>
				<h2>2. ContextMenu</h2>
				<p>
					Ручная приёмка настоящими клавишами: правый клик открывает меню в точке; Shift+F10 на кнопке внутри области открывает у кнопки,
					фокус на первом пункте; стрелки, Home, End, Enter, Space; ArrowRight и ArrowLeft в подменю; Esc закрывает по уровню;
					в диалоге Esc три раза закрывает подменю, меню и диалог.
				</p>
				<DemoContextMenus/>
			</section>
```

- заголовок секции проверок `2. Проверки` заменить на `3. Проверки`.

В `playground/src/playground.css` после `.dialog-demos` добавить:

```css
.menu-demos {
    display: flex;
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
}

.menu-area {
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;

    box-sizing: border-box;
    inline-size: min(100%, 480px);
    padding: 24px;
    border: 1px dashed var(--s-kit-color-border);
    border-radius: var(--s-kit-radius);
}
```

- [ ] **Step 4: Проверка и коммит**

Run: `pnpm exec stylelint --fix playground/src/playground.css && pnpm check` — зелёный.

```bash
git add -A && git commit -m "feat(playground): страница «Панели»: демонстрации и проверки ContextMenu" -m "$TRAILERS"
```

---

### Task 6: Проверка в Chrome и итоги части 3

- [ ] **Step 1: Запуск и автоматические проверки**

`pnpm dev` (в фоне; порт из вывода Vite; `env -u ...proxy`), страница `#panels`. «Запустить проверки» в системной, светлой и тёмной темах: все строки OK (Dialog 11 + ContextMenu 11).

- [ ] **Step 2: Ручная приёмка настоящими нажатиями (Chrome)**

Правый клик в области: меню у точки; правый клик у каждого из четырёх краёв окна: меню во вьюпорте. Shift+F10 на кнопке внутри области: меню у нижнего левого угла кнопки, фокус на первом пункте, внутреннее кольцо видно целиком у верхнего и нижнего пункта (zoom-скриншот). Стрелки, Home, End; недоступный пропускается; Enter и Space на пункте закрывают меню и пишут команду в журнал; «Отметить, не закрывая» не закрывает. ArrowRight открывает подменю, ArrowLeft закрывает, фокус на «Переместить в»; наведение открывает подменю через ~120 мс; уход на другой пункт закрывает. Esc: подменю, затем меню, фокус на кнопке. Клик вне закрывает оба уровня одним кликом. Tab закрывает. Диалог с меню: Esc ×3 закрывает подменю, меню, диалог (панель лежит внутри `<dialog>`, видна). Меню в заданной снаружи точке открывается там же. Колесо над страницей закрывает меню. Длинный пункт с многоточием и `title`.

- [ ] **Step 3: Полная проверка и матрица**

`pnpm check` и `scripts/verify-package-form.sh HEAD` (без прокси): 28 строк OK, TypeScript 5.9.3 и 7.0.2 зелёные (ContextMenu попадает в проверку типов через `exports`). Остановить dev-сервер по PID (cwd `playground`), закрыть вкладку.

- [ ] **Step 4: Итоги в спеке и README**

В `docs/superpowers/specs/2026-10-29-stage-2-overlays-design.md` добавить `## 14. Итоги части 3: ContextMenu (<дата>)` только с измеренными фактами: число тестов (373 → N), проверки страницы по темам, результаты ручной приёмки, матрица, отклонения от плана, непроверенное (Firefox и Safari, длинное нажатие, поведение клавиши ContextMenu на других платформах, поведение `contextmenu` после клавиши в Firefox). В `README.md` строку статуса сменить на «готовы Popover, Dialog и ContextMenu».

- [ ] **Step 5: Коммит**

```bash
git add -A && git commit -m "docs: итоги части 3 этапа 2 (ContextMenu)" -m "$TRAILERS"
```
