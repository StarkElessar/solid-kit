# solid-kit, этап 2, часть 2: Dialog — план реализации

> **Для исполнителей:** ОБЯЗАТЕЛЬНЫЙ суб-скил: superpowers:executing-plans (или subagent-driven-development). Шаги отмечены чекбоксами (`- [ ]`).

**Цель:** публичный compound-компонент `Dialog` на нативном `<dialog>` и `showModal()` (`Dialog.Root` / `Trigger` / `Content` / `Title` / `Description` / `Body` / `Footer` / `Close`, хук `useDialog`) с маршрутизацией Esc через стек слоёв, закрытием по подложке, блокировкой прокрутки страницы под диалогом и хостом панелей внутри диалога. Dialog заменяет тестовый стенд `probe-unused` в матрице формы пакета. В playground появляется страница «Панели» с демонстрациями и проверками Dialog (дальше её наращивают части 3 и 4).

**Архитектура:** `Dialog.Content` рендерит `<dialog>` в `PanelPortal` только пока `open()`; хук `createDialogLayer` вызывает `showModal()` и регистрирует слой стека с `modal: true` (Esc обрабатывает стек, клик снаружи модальный слой не закрывает). Диалог задаёт `PanelHostContext` своим `<dialog>`, поэтому Popover и ContextMenu внутри него монтируются в него. События диалога изолированы так же, как у панелей (`isolationHandlers`), Enter в поле при внешней форме блокируется (`blocksImplicitSubmit`). Закрытие по подложке: пара `pointerdown` и `click` вне прямоугольника `<dialog>` (чистая функция `isOutsideRect`). Фокус при закрытии возвращается на инициатор (`createFocusRestore`).

**Стек:** как в этапах 0 и 1 и части 1 (Solid 1.9.17, Vite 8, Vitest 5, jsdom 30).

**Спеки:** `docs/superpowers/specs/2026-10-29-stage-2-overlays-design.md` (основной; разделы 3, 5, 7, 8, 10, 12), `docs/superpowers/specs/2026-10-28-solid-kit-umbrella-design.md` (разделы 5.1, 8, 11, 11.1, 12). Опирается на результат части 1: `FloatingPanel`-основу (`src/internal/`), `Popover`, стек слоёв с `modal`.

## Global Constraints

- Репозиторий публичный: ни ключей, ни токенов, ни `.env*` в коммитах. Не делать `git push`, не ставить теги в этом плане (тег `v0.3.0` ставится после части 4), не добавлять `LICENSE`, не менять git-идентичность, не переписывать историю (никаких `--amend`/`rebase`).
- Один класс — один файл; kebab-case; именованные экспорты; пропсы не деструктурируются (`splitProps`/`mergeProps`). Один компонент на файл. Интерфейсы контекста и состояния в отдельных файлах. Чистые функции отдельными `.ts`.
- `exactOptionalPropertyTypes: true`: необязательные свойства в публичных пропсах пишутся `foo?: T | undefined`.
- Ошибки контекста: `${part} must be used inside Dialog.Root`; строка `must be used inside Dialog.Root` служит маркером «неимпортированный компонент не попал в бандл» в матрице (заменяет `marker-unused`).
- В CSS компонентов: только токены, без литералов цветов, без `outline: none/0`, без голого `var(--s-kit-control-height)`; `composes ... from "...";` с двойными кавычками, база через `:where()`.
- Стиль: ESLint (табы, одинарные кавычки, без висячих запятых, Stroustrup, max-len 140 с табами по 4, `solid/reactivity` как ошибка: в тестах сигналы не читать, использовать `vi.fn`; свойства `props.*` читать только в JSX, `createEffect` или обработчиках, а передаваемые в хуки аксессоры оборачивать в стрелки `() => local.x()`), Stylelint (4 пробела, двойные кавычки, порядок свойств; `pnpm exec stylelint --fix <файл>`). Перед каждым коммитом `pnpm check` зелёный.
- Если `pnpm` ходит в реестр через медленный прокси (зависание), запускать так: `env -u HTTPS_PROXY -u HTTP_PROXY -u https_proxy -u http_proxy pnpm ...`.
- Коммиты оканчиваются трейлерами: `export TRAILERS=$'Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_017cEinKKFDiYmGrLaaKPqZu'`, затем `git commit -m "msg" -m "$TRAILERS"`.
- Dev-серверы убивать только по PID после проверки cwd (`lsof -a -p <PID> -d cwd -Fn`), никогда `pkill`. Порт брать из вывода Vite.
- Браузерные проверки в Chrome (инструкции из части 1 остаются: скриншоты 1505 px, пересчёт координат делением на `innerWidth / 1505`, `scrollIntoView({behavior:'instant'})` до скриншота, после смены темы ждать 1,5–2 с, при `[BLOCKED: Cookie/query string data]` повторить коротким строковым результатом). Нажатия Esc в проверках делать настоящими (`computer key Escape`), синтетические события не заменяют их. Firefox и Safari не проверяются.
- Тесты, которым нужны Popover API и `<dialog>`, подменяют их в `beforeEach`: Popover API как в части 1 (`showPopover` снимает атрибут `popover`, иначе jsdom считает содержимое нефокусируемым), а диалог через помощник `stubDialogApi()` из Task 1 (jsdom не реализует `showModal`, `close` и событие `close`).
- Начало плана: `git status` чистый, `pnpm check` зелёный (записать число тестов: база для итогов; после части 1 их 339).

---

### Task 1: Чистая функция подложки, помощник тестов диалога, правило Stylelint

**Files:**
- Create: `src/components/dialog/is-outside-rect.ts`, `src/components/dialog/is-outside-rect.test.ts`
- Create: `src/internal/testing/stub-dialog-api.ts`
- Modify: `stylelint.config.js`, `src/styles/stylelint-rules.test.ts`

**Interfaces:**
- Produces: `isOutsideRect(rect: Pick<DOMRect, 'left' | 'right' | 'top' | 'bottom'>, x: number, y: number): boolean`; `stubDialogApi(): { restore, flush }` (подмена `HTMLDialogElement.prototype.showModal/close`; событие `close` доставляется только по `flush()`); `:global()` разрешён в CSS-модулях компонентов.

- [ ] **Step 1: Падающий тест чистой функции**

Создать `src/components/dialog/is-outside-rect.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import { isOutsideRect } from './is-outside-rect';

const RECT = { left: 100, right: 300, top: 50, bottom: 250 };

describe('isOutsideRect', () => {
	it('is false for points inside and on the edges', () => {
		expect(isOutsideRect(RECT, 200, 150)).toBe(false);
		expect(isOutsideRect(RECT, 100, 50)).toBe(false);
		expect(isOutsideRect(RECT, 300, 250)).toBe(false);
	});

	it('is true for a point beyond any edge', () => {
		expect(isOutsideRect(RECT, 99, 150)).toBe(true);
		expect(isOutsideRect(RECT, 301, 150)).toBe(true);
		expect(isOutsideRect(RECT, 200, 49)).toBe(true);
		expect(isOutsideRect(RECT, 200, 251)).toBe(true);
	});
});
```

Run: `pnpm exec vitest run src/components/dialog/is-outside-rect.test.ts`
Expected: FAIL (модуля нет).

- [ ] **Step 2: Реализовать**

Создать `src/components/dialog/is-outside-rect.ts`:

```ts
/** Лежит ли точка вне прямоугольника (по границе точка считается внутри). Нужна для клика по подложке диалога. */
export function isOutsideRect(rect: Pick<DOMRect, 'left' | 'right' | 'top' | 'bottom'>, x: number, y: number): boolean {
	return x < rect.left || x > rect.right || y < rect.top || y > rect.bottom;
}
```

- [ ] **Step 3: Помощник тестов диалога**

Создать `src/internal/testing/stub-dialog-api.ts`:

```ts
import { vi } from 'vitest';

export interface DialogApiStub {
	/** Возвращает прототип в исходное состояние и сбрасывает очередь событий. */
	restore: () => void;
	/** Доставляет накопленные события `close`: браузер шлёт их отдельной задачей позже вызова `close()`. */
	flush: () => void;
}

/**
 * Тестовый адаптер диалога: в jsdom нет `showModal`, `close` и событий диалога. `showModal` выставляет атрибут `open`
 * (у отсоединённого элемента и у уже открытого бросает `InvalidStateError`, как браузер), `close` убирает его и ставит событие
 * `close` в очередь: доставка отложена до `flush()`, как в браузере, иначе тесты не заметят гонок с повторным открытием.
 */
export function stubDialogApi(): DialogApiStub {
	const prototype = HTMLDialogElement.prototype;
	const original = { showModal: prototype.showModal, close: prototype.close };
	let queue: HTMLDialogElement[] = [];

	prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
		if (!this.isConnected || this.hasAttribute('open')) {
			throw new DOMException('The dialog cannot be shown modally', 'InvalidStateError');
		}
		this.setAttribute('open', '');
	});
	prototype.close = vi.fn(function (this: HTMLDialogElement) {
		if (!this.hasAttribute('open')) {
			return;
		}
		this.removeAttribute('open');
		queue.push(this);
	});

	return {
		restore: () => {
			prototype.showModal = original.showModal;
			prototype.close = original.close;
			queue = [];
		},
		flush: () => {
			const pending = queue;
			queue = [];
			for (const dialog of pending) {
				dialog.dispatchEvent(new Event('close'));
			}
		}
	};
}
```

- [ ] **Step 4: Правило Stylelint для `:global()`**

Скролл страницы блокируется правилом `:global(html):has(.dialog:modal)`, а `selector-pseudo-class-no-unknown` без исключения считает `:global` ошибкой. В `stylelint.config.js` в объект `rules` добавить (рядом с `property-no-unknown`):

```js
		// :global() это ключевое слово CSS Modules (правило скролла страницы под диалогом)
		'selector-pseudo-class-no-unknown': [true, { ignorePseudoClasses: ['global'] }],
```

В `src/styles/stylelint-rules.test.ts` добавить тест (по образцу соседних, используя `COMPONENT_FILE`):

```ts
	it('allows :global() in component CSS modules', async () => {
		const code = ':global(html):has(.a) {\n    overflow: hidden;\n}\n';
		expect(await lint(code, COMPONENT_FILE)).not.toContain('selector-pseudo-class-no-unknown');
	});
```

- [ ] **Step 5: Запуск и коммит**

Run: `pnpm exec vitest run src/components/dialog src/styles && pnpm typecheck && pnpm exec eslint src --max-warnings 0`
Expected: PASS.

```bash
git add src/components/dialog src/internal/testing stylelint.config.js src/styles/stylelint-rules.test.ts
git commit -m "feat(dialog): isOutsideRect, адаптер диалога для тестов, :global() в Stylelint" -m "$TRAILERS"
```

---

### Task 2: Слой диалога, корень, инициатор, содержимое

**Files:**
- Create: `src/components/dialog/dialog-state.ts`, `dialog-context.ts`, `use-dialog.ts`, `create-dialog-layer.ts`
- Create: `src/components/dialog/dialog-root.tsx`, `dialog-trigger.tsx`, `dialog-content.tsx`
- Create: `src/components/dialog/dialog.module.css`, `index.ts` (частичный: Root, Trigger, Content, `useDialog`; остальные части добавляет Task 3)
- Modify: `src/internal/floating-panel/panel-isolation.ts` (тип `HTMLElement` вместо `HTMLDivElement`), `src/components/popover/popover-trigger.tsx` (принадлежность якоря, Step 10), `src/components/popover/popover.test.tsx`
- Test: `src/components/dialog/dialog.test.tsx`

**Interfaces:**
- Consumes: `registerLayer` (`Layer.modal`) из `../../utils/layer-stack`; `PanelPortal`, `PanelHostContext` из `../../internal/panel/*`; `createFocusRestore`, `blocksImplicitSubmit`, `isolationHandlers` из `../../internal/floating-panel/*`; `renderChildren`; `Button`, `ButtonProps`; `createControllableSignal`; `isOutsideRect`.
- Produces: `Dialog = { Root, Trigger, Content }` (Task 3 добавляет остальные), `useDialog(): DialogState`; типы `DialogRootProps`, `DialogTriggerProps`, `DialogTriggerAttributes`, `DialogContentProps`, `DialogState`; `DialogContextValue` с полями `titleId`/`setTitleId`/`descriptionId`/`setDescriptionId` (их читает Content, заполняют Title и Description в Task 3); публичный путь `@stark/solid-kit/dialog`; токены `--s-kit-dialog-bg`, `-width`, `-padding`, `-radius`, `-backdrop`; атрибут `data-s-kit-dialog` на `<dialog>`.

- [ ] **Step 1: Падающие тесты**

Создать `src/components/dialog/dialog.test.tsx`:

```tsx
import { cleanup, createEvent, fireEvent, render, screen } from '@solidjs/testing-library';
import { createSignal } from 'solid-js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { stubDialogApi } from '../../internal/testing/stub-dialog-api';
import { Popover } from '../popover';

import { Dialog, useDialog } from './index';

let dialogApi = stubDialogApi();

beforeEach(() => {
	dialogApi = stubDialogApi();
	// jsdom не реализует Popover API и считает содержимое закрытого [popover] нефокусируемым: «показ» снимает атрибут
	HTMLElement.prototype.showPopover = vi.fn(function (this: HTMLElement) {
		this.removeAttribute('popover');
	});
	HTMLElement.prototype.hidePopover = vi.fn();
});

afterEach(() => {
	cleanup();
	dialogApi.restore();
});

function CloseFromHook() {
	const dialog = useDialog();
	return <button type='button' onClick={dialog.close}>close-hook</button>;
}

function getDialog(): HTMLDialogElement {
	const dialog = document.querySelector('dialog');
	if (!dialog) {
		throw new Error('dialog is not rendered');
	}
	return dialog;
}

/** Событие мыши с координатами и именем нужного типа: PointerEvent может отсутствовать в jsdom, а `fireEvent` тогда теряет `clientX`. */
function press(target: Element, type: 'pointerdown' | 'click', clientX: number, clientY: number): void {
	target.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, clientX, clientY }));
}

const DIALOG_RECT = { left: 100, right: 300, top: 100, bottom: 300 } as DOMRect;

describe('Dialog', () => {
	it('is closed by default, opens on the trigger click as a modal dialog and wires the trigger attributes', () => {
		render(() => (
			<Dialog.Root>
				<Dialog.Trigger>Open</Dialog.Trigger>
				<Dialog.Content>content</Dialog.Content>
			</Dialog.Root>
		));
		const trigger = screen.getByRole('button', { name: 'Open' });
		expect(document.querySelector('dialog')).toBeNull();
		expect(trigger.getAttribute('aria-expanded')).toBe('false');
		expect(trigger.getAttribute('aria-haspopup')).toBe('dialog');
		fireEvent.click(trigger);
		const dialog = getDialog();
		expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalledOnce();
		expect(dialog.hasAttribute('open')).toBe(true);
		expect(trigger.getAttribute('aria-expanded')).toBe('true');
		expect(trigger.getAttribute('aria-controls')).toBe(dialog.id);
		expect(trigger.hasAttribute('data-dialog-open')).toBe(true);
	});

	it('controlled: the trigger click only reports the change, the prop decides', () => {
		const onOpenChange = vi.fn();
		render(() => (
			<Dialog.Root open={false} onOpenChange={onOpenChange}>
				<Dialog.Trigger>Open</Dialog.Trigger>
				<Dialog.Content>content</Dialog.Content>
			</Dialog.Root>
		));
		fireEvent.click(screen.getByRole('button', { name: 'Open' }));
		expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(true);
		expect(document.querySelector('dialog')).toBeNull();
	});

	it('defaultOpen starts open and closes the dialog element when the state becomes false', () => {
		render(() => (
			<Dialog.Root defaultOpen>
				<Dialog.Trigger>Open</Dialog.Trigger>
				<Dialog.Content>content</Dialog.Content>
			</Dialog.Root>
		));
		const dialog = getDialog();
		expect(dialog.hasAttribute('open')).toBe(true);
		fireEvent.keyDown(document.body, { key: 'Escape' });
		expect(document.querySelector('dialog')).toBeNull();
		expect(HTMLDialogElement.prototype.close).toHaveBeenCalled();
	});

	it('Escape goes through the layer stack: onOpenChange(false) exactly once and the default action is cancelled', () => {
		const onOpenChange = vi.fn();
		render(() => (
			<Dialog.Root defaultOpen onOpenChange={onOpenChange}>
				<Dialog.Content>content</Dialog.Content>
			</Dialog.Root>
		));
		const event = createEvent.keyDown(document.body, { key: 'Escape' });
		fireEvent(document.body, event);
		expect(event.defaultPrevented).toBe(true);
		expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
		expect(document.querySelector('dialog')).toBeNull();
	});

	it('closeOnEscape={false}: Escape does not close the dialog but its default action is still cancelled', () => {
		const onOpenChange = vi.fn();
		render(() => (
			<Dialog.Root defaultOpen closeOnEscape={false} onOpenChange={onOpenChange}>
				<Dialog.Content>content</Dialog.Content>
			</Dialog.Root>
		));
		const event = createEvent.keyDown(document.body, { key: 'Escape' });
		fireEvent(document.body, event);
		expect(event.defaultPrevented).toBe(true);
		expect(onOpenChange).not.toHaveBeenCalled();
		expect(getDialog().hasAttribute('open')).toBe(true);
	});

	it('the cancel event of the dialog is always cancelled', () => {
		render(() => (
			<Dialog.Root defaultOpen>
				<Dialog.Content>content</Dialog.Content>
			</Dialog.Root>
		));
		const cancel = new Event('cancel', { cancelable: true });
		getDialog().dispatchEvent(cancel);
		expect(cancel.defaultPrevented).toBe(true);
		expect(getDialog().hasAttribute('open')).toBe(true);
	});

	it('a close event from another source (form method=dialog) is synced: onOpenChange(false) once, the dialog unmounts', () => {
		const onOpenChange = vi.fn();
		render(() => (
			<Dialog.Root defaultOpen onOpenChange={onOpenChange}>
				<Dialog.Content>content</Dialog.Content>
			</Dialog.Root>
		));
		getDialog().close();
		dialogApi.flush();
		expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
		expect(document.querySelector('dialog')).toBeNull();
	});

	it('controlled: when the parent keeps open={true} after an external close, the dialog is opened again', () => {
		const onOpenChange = vi.fn();
		render(() => (
			<Dialog.Root open onOpenChange={onOpenChange}>
				<Dialog.Content>content</Dialog.Content>
			</Dialog.Root>
		));
		const dialog = getDialog();
		dialog.close();
		dialogApi.flush();
		expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
		expect(dialog.hasAttribute('open')).toBe(true);
		expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalledTimes(2);
	});

	it('a delayed close event of the previous dialog instance is ignored after a quick reopen', () => {
		const onOpenChange = vi.fn();
		const [open, setOpen] = createSignal(true);
		render(() => (
			<Dialog.Root open={open()} onOpenChange={onOpenChange}>
				<Dialog.Content>content</Dialog.Content>
			</Dialog.Root>
		));
		setOpen(false);
		setOpen(true);
		dialogApi.flush();
		expect(onOpenChange).not.toHaveBeenCalled();
		expect(getDialog().hasAttribute('open')).toBe(true);
	});

	it('unmounting an open controlled dialog neither reopens the detached element nor reports a change', () => {
		const onOpenChange = vi.fn();
		render(() => (
			<Dialog.Root open onOpenChange={onOpenChange}>
				<Dialog.Content>content</Dialog.Content>
			</Dialog.Root>
		));
		cleanup();
		expect(() => {
			dialogApi.flush();
		}).not.toThrow();
		expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalledOnce();
		expect(onOpenChange).not.toHaveBeenCalled();
	});

	it('controlled: the dialog element is closed when the parent sets open to false, without a second onOpenChange', () => {
		const onOpenChange = vi.fn();
		const [open, setOpen] = createSignal(true);
		render(() => (
			<Dialog.Root open={open()} onOpenChange={onOpenChange}>
				<Dialog.Content>content</Dialog.Content>
			</Dialog.Root>
		));
		setOpen(false);
		expect(document.querySelector('dialog')).toBeNull();
		expect(HTMLDialogElement.prototype.close).toHaveBeenCalled();
		expect(onOpenChange).not.toHaveBeenCalled();
	});

	it('a click on the backdrop closes the dialog; a click inside, or a selection ending over the backdrop, does not', () => {
		render(() => (
			<Dialog.Root defaultOpen>
				<Dialog.Content>
					<button type='button'>inside</button>
				</Dialog.Content>
			</Dialog.Root>
		));
		const dialog = getDialog();
		vi.spyOn(dialog, 'getBoundingClientRect').mockReturnValue(DIALOG_RECT);
		const inside = screen.getByRole('button', { name: 'inside' });

		press(inside, 'pointerdown', 150, 150);
		press(inside, 'click', 150, 150);
		expect(document.querySelector('dialog')).not.toBeNull();

		// выделение: нажатие внутри, отпускание над подложкой
		press(inside, 'pointerdown', 150, 150);
		press(dialog, 'click', 20, 20);
		expect(document.querySelector('dialog')).not.toBeNull();

		// клик по отступу самого диалога (цель `<dialog>`, но точка внутри прямоугольника)
		press(dialog, 'pointerdown', 150, 150);
		press(dialog, 'click', 150, 150);
		expect(document.querySelector('dialog')).not.toBeNull();

		press(dialog, 'pointerdown', 20, 20);
		press(dialog, 'click', 20, 20);
		expect(document.querySelector('dialog')).toBeNull();
	});

	it('closeOnBackdropClick={false}: a click on the backdrop keeps the dialog open', () => {
		render(() => (
			<Dialog.Root defaultOpen closeOnBackdropClick={false}>
				<Dialog.Content>content</Dialog.Content>
			</Dialog.Root>
		));
		const dialog = getDialog();
		vi.spyOn(dialog, 'getBoundingClientRect').mockReturnValue(DIALOG_RECT);
		press(dialog, 'pointerdown', 20, 20);
		press(dialog, 'click', 20, 20);
		expect(document.querySelector('dialog')).not.toBeNull();
	});

	it('puts data-s-kit, the content marker, size, class, style and attributes on the dialog and calls ref and onKeyDown', () => {
		const onRef = vi.fn();
		const onKeyDown = vi.fn();
		render(() => (
			<Dialog.Root defaultOpen>
				<Dialog.Content size='lg' class='extra' style={{ color: 'red' }} aria-label='Диалог' ref={onRef} onKeyDown={onKeyDown}>
					<button type='button'>inside</button>
				</Dialog.Content>
			</Dialog.Root>
		));
		const dialog = getDialog();
		expect(dialog.hasAttribute('data-s-kit')).toBe(true);
		expect(dialog.hasAttribute('data-s-kit-dialog')).toBe(true);
		expect(dialog.getAttribute('data-s-kit-size')).toBe('lg');
		expect(dialog.className).toContain('extra');
		expect(dialog.style.color).toBe('red');
		expect(dialog.getAttribute('aria-label')).toBe('Диалог');
		expect(onRef).toHaveBeenCalledExactlyOnceWith(dialog);
		fireEvent.keyDown(screen.getByRole('button', { name: 'inside' }), { key: 'a' });
		expect(onKeyDown).toHaveBeenCalledOnce();
	});

	it('a function child receives the state, and useDialog works anywhere inside', () => {
		render(() => (
			<Dialog.Root defaultOpen>
				<Dialog.Content>
					{(state) => (
						<>
							<button type='button' onClick={state.close}>close-state</button>
							<CloseFromHook/>
						</>
					)}
				</Dialog.Content>
			</Dialog.Root>
		));
		fireEvent.click(screen.getByRole('button', { name: 'close-hook' }));
		expect(document.querySelector('dialog')).toBeNull();
	});

	it('a custom trigger through render receives the attributes, a user onClick may cancel the toggle, ref is kept', () => {
		const onRef = vi.fn();
		render(() => (
			<Dialog.Root>
				<Dialog.Trigger render={(attributes) => <span {...attributes} data-testid='custom' role='button'>custom</span>}/>
				<Dialog.Trigger
					ref={onRef}
					onClick={(event) => {
						event.preventDefault();
					}}
				>
					Blocked
				</Dialog.Trigger>
				<Dialog.Content>content</Dialog.Content>
			</Dialog.Root>
		));
		fireEvent.click(screen.getByRole('button', { name: 'Blocked' }));
		expect(document.querySelector('dialog')).toBeNull();
		expect(onRef).toHaveBeenCalledOnce();
		fireEvent.click(screen.getByTestId('custom'));
		expect(document.querySelector('dialog')).not.toBeNull();
	});

	it('with two triggers the dialog opens in the host of the one that was pressed, and the focus returns to it', () => {
		render(() => (
			<Dialog.Root>
				<section data-testid='host-a'>
					<Dialog.Trigger>Open A</Dialog.Trigger>
				</section>
				<section data-testid='host-b'>
					<Dialog.Trigger>Open B</Dialog.Trigger>
				</section>
				<Dialog.Content>
					<button type='button'>inside</button>
				</Dialog.Content>
			</Dialog.Root>
		));
		const triggerA = screen.getByRole('button', { name: 'Open A' });
		triggerA.focus();
		fireEvent.click(triggerA);
		expect(screen.getByTestId('host-a').contains(getDialog())).toBe(true);
		expect(screen.getByTestId('host-b').contains(getDialog())).toBe(false);
		screen.getByRole('button', { name: 'inside' }).focus();
		fireEvent.keyDown(document.body, { key: 'Escape' });
		expect(document.activeElement).toBe(triggerA);
	});

	it('mounts the dialog next to the trigger, not inside a label around it', () => {
		render(() => (
			<section data-testid='host'>
				<label data-testid='label'>
					<Dialog.Root defaultOpen>
						<Dialog.Trigger>Open</Dialog.Trigger>
						<Dialog.Content>content</Dialog.Content>
					</Dialog.Root>
				</label>
			</section>
		));
		expect(screen.getByTestId('label').contains(getDialog())).toBe(false);
		expect(screen.getByTestId('host').contains(getDialog())).toBe(true);
	});

	it('events inside the dialog do not reach the handlers of logical ancestors', () => {
		const onCardClick = vi.fn();
		const onCardKeyDown = vi.fn();
		render(() => (
			<div onClick={onCardClick} onKeyDown={onCardKeyDown}>
				<Dialog.Root defaultOpen>
					<Dialog.Trigger>Open</Dialog.Trigger>
					<Dialog.Content>
						<button type='button'>inside</button>
					</Dialog.Content>
				</Dialog.Root>
			</div>
		));
		fireEvent.click(screen.getByRole('button', { name: 'inside' }));
		fireEvent.keyDown(screen.getByRole('button', { name: 'inside' }), { key: 'a' });
		expect(onCardClick).not.toHaveBeenCalled();
		expect(onCardKeyDown).not.toHaveBeenCalled();
	});

	it('cancels Enter in an input whose form is outside the dialog, so that the host form is not submitted', () => {
		render(() => (
			<form>
				<Dialog.Root defaultOpen>
					<Dialog.Trigger>Open</Dialog.Trigger>
					<Dialog.Content>
						<input aria-label='name'/>
					</Dialog.Content>
				</Dialog.Root>
			</form>
		));
		const event = createEvent.keyDown(screen.getByLabelText('name'), { key: 'Enter' });
		fireEvent(screen.getByLabelText('name'), event);
		expect(event.defaultPrevented).toBe(true);
	});

	it('returns the focus to the trigger when the dialog closes', () => {
		render(() => (
			<Dialog.Root>
				<Dialog.Trigger>Open</Dialog.Trigger>
				<Dialog.Content>
					<button type='button'>inside</button>
				</Dialog.Content>
			</Dialog.Root>
		));
		const trigger = screen.getByRole('button', { name: 'Open' });
		trigger.focus();
		fireEvent.click(trigger);
		screen.getByRole('button', { name: 'inside' }).focus();
		fireEvent.keyDown(document.body, { key: 'Escape' });
		expect(document.activeElement).toBe(trigger);
	});

	it('without a trigger, the focus returns to the element that was active before the dialog opened', () => {
		const [open, setOpen] = createSignal(false);
		render(() => (
			<>
				<button type='button'>outside</button>
				<Dialog.Root open={open()} onOpenChange={setOpen}>
					<Dialog.Content>
						<button type='button'>inside</button>
					</Dialog.Content>
				</Dialog.Root>
			</>
		));
		const outside = screen.getByRole('button', { name: 'outside' });
		outside.focus();
		setOpen(true);
		screen.getByRole('button', { name: 'inside' }).focus();
		setOpen(false);
		expect(document.activeElement).toBe(outside);
	});

	it('a Popover inside the dialog is mounted into the dialog; Escape closes the popover first and the dialog second', () => {
		const onOpenChange = vi.fn();
		render(() => (
			<Dialog.Root defaultOpen onOpenChange={onOpenChange}>
				<Dialog.Content>
					<Popover.Root>
						<Popover.Trigger>Panel</Popover.Trigger>
						<Popover.Content>
							<input aria-label='in-panel'/>
						</Popover.Content>
					</Popover.Root>
				</Dialog.Content>
			</Dialog.Root>
		));
		fireEvent.click(screen.getByRole('button', { name: 'Panel' }));
		expect(getDialog().contains(screen.getByLabelText('in-panel'))).toBe(true);

		fireEvent.keyDown(document.body, { key: 'Escape' });
		expect(screen.queryByLabelText('in-panel')).toBeNull();
		expect(document.querySelector('dialog')).not.toBeNull();
		expect(onOpenChange).not.toHaveBeenCalled();

		fireEvent.keyDown(document.body, { key: 'Escape' });
		expect(document.querySelector('dialog')).toBeNull();
		expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
	});

	it('a click inside the dialog outside the popover closes the popover but not the modal dialog', () => {
		render(() => (
			<Dialog.Root defaultOpen>
				<Dialog.Content>
					<button type='button'>inside</button>
					<Popover.Root defaultOpen>
						<Popover.Trigger>Panel</Popover.Trigger>
						<Popover.Content>
							<input aria-label='in-panel'/>
						</Popover.Content>
					</Popover.Root>
				</Dialog.Content>
			</Dialog.Root>
		));
		fireEvent.pointerDown(screen.getByRole('button', { name: 'inside' }));
		expect(screen.queryByLabelText('in-panel')).toBeNull();
		expect(document.querySelector('dialog')).not.toBeNull();
	});

	it('Dialog.Content and useDialog outside Dialog.Root throw a clear error', () => {
		const silence = vi.spyOn(console, 'error').mockImplementation(() => {});
		expect(() => render(() => <Dialog.Content>x</Dialog.Content>)).toThrow('Dialog.Content must be used inside Dialog.Root');
		expect(() => render(() => <CloseFromHook/>)).toThrow('useDialog must be used inside Dialog.Root');
		silence.mockRestore();
	});
});
```

Тест с `Dialog.Title`, `Description`, `Body`, `Footer`, `Close` добавляет Task 3.

Run: `pnpm exec vitest run src/components/dialog/dialog.test.tsx`
Expected: FAIL (модулей нет).

- [ ] **Step 2: Состояние, контекст, хук**

Создать `src/components/dialog/dialog-state.ts`:

```ts
import type { Accessor } from 'solid-js';

export interface DialogState {
	open: Accessor<boolean>;
	close: () => void;
}
```

Создать `src/components/dialog/dialog-context.ts`:

```ts
import { type Accessor, createContext, useContext } from 'solid-js';

export interface DialogContextValue {
	open: Accessor<boolean>;
	setOpen: (open: boolean) => void;
	/** Идентификатор `<dialog>`: инициатор ссылается на него через `aria-controls`. */
	contentId: string;
	/** Инициатор: хост диалога, возврат фокуса. */
	anchor: Accessor<HTMLElement | undefined>;
	setAnchor: (element: HTMLElement | undefined) => void;
	closeOnEscape: Accessor<boolean>;
	closeOnBackdropClick: Accessor<boolean>;
	/** Идентификаторы смонтированных Title и Description: из них строятся `aria-labelledby` и `aria-describedby`. */
	titleId: Accessor<string | undefined>;
	setTitleId: (id: string | undefined) => void;
	descriptionId: Accessor<string | undefined>;
	setDescriptionId: (id: string | undefined) => void;
}

export const DialogContext = createContext<DialogContextValue>();

export function useDialogContext(part: string): DialogContextValue {
	const context = useContext(DialogContext);
	if (!context) {
		throw new Error(`${part} must be used inside Dialog.Root`);
	}
	return context;
}
```

Создать `src/components/dialog/use-dialog.ts`:

```ts
import { useDialogContext } from './dialog-context';
import type { DialogState } from './dialog-state';

/** Состояние ближайшего `Dialog.Root`: для кнопок и разметки внутри содержимого. */
export function useDialog(): DialogState {
	const context = useDialogContext('useDialog');
	return {
		open: context.open,
		close: () => {
			context.setOpen(false);
		}
	};
}
```

- [ ] **Step 3: Слой диалога**

Создать `src/components/dialog/create-dialog-layer.ts`:

```ts
import { type Accessor, createEffect, onCleanup, untrack } from 'solid-js';

import { registerLayer } from '../../utils/layer-stack';

export interface DialogLayerOptions {
	dialog: Accessor<HTMLDialogElement | undefined>;
	open: Accessor<boolean>;
	/** Запрос закрытия от стека слоёв (Esc, когда диалог верхний слой). */
	onEscape: () => void;
}

/**
 * Показ диалога как модального (`showModal()`) и участие в стеке слоёв с `modal: true`: стек его по клику снаружи не закрывает,
 * а Esc перехватывает в фазе захвата раньше нативной отмены (раздел 5 спека этапа 2). При размонтировании закрывает элемент,
 * если он ещё открыт: DOM-диалог и состояние не расходятся.
 */
export function createDialogLayer(options: DialogLayerOptions): void {
	createEffect(() => {
		const dialog = options.dialog();
		if (!options.open() || !dialog) {
			return;
		}
		if (!dialog.open) {
			dialog.showModal();
		}
		const unregister = registerLayer({
			contains: (target) => dialog.contains(target),
			close: () => {
				untrack(options.onEscape);
			},
			modal: true
		});
		onCleanup(() => {
			unregister();
			if (dialog.open) {
				dialog.close();
			}
		});
	});
}
```

- [ ] **Step 3a: Тип `isolationHandlers` для любого элемента**

Изоляция из части 1 типизирована под `HTMLDivElement`, а `<dialog>` получает те же обработчики через spread. В `src/internal/floating-panel/panel-isolation.ts` заменить `Pick<JSX.HTMLAttributes<HTMLDivElement>, IsolatedEventProp>` на `Pick<JSX.HTMLAttributes<HTMLElement>, IsolatedEventProp>`: обработчик, принимающий `HTMLElement`, подходит и `div`, и `dialog`. `pnpm typecheck` на `FloatingPanel` (корень `div`) остаётся зелёным.

- [ ] **Step 4: Root**

Создать `src/components/dialog/dialog-root.tsx`:

```tsx
import { createSignal, createUniqueId, type JSX } from 'solid-js';

import { createControllableSignal } from '../../utils/create-controllable-signal';

import { DialogContext, type DialogContextValue } from './dialog-context';

export interface DialogRootProps {
	open?: boolean | undefined;
	defaultOpen?: boolean | undefined;
	onOpenChange?: ((open: boolean) => void) | undefined;
	/** По умолчанию `true`. */
	closeOnEscape?: boolean | undefined;
	/** По умолчанию `true`; диалогам с несохранёнными данными нужен `false`. */
	closeOnBackdropClick?: boolean | undefined;
	children?: JSX.Element;
}

export function DialogRoot(props: DialogRootProps): JSX.Element {
	const [open, setOpen] = createControllableSignal<boolean>({
		name: 'Dialog',
		value: () => props.open,
		defaultValue: () => props.defaultOpen ?? false,
		onChange: (next) => props.onOpenChange?.(next)
	});
	const [anchor, setAnchor] = createSignal<HTMLElement>();
	const [titleId, setTitleId] = createSignal<string>();
	const [descriptionId, setDescriptionId] = createSignal<string>();

	const context: DialogContextValue = {
		open,
		setOpen,
		contentId: `${createUniqueId()}-dialog`,
		anchor,
		setAnchor: (element) => {
			setAnchor(element);
		},
		closeOnEscape: () => props.closeOnEscape ?? true,
		closeOnBackdropClick: () => props.closeOnBackdropClick ?? true,
		titleId,
		setTitleId: (id) => {
			setTitleId(id);
		},
		descriptionId,
		setDescriptionId: (id) => {
			setDescriptionId(id);
		}
	};

	return <DialogContext.Provider value={context}>{props.children}</DialogContext.Provider>;
}
```

- [ ] **Step 5: Trigger**

Создать `src/components/dialog/dialog-trigger.tsx`:

```tsx
import { type JSX, onCleanup, Show, splitProps } from 'solid-js';

import { Button, type ButtonProps } from '../button/button';

import { useDialogContext } from './dialog-context';

/** Атрибуты, которые инициатор передаёт своему «рендеру»: их нужно повесить на корневой элемент пользовательского инициатора. */
export interface DialogTriggerAttributes {
	ref: (element: HTMLElement) => void;
	'aria-haspopup': 'dialog';
	'aria-expanded': boolean;
	'aria-controls': string;
	'data-dialog-open': '' | undefined;
	onClick: JSX.EventHandler<HTMLElement, MouseEvent>;
}

export interface DialogTriggerProps extends Omit<ButtonProps, 'onClick'> {
	onClick?: JSX.EventHandler<HTMLElement, MouseEvent> | undefined;
	/** Свой инициатор вместо Button: `render={(attributes) => <IconButton {...attributes} aria-label='Настройки'>…</IconButton>}`. */
	render?: ((attributes: DialogTriggerAttributes) => JSX.Element) | undefined;
}

export function DialogTrigger(props: DialogTriggerProps): JSX.Element {
	const context = useDialogContext('Dialog.Trigger');
	const [local, rest] = splitProps(props, ['render', 'onClick', 'ref']);

	// у корня может быть несколько инициаторов: общий якорь принадлежит тому, которым диалог открыт
	let own: HTMLElement | undefined;
	onCleanup(() => {
		if (context.anchor() === own) {
			context.setAnchor(undefined);
		}
	});

	const attributes: DialogTriggerAttributes = {
		ref: (element) => {
			own = element;
			context.setAnchor(element);
			// публичный ref Button не теряется: компилятор Solid передаёт любой ref дочернему компоненту функцией
			if (typeof local.ref === 'function') {
				local.ref(element as HTMLButtonElement);
			}
		},
		'aria-haspopup': 'dialog',
		get 'aria-expanded'() {
			return context.open();
		},
		'aria-controls': context.contentId,
		get 'data-dialog-open'() {
			return context.open() ? '' : undefined;
		},
		onClick: (event) => {
			local.onClick?.(event);
			if (!event.defaultPrevented) {
				if (!context.open()) {
					// хост диалога и возврат фокуса считаются от инициатора, по которому нажали, а не от последнего смонтированного
					context.setAnchor(event.currentTarget);
				}
				context.setOpen(!context.open());
			}
		}
	};

	return (
		<Show when={local.render} fallback={<Button {...rest} {...attributes}/>}>
			{(render) => render()(attributes)}
		</Show>
	);
}
```

- [ ] **Step 6: CSS**

Создать `src/components/dialog/dialog.module.css`:

```css
/*
 * Компонентные токены Dialog (публичный API кастомизации):
 *   --s-kit-dialog-bg, --s-kit-dialog-width, --s-kit-dialog-padding, --s-kit-dialog-radius, --s-kit-dialog-backdrop
 * Сброс наследуемых свойств приходит из основы панелей (src/internal/floating-panel/panel-base.module.css): диалог тоже
 * монтируется в хост, у предков которого могут быть чужие шрифт, регистр и цвет.
 */

.dialog {
    composes: panel from "../../internal/floating-panel/panel-base.module.css";

    /* центрирование: основа панелей сбрасывает inset и margin под позиционирование Floating UI */
    inset: 0;
    flex-direction: column;
    gap: 12px;

    /* прокручивается только Dialog.Body, поэтому сам диалог не прокручивается */
    overflow: hidden;

    inline-size: var(--s-kit-dialog-width, 480px);
    max-inline-size: calc(100vw - 2 * 16px);
    max-block-size: calc(100dvh - 2 * 16px);
    margin: auto;
    padding: var(--s-kit-dialog-padding, 20px);
    border-radius: var(--s-kit-dialog-radius, calc(var(--s-kit-radius) * 2));

    /* плотный слой данных: сплошной фон, материал панелей ему не подходит */
    background: var(--s-kit-dialog-bg, var(--s-kit-color-surface));
    box-shadow: var(--s-kit-shadow-popover);
    user-select: text;
}

/* display: flex только у открытого диалога: иначе закрытый `<dialog>` стал бы видимым */
.dialog[open] {
    display: flex;
}

.dialog::backdrop {
    background: var(--s-kit-dialog-backdrop, color-mix(in oklch, var(--s-kit-color-text) 40%, transparent));
}

/* страница под модальным диалогом не прокручивается; gutter не даёт вёрстке прыгать при исчезновении полосы */
:global(html):has(.dialog:modal) {
    scrollbar-gutter: stable;
    overflow: hidden;
}

.title {
    flex: none;
    margin: 0;
    font-size: calc(var(--s-kit-font-size) * 1.25);
    font-weight: 600;
    line-height: 1.3;
}

.description {
    flex: none;
    margin: 0;
    color: var(--s-kit-color-muted);
}

/*
 * Тело прокручивается и резервирует вокруг содержимого отступ, равный пространству внешнего кольца фокуса
 * (зонтичный, раздел 5.1): иначе overflow обрезал бы кольцо контролов, стоящих вплотную к краю. Отрицательный margin
 * возвращает содержимому прежнее положение относительно заголовка и подвала.
 */
.body {
    flex: 1 1 auto;
    overflow: auto;
    overscroll-behavior: contain;
    min-block-size: 0;
    margin: calc(-1 * var(--s-kit-focus-space));
    padding: var(--s-kit-focus-space);
}

.footer {
    display: flex;
    flex: none;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: flex-end;
}
```

После создания: `pnpm exec stylelint --fix src/components/dialog/dialog.module.css` и сверить, что предупреждений нет (порядок свойств править автоматически).

- [ ] **Step 7: Content**

Создать `src/components/dialog/dialog-content.tsx`:

```tsx
import styles from './dialog.module.css';

import { createEffect, createSignal, type JSX, Show, splitProps, untrack } from 'solid-js';

import { blocksImplicitSubmit } from '../../internal/floating-panel/blocks-implicit-submit';
import { createFocusRestore } from '../../internal/floating-panel/create-focus-restore';
import { type IsolatedEventProp, isolationHandlers } from '../../internal/floating-panel/panel-isolation';
import { PanelHostContext } from '../../internal/panel/panel-host';
import { PanelPortal } from '../../internal/panel/panel-portal';
import { renderChildren } from '../../internal/render-children';

import { createDialogLayer } from './create-dialog-layer';
import { useDialogContext } from './dialog-context';
import type { DialogState } from './dialog-state';
import { isOutsideRect } from './is-outside-rect';

/** Атрибуты `<dialog>`, кроме занятых компонентом: открытием, событиями изоляции и закрытия, ключевыми пропсами. */
export type DialogContentAttributes = Omit<
	JSX.DialogHtmlAttributes<HTMLDialogElement>,
	IsolatedEventProp | 'onKeyDown' | 'onCancel' | 'onClose' | 'open' | 'ref' | 'class' | 'style' | 'children'
>;

export interface DialogContentProps extends DialogContentAttributes {
	size?: 'sm' | 'md' | 'lg' | undefined;
	/** Вызывается раньше изоляции события; остальные изолируемые события вешаются на элементы внутри. */
	onKeyDown?: ((event: KeyboardEvent & { currentTarget: HTMLDialogElement }) => void) | undefined;
	/** Элемент `<dialog>`. */
	ref?: ((element: HTMLDialogElement) => void) | undefined;
	class?: string | undefined;
	style?: JSX.CSSProperties | undefined;
	children?: JSX.Element | ((state: DialogState) => JSX.Element);
}

export function DialogContent(props: DialogContentProps): JSX.Element {
	const context = useDialogContext('Dialog.Content');
	const [local, rest] = splitProps(props, ['size', 'onKeyDown', 'ref', 'class', 'style', 'children']);
	const [dialog, setDialog] = createSignal<HTMLDialogElement>();
	const [opener, setOpener] = createSignal<Element>();
	const open = (): boolean => context.open();
	const state: DialogState = {
		open: context.open,
		close: () => {
			context.setOpen(false);
		}
	};

	// кто держал фокус до открытия: туда фокус вернётся, даже если инициатора нет (диалог открыт через `open` снаружи)
	createEffect(() => {
		if (!open()) {
			return;
		}
		untrack(() => {
			const active = document.activeElement;
			setOpener(context.anchor() ?? (active instanceof HTMLElement && active !== document.body ? active : undefined));
		});
	});

	createDialogLayer({
		dialog,
		open,
		onEscape: () => {
			if (context.closeOnEscape()) {
				context.setOpen(false);
			}
		}
	});
	createFocusRestore({ panel: dialog, anchor: opener, open });

	// закрытие, пришедшее не от нас (`<form method="dialog">`): синхронизируем состояние. Браузер доставляет `close` отдельной
	// задачей, поэтому событие может прийти от уже удалённого экземпляра (очистка слоя вызвала `close()`, затем диалог открыт снова
	// или размонтирован): такие события игнорируются, иначе новый диалог закрылся бы чужим событием
	const handleClose = (event: Event): void => {
		const element = dialog();
		if (!element?.isConnected || event.currentTarget !== element || !context.open()) {
			return;
		}
		context.setOpen(false);
		// контролируемый режим: родитель оставил `open`, DOM-диалог уже закрыт, поэтому открываем снова
		if (context.open() && !element.open) {
			element.showModal();
		}
	};

	// клик по подложке это пара pointerdown и click, обе цели `<dialog>` вне его прямоугольника: выделение текста,
	// начатое внутри и закончившееся над подложкой, диалог не закрывает
	let pressedOnBackdrop = false;
	const isBackdropEvent = (event: MouseEvent & { currentTarget: HTMLDialogElement }): boolean => {
		return event.target === event.currentTarget
			&& isOutsideRect(event.currentTarget.getBoundingClientRect(), event.clientX, event.clientY);
	};

	return (
		<Show when={context.open()}>
			<PanelPortal anchor={context.anchor}>
				<PanelHostContext.Provider value={dialog}>
					<dialog
						aria-labelledby={context.titleId()}
						aria-describedby={context.descriptionId()}
						{...rest}
						{...isolationHandlers}
						id={context.contentId}
						ref={(element) => {
							setDialog(element);
							local.ref?.(element);
						}}
						data-s-kit
						data-s-kit-dialog
						data-s-kit-size={local.size}
						class={local.class ? `${styles['dialog']} ${local.class}` : styles['dialog']}
						style={local.style}
						onCancel={(event) => {
							// страховка для источников, минующих keydown (close watcher); основной путь это стек слоёв
							event.preventDefault();
						}}
						onClose={(event) => {
							handleClose(event);
						}}
						onPointerDown={(event) => {
							event.stopPropagation();
							pressedOnBackdrop = isBackdropEvent(event);
						}}
						onClick={(event) => {
							event.stopPropagation();
							const closing = pressedOnBackdrop && isBackdropEvent(event) && context.closeOnBackdropClick();
							pressedOnBackdrop = false;
							if (closing) {
								context.setOpen(false);
							}
						}}
						onKeyDown={(event) => {
							local.onKeyDown?.(event);
							if (blocksImplicitSubmit(event, event.currentTarget)) {
								event.preventDefault();
							}
							event.stopPropagation();
						}}
					>
						{renderChildren(local.children, state)}
					</dialog>
				</PanelHostContext.Provider>
			</PanelPortal>
		</Show>
	);
}
```

Если `typecheck` ругается на тип `ref`/`onCancel`/`onClose` у `<dialog>` или на `renderChildren(local.children, state)` с `children?:` без `| undefined`, поправить типы, не меняя поведения (для `onCancel` допустимо `on:cancel`). Если ESLint (`solid/reactivity`) жалуется на `pressedOnBackdrop` или `opener`, оставить переменную внутри компонента (не выносить в модуль), а чтение вести только в обработчиках.

- [ ] **Step 8: index.ts**

Создать `src/components/dialog/index.ts` (Task 3 дополнит):

```ts
import { DialogContent } from './dialog-content';
import { DialogRoot } from './dialog-root';
import { DialogTrigger } from './dialog-trigger';

export type { DialogContentProps } from './dialog-content';
export type { DialogRootProps } from './dialog-root';
export type { DialogState } from './dialog-state';
export type { DialogTriggerAttributes, DialogTriggerProps } from './dialog-trigger';
export { useDialog } from './use-dialog';

export const Dialog = { Root: DialogRoot, Trigger: DialogTrigger, Content: DialogContent };
```

- [ ] **Step 9: Запустить тесты, типы, линт**

Run: `pnpm exec vitest run src/components/dialog && pnpm typecheck && pnpm exec eslint src --max-warnings 0 && pnpm exec stylelint "src/**/*.css"`
Expected: PASS. Возможные расхождения и что с ними делать:
- тест «controlled: parent keeps open» падает: проверить порядок в `handleClose` (сначала `setOpen(false)`, затем проверка `context.open()`);
- тест «returns the focus»: если активен не инициатор, прочитать комментарий в `create-focus-restore.ts` (в части 1 порядок «DOM раньше эффектов» подтверждён тестом) и убедиться, что `opener` заполнен до открытия;
- тест «a click inside the dialog outside the popover»: каскад должен остановиться на модальном слое (`Layer.modal`, часть 1).

- [ ] **Step 10: Коммит**

```bash
git add src/components/dialog
git commit -m "feat(dialog): Dialog: Root, Trigger, Content на нативном dialog, слой стека с modal, useDialog" -m "$TRAILERS"
```

---

### Task 3: Title, Description, Body, Footer, Close

**Files:**
- Create: `src/components/dialog/dialog-title.tsx`, `dialog-description.tsx`, `dialog-body.tsx`, `dialog-footer.tsx`, `dialog-close.tsx`
- Modify: `src/components/dialog/index.ts`
- Test: `src/components/dialog/dialog-parts.test.tsx`

**Interfaces:**
- Consumes: `DialogContextValue.setTitleId/setDescriptionId`, стили `.title`, `.description`, `.body`, `.footer` из `dialog.module.css`.
- Produces: `Dialog = { Root, Trigger, Content, Title, Description, Body, Footer, Close }`; типы `DialogTitleProps`, `DialogDescriptionProps`, `DialogBodyProps`, `DialogFooterProps`, `DialogCloseProps`.

- [ ] **Step 1: Падающие тесты**

Создать `src/components/dialog/dialog-parts.test.tsx`:

```tsx
import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { stubDialogApi } from '../../internal/testing/stub-dialog-api';

import { Dialog } from './index';

let dialogApi = stubDialogApi();

beforeEach(() => {
	dialogApi = stubDialogApi();
});

afterEach(() => {
	cleanup();
	dialogApi.restore();
});

function getDialog(): HTMLDialogElement {
	const dialog = document.querySelector('dialog');
	if (!dialog) {
		throw new Error('dialog is not rendered');
	}
	return dialog;
}

describe('Dialog parts', () => {
	it('Title and Description are linked to the dialog through aria-labelledby and aria-describedby', () => {
		render(() => (
			<Dialog.Root defaultOpen>
				<Dialog.Content>
					<Dialog.Title>Удалить запись?</Dialog.Title>
					<Dialog.Description>Действие нельзя отменить.</Dialog.Description>
				</Dialog.Content>
			</Dialog.Root>
		));
		const dialog = getDialog();
		const title = screen.getByRole('heading', { name: 'Удалить запись?' });
		expect(title.tagName).toBe('H2');
		expect(dialog.getAttribute('aria-labelledby')).toBe(title.id);
		const description = screen.getByText('Действие нельзя отменить.');
		expect(description.tagName).toBe('P');
		expect(dialog.getAttribute('aria-describedby')).toBe(description.id);
	});

	it('without Title and Description the dialog has neither attribute, and an explicit id of the title is respected', () => {
		render(() => (
			<Dialog.Root defaultOpen>
				<Dialog.Content aria-label='Без заголовка'>content</Dialog.Content>
			</Dialog.Root>
		));
		expect(getDialog().hasAttribute('aria-labelledby')).toBe(false);
		expect(getDialog().hasAttribute('aria-describedby')).toBe(false);
		cleanup();
		render(() => (
			<Dialog.Root defaultOpen>
				<Dialog.Content>
					<Dialog.Title id='my-title'>Заголовок</Dialog.Title>
				</Dialog.Content>
			</Dialog.Root>
		));
		expect(getDialog().getAttribute('aria-labelledby')).toBe('my-title');
	});

	it('Body, Footer and Title pass class, style and attributes through', () => {
		render(() => (
			<Dialog.Root defaultOpen>
				<Dialog.Content>
					<Dialog.Title class='t' data-part='title'>T</Dialog.Title>
					<Dialog.Body class='b' style={{ color: 'red' }} data-part='body'>B</Dialog.Body>
					<Dialog.Footer class='f' data-part='footer'>F</Dialog.Footer>
				</Dialog.Content>
			</Dialog.Root>
		));
		const body = screen.getByText('B');
		expect(body.className).toContain('b');
		expect(body.style.color).toBe('red');
		expect(body.getAttribute('data-part')).toBe('body');
		expect(screen.getByText('F').className).toContain('f');
		expect(screen.getByText('T').className).toContain('t');
	});

	it('Close closes the dialog, runs a user onClick first and honours preventDefault', () => {
		const onClick = vi.fn((event: MouseEvent) => {
			event.preventDefault();
		});
		render(() => (
			<Dialog.Root defaultOpen>
				<Dialog.Content>
					<Dialog.Close onClick={onClick}>Stay</Dialog.Close>
					<Dialog.Close variant='plain'>Отмена</Dialog.Close>
				</Dialog.Content>
			</Dialog.Root>
		));
		fireEvent.click(screen.getByRole('button', { name: 'Stay' }));
		expect(onClick).toHaveBeenCalledOnce();
		expect(document.querySelector('dialog')).not.toBeNull();
		fireEvent.click(screen.getByRole('button', { name: 'Отмена' }));
		expect(document.querySelector('dialog')).toBeNull();
	});

	it('every part outside Dialog.Root throws a clear error', () => {
		const silence = vi.spyOn(console, 'error').mockImplementation(() => {});
		expect(() => render(() => <Dialog.Title>x</Dialog.Title>)).toThrow('Dialog.Title must be used inside Dialog.Root');
		expect(() => render(() => <Dialog.Description>x</Dialog.Description>))
			.toThrow('Dialog.Description must be used inside Dialog.Root');
		expect(() => render(() => <Dialog.Close>x</Dialog.Close>)).toThrow('Dialog.Close must be used inside Dialog.Root');
		silence.mockRestore();
	});
});
```

Run: `pnpm exec vitest run src/components/dialog/dialog-parts.test.tsx`
Expected: FAIL (частей нет).

- [ ] **Step 2: Title и Description**

Создать `src/components/dialog/dialog-title.tsx`:

```tsx
import styles from './dialog.module.css';

import { createEffect, createUniqueId, type JSX, onCleanup, splitProps } from 'solid-js';

import { useDialogContext } from './dialog-context';

export interface DialogTitleProps extends Omit<JSX.HTMLAttributes<HTMLHeadingElement>, 'class'> {
	class?: string | undefined;
}

/** Заголовок диалога (`h2`); его `id` попадает в `aria-labelledby` диалога. */
export function DialogTitle(props: DialogTitleProps): JSX.Element {
	const context = useDialogContext('Dialog.Title');
	const [local, rest] = splitProps(props, ['class', 'id']);
	const generatedId = createUniqueId();
	const id = (): string => local.id ?? generatedId;

	createEffect(() => {
		context.setTitleId(id());
		onCleanup(() => {
			context.setTitleId(undefined);
		});
	});

	return <h2 {...rest} id={id()} class={local.class ? `${styles['title']} ${local.class}` : styles['title']}/>;
}
```

Создать `src/components/dialog/dialog-description.tsx`:

```tsx
import styles from './dialog.module.css';

import { createEffect, createUniqueId, type JSX, onCleanup, splitProps } from 'solid-js';

import { useDialogContext } from './dialog-context';

export interface DialogDescriptionProps extends Omit<JSX.HTMLAttributes<HTMLParagraphElement>, 'class'> {
	class?: string | undefined;
}

/** Описание диалога (`p`); его `id` попадает в `aria-describedby` диалога. */
export function DialogDescription(props: DialogDescriptionProps): JSX.Element {
	const context = useDialogContext('Dialog.Description');
	const [local, rest] = splitProps(props, ['class', 'id']);
	const generatedId = createUniqueId();
	const id = (): string => local.id ?? generatedId;

	createEffect(() => {
		context.setDescriptionId(id());
		onCleanup(() => {
			context.setDescriptionId(undefined);
		});
	});

	return <p {...rest} id={id()} class={local.class ? `${styles['description']} ${local.class}` : styles['description']}/>;
}
```

- [ ] **Step 3: Body, Footer, Close**

Создать `src/components/dialog/dialog-body.tsx`:

```tsx
import styles from './dialog.module.css';

import { type JSX, splitProps } from 'solid-js';

export interface DialogBodyProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'class' | 'style'> {
	class?: string | undefined;
	style?: JSX.CSSProperties | undefined;
}

/** Прокручиваемое тело диалога; вокруг содержимого резервирует место под внешнее кольцо фокуса (критерий 7). */
export function DialogBody(props: DialogBodyProps): JSX.Element {
	const [local, rest] = splitProps(props, ['class', 'style']);

	return <div {...rest} class={local.class ? `${styles['body']} ${local.class}` : styles['body']} style={local.style}/>;
}
```

Создать `src/components/dialog/dialog-footer.tsx`:

```tsx
import styles from './dialog.module.css';

import { type JSX, splitProps } from 'solid-js';

export interface DialogFooterProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'class' | 'style'> {
	class?: string | undefined;
	style?: JSX.CSSProperties | undefined;
}

/** Подвал диалога: ряд кнопок у правого края, зафиксирован под прокручиваемым телом. */
export function DialogFooter(props: DialogFooterProps): JSX.Element {
	const [local, rest] = splitProps(props, ['class', 'style']);

	return <div {...rest} class={local.class ? `${styles['footer']} ${local.class}` : styles['footer']} style={local.style}/>;
}
```

Создать `src/components/dialog/dialog-close.tsx`:

```tsx
import { type JSX, splitProps } from 'solid-js';

import { Button, type ButtonProps } from '../button/button';

import { useDialogContext } from './dialog-context';

export interface DialogCloseProps extends Omit<ButtonProps, 'onClick'> {
	onClick?: JSX.EventHandler<HTMLButtonElement, MouseEvent> | undefined;
}

/** Button, закрывающий диалог; пользовательский `onClick` вызывается первым, `preventDefault()` отменяет закрытие. */
export function DialogClose(props: DialogCloseProps): JSX.Element {
	const context = useDialogContext('Dialog.Close');
	const [local, rest] = splitProps(props, ['onClick']);

	return (
		<Button
			{...rest}
			onClick={(event) => {
				local.onClick?.(event);
				if (!event.defaultPrevented) {
					context.setOpen(false);
				}
			}}
		/>
	);
}
```

- [ ] **Step 4: index.ts**

Заменить `src/components/dialog/index.ts` целиком:

```ts
import { DialogBody } from './dialog-body';
import { DialogClose } from './dialog-close';
import { DialogContent } from './dialog-content';
import { DialogDescription } from './dialog-description';
import { DialogFooter } from './dialog-footer';
import { DialogRoot } from './dialog-root';
import { DialogTitle } from './dialog-title';
import { DialogTrigger } from './dialog-trigger';

export type { DialogBodyProps } from './dialog-body';
export type { DialogCloseProps } from './dialog-close';
export type { DialogContentProps } from './dialog-content';
export type { DialogDescriptionProps } from './dialog-description';
export type { DialogFooterProps } from './dialog-footer';
export type { DialogRootProps } from './dialog-root';
export type { DialogState } from './dialog-state';
export type { DialogTitleProps } from './dialog-title';
export type { DialogTriggerAttributes, DialogTriggerProps } from './dialog-trigger';
export { useDialog } from './use-dialog';

export const Dialog = {
	Root: DialogRoot,
	Trigger: DialogTrigger,
	Content: DialogContent,
	Title: DialogTitle,
	Description: DialogDescription,
	Body: DialogBody,
	Footer: DialogFooter,
	Close: DialogClose
};
```

- [ ] **Step 5: Запустить всё**

Run: `pnpm check`
Expected: зелёный (записать число тестов). Если `Dialog.Title` с явным `id` не попадает в `aria-labelledby` (порядок эффектов), проверить, что `createEffect` в Title читает `id()`.

- [ ] **Step 6: Коммит**

```bash
git add src/components/dialog
git commit -m "feat(dialog): Title, Description, Body, Footer, Close" -m "$TRAILERS"
```

---

### Task 4: Dialog заменяет `probe-unused` в матрице формы пакета

**Files:**
- Delete: `src/components/probe-unused/` (весь каталог)
- Modify: `scripts/verify-package-form.sh`

**Interfaces:**
- Consumes: `Dialog` как «неимпортированный компонент»: потребитель матрицы (`scripts/consumer/src/main.tsx`) его не импортирует.
- Produces: матрица проверяет, что строка `must be used inside Dialog.Root` и токен `--s-kit-dialog-width` не попали в бандл и CSS потребителя.

- [ ] **Step 1: Удалить `probe-unused` и обновить скрипт**

```bash
git rm -r src/components/probe-unused
```

В `scripts/verify-package-form.sh` строку

```bash
grep -lq 'marker-unused' dist/assets/*.js && fail "not imported component leaked into the bundle" || ok "not imported component is not in the bundle"
```

заменить на две:

```bash
grep -lq 'must be used inside Dialog.Root' dist/assets/*.js && fail "not imported component leaked into the bundle" || ok "not imported component is not in the bundle"
grep -lq -- '--s-kit-dialog-width' dist/assets/*.css && fail "not imported component styles leaked into the built CSS" || ok "not imported component styles are not in the built CSS"
```

Затем: `grep -rn -i "probe-unused\|ProbeUnused\|marker-unused" src scripts playground/src README.md`. Остаться не должно ничего.

- [ ] **Step 2: Проверка и матрица**

Run: `pnpm check`
Expected: зелёный.

Закоммитить (Step 3), затем: `env -u HTTPS_PROXY -u HTTP_PROXY -u https_proxy -u http_proxy bash scripts/verify-package-form.sh HEAD > <каталог-вне-репозитория>/matrix.log 2>&1` (в фоне, около полутора минут). Ожидается: все строки OK, TypeScript 5.9.3 и 7.0.2 зелёные. Если сеть недоступна, записать это в итогах и не писать «матрица зелёная».

- [ ] **Step 3: Коммит**

```bash
git add -A
git commit -m "refactor(matrix): Dialog заменяет probe-unused как неимпортированный компонент" -m "$TRAILERS"
```

---

### Task 5: Страница «Панели» в playground: демонстрации и проверки Dialog

**Files:**
- Create: `playground/src/panels-page.tsx`, `playground/src/demo-dialogs.tsx`, `playground/src/dialog-checks.ts`
- Modify: `playground/src/app.tsx`, `playground/src/playground.css`

**Interfaces:**
- Consumes: `Dialog`, `Popover`, `Button`, `Input`, `Checkbox`, `Switch`; `CheckResult`, `resolveColor`, `Rgba` из `./theme-checks`; `contrastRatio` из `../../src/utils/color-math`.
- Produces: страница `#panels` (её наращивают части 3 и 4); `runDialogChecks(page: HTMLElement): Promise<CheckResult[]>`; разметка с атрибутами `data-dialog-demo`, `data-dialog-trigger`, `data-dialog-close`, `data-dialog-body`.

- [ ] **Step 1: Демонстрации**

Создать `playground/src/demo-dialogs.tsx`:

```tsx
import { Button } from '@stark/solid-kit/button';
import { Checkbox } from '@stark/solid-kit/checkbox';
import { Dialog } from '@stark/solid-kit/dialog';
import { Input } from '@stark/solid-kit/input';
import { Popover } from '@stark/solid-kit/popover';
import { Switch } from '@stark/solid-kit/switch';
import { For, type JSX } from 'solid-js';

const LONG_LINES = Array.from({ length: 30 }, (_, index) => index + 1);

/** Три диалога для проверок и ручной приёмки: обычный с контролами у края тела, с Popover внутри и с длинным телом. */
export function DemoDialogs(): JSX.Element {
	return (
		<div class='dialog-demos'>
			<Dialog.Root>
				<Dialog.Trigger data-dialog-trigger='basic'>Диалог с контролами</Dialog.Trigger>
				<Dialog.Content data-dialog-demo='basic'>
					<Dialog.Title>Удалить запись?</Dialog.Title>
					<Dialog.Description>Действие нельзя отменить.</Dialog.Description>
					<Dialog.Body data-dialog-body>
						<Input aria-label='Название' defaultValue='Контрол вплотную к краю тела'/>
						<Checkbox>Не спрашивать снова</Checkbox>
						<Switch>Уведомлять по почте</Switch>
					</Dialog.Body>
					<Dialog.Footer>
						<Dialog.Close variant='plain' data-dialog-close>Отмена</Dialog.Close>
						<Button variant='danger'>Удалить</Button>
					</Dialog.Footer>
				</Dialog.Content>
			</Dialog.Root>

			<Dialog.Root>
				<Dialog.Trigger data-dialog-trigger='popover'>Диалог с Popover</Dialog.Trigger>
				<Dialog.Content data-dialog-demo='popover'>
					<Dialog.Title>Диалог с панелью</Dialog.Title>
					<Dialog.Body>
						<Popover.Root>
							<Popover.Trigger>Открыть панель</Popover.Trigger>
							<Popover.Content>
								<Input aria-label='Поле в панели' placeholder='Поле в панели'/>
							</Popover.Content>
						</Popover.Root>
					</Dialog.Body>
					<Dialog.Footer>
						<Dialog.Close variant='plain'>Закрыть</Dialog.Close>
					</Dialog.Footer>
				</Dialog.Content>
			</Dialog.Root>

			<Dialog.Root closeOnBackdropClick={false}>
				<Dialog.Trigger data-dialog-trigger='long'>Диалог с длинным телом (без закрытия по подложке)</Dialog.Trigger>
				<Dialog.Content data-dialog-demo='long'>
					<Dialog.Title>Длинное тело</Dialog.Title>
					<Dialog.Body>
						<For each={LONG_LINES}>{(line) => <p>{`Строка ${line} длинного тела диалога.`}</p>}</For>
					</Dialog.Body>
					<Dialog.Footer>
						<Dialog.Close>Готово</Dialog.Close>
					</Dialog.Footer>
				</Dialog.Content>
			</Dialog.Root>
		</div>
	);
}
```

(Если `Checkbox` или `Switch` принимают подпись иначе, взять способ из `playground/src/demo-checkboxes.tsx` и `demo-switches.tsx`.)

- [ ] **Step 2: Проверки**

Создать `playground/src/dialog-checks.ts`:

```ts
import { contrastRatio, type Rgb } from '../../src/utils/color-math';

import { type CheckResult, resolveColor, type Rgba } from './theme-checks';

function rgb([red, green, blue]: Rgba): Rgb {
	return [red, green, blue];
}

async function frames(count = 2): Promise<void> {
	for (let index = 0; index < count; index++) {
		await new Promise<void>((resolve) => {
			requestAnimationFrame(() => {
				resolve();
			});
		});
	}
}

function required<T extends Element>(root: ParentNode, selector: string): T {
	const found = root.querySelector<T>(selector);
	if (!found) {
		throw new Error(`Playground element is missing: ${selector}`);
	}
	return found;
}

/** Высота резервного отступа в пикселях: `--s-kit-focus-space` это calc(), поэтому читается через вычисленный padding пробного элемента. */
function focusSpace(host: HTMLElement): number {
	const probe = document.createElement('span');
	probe.style.paddingInlineStart = 'var(--s-kit-focus-space)';
	host.append(probe);
	const value = Number.parseFloat(getComputedStyle(probe).paddingInlineStart);
	probe.remove();
	return value;
}

/**
 * Открывает диалог «basic» кликом по инициатору и проверяет измеримое: модальность, `aria-labelledby`/`aria-describedby`,
 * подложку, блокировку прокрутки страницы, отступ тела под кольцо фокуса, контраст текста, возврат фокуса.
 * Настоящий Esc, клик по подложке и поведение Popover внутри диалога проверяются вручную (синтетические события не годятся).
 */
export async function runDialogChecks(page: HTMLElement): Promise<CheckResult[]> {
	const results: CheckResult[] = [];
	const check = (name: string, ok: boolean, detail: string): void => {
		results.push({ name, ok, detail });
	};
	const trigger = required<HTMLElement>(page, '[data-dialog-trigger="basic"]');

	trigger.focus();
	trigger.click();
	await frames();
	const dialog = required<HTMLDialogElement>(page, '[data-dialog-demo="basic"]');
	try {
		check('Dialog: диалог открыт как модальный', dialog.open && dialog.matches(':modal'), `open = ${String(dialog.open)}`);

		const title = document.getElementById(dialog.getAttribute('aria-labelledby') ?? '');
		check(
			'Dialog: aria-labelledby указывает на заголовок',
			title?.textContent === 'Удалить запись?',
			`заголовок = ${title?.textContent ?? 'нет'}`
		);
		const description = document.getElementById(dialog.getAttribute('aria-describedby') ?? '');
		check(
			'Dialog: aria-describedby указывает на описание',
			description?.textContent === 'Действие нельзя отменить.',
			`описание = ${description?.textContent ?? 'нет'}`
		);

		const backdrop = resolveColor(getComputedStyle(dialog, '::backdrop').backgroundColor);
		check(
			'Dialog: подложка видна (::backdrop наследует токены диалога)',
			backdrop[3] > 0,
			`alpha подложки = ${(backdrop[3] / 255).toFixed(2)}`
		);

		check(
			'Dialog: прокрутка страницы заблокирована',
			getComputedStyle(document.documentElement).overflow === 'hidden',
			`overflow html = ${getComputedStyle(document.documentElement).overflow}`
		);

		const body = required<HTMLElement>(dialog, '[data-dialog-body]');
		const reserved = focusSpace(body);
		const padding = Number.parseFloat(getComputedStyle(body).paddingInlineStart);
		check(
			'Dialog.Body: отступ не меньше пространства кольца фокуса',
			padding >= reserved && reserved > 0,
			`отступ ${padding} px, кольцо ${reserved} px`
		);

		const surface = resolveColor(getComputedStyle(dialog).backgroundColor);
		for (const [name, element] of [['заголовка', title], ['описания', description]] as const) {
			if (!element) {
				continue;
			}
			const ratio = contrastRatio(rgb(resolveColor(getComputedStyle(element).color)), rgb(surface));
			check(`Dialog: контраст текста ${name} (4.5:1)`, ratio >= 4.5, `контраст ${ratio.toFixed(2)}:1`);
		}
	}
	finally {
		required<HTMLElement>(dialog, '[data-dialog-close]').click();
		await frames();
	}

	check('Dialog: после закрытия диалога нет в DOM', page.querySelector('[data-dialog-demo="basic"]') === null, 'диалог удалён');
	check(
		'Dialog: после закрытия прокрутка страницы возвращена',
		getComputedStyle(document.documentElement).overflow !== 'hidden',
		`overflow html = ${getComputedStyle(document.documentElement).overflow}`
	);
	check('Dialog: фокус вернулся на инициатор', document.activeElement === trigger, `активен ${document.activeElement?.tagName ?? 'нет'}`);

	return results;
}
```

- [ ] **Step 3: Страница**

Создать `playground/src/panels-page.tsx`:

```tsx
import { createEffect, createSignal, For, type JSX } from 'solid-js';

import { DemoDialogs } from './demo-dialogs';
import { runDialogChecks } from './dialog-checks';
import { pick } from './pick';
import type { CheckResult } from './theme-checks';

type Theme = 'system' | 'light' | 'dark';

const THEMES: readonly Theme[] = ['system', 'light', 'dark'];

/** Страница «Панели» (раздел 8 зонтичного спека, критерий 6): наращивается частями этапа 2. Сейчас: Dialog. */
export function PanelsPage(): JSX.Element {
	const [theme, setTheme] = createSignal<Theme>('system');
	const [results, setResults] = createSignal<readonly CheckResult[]>([]);
	let page: HTMLElement | undefined;

	// системная тема: атрибута нет; иначе color-scheme принудительно на <html>
	createEffect(() => {
		const root = document.documentElement;
		if (theme() === 'system') {
			root.removeAttribute('data-s-kit-theme');
		}
		else {
			root.setAttribute('data-s-kit-theme', theme());
		}
	});

	const runChecks = (): void => {
		if (page) {
			void runDialogChecks(page).then(setResults);
		}
	};

	return (
		<main ref={page} class='page'>
			<header class='toolbar'>
				<h1>Панели</h1>
				<label>
					Тема
					<select onChange={(event) => setTheme(pick(THEMES, event.currentTarget.value, 'system'))}>
						<For each={THEMES}>{(value) => <option value={value}>{value}</option>}</For>
					</select>
				</label>
			</header>

			<section>
				<h2>1. Dialog</h2>
				<p>
					Ручная приёмка настоящими нажатиями: Esc закрывает по очереди панель и диалог (второй диалог), клик по подложке
					закрывает первый диалог и не закрывает третий, колесо над подложкой не прокручивает страницу.
				</p>
				<DemoDialogs/>
			</section>

			<section>
				<h2>2. Проверки</h2>
				<button type='button' onClick={runChecks}>
					Запустить проверки
				</button>
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

			<div class='page-filler' aria-hidden='true'/>
		</main>
	);
}
```

В `playground/src/app.tsx` добавить импорт `import { PanelsPage } from './panels-page';`, значение `'panels'` в `PAGE_IDS` (`['themes', 'controls-row', 'panels'] as const`) и запись `panels: { title: 'Панели', component: PanelsPage }` в `PAGES`.

В `playground/src/playground.css` добавить (отступы 4 пробела, двойные кавычки; рядом с остальными правилами страниц):

```css
.dialog-demos {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
}

/* высота страницы нужна, чтобы проверять блокировку прокрутки под диалогом */
.page-filler {
    block-size: 120vh;
}
```

- [ ] **Step 4: Проверка и коммит**

Run: `pnpm check`
Expected: зелёный (typecheck playground, ESLint, Stylelint).

```bash
git add playground
git commit -m "feat(playground): страница «Панели»: демонстрации и проверки Dialog" -m "$TRAILERS"
```

---

### Task 6: Проверка в Chrome и итоги части 2

**Files:**
- Modify: `docs/superpowers/specs/2026-10-29-stage-2-overlays-design.md` (раздел «Итоги части 2»)
- Modify: `README.md` (строка статуса)

- [ ] **Step 1: Автоматические проверки на странице**

`pnpm dev` (порт из вывода Vite), открыть `#panels`, сфокусировать «Запустить проверки» через JS и нажать Enter клавишей (не кликом: страница после клика не должна быть источником потери фокуса), подождать 1–2 с. Ожидается: все проверки OK в системной, светлой и тёмной темах (смену темы делать через `select` и ждать 1,5–2 с). Записать число проверок. Каждое FAIL разобрать: контраст описания (`--s-kit-color-muted`) и отступ тела проверяют реальную вёрстку; если описание не дотягивает до 4,5:1, поднять контраст токеном компонента (`color: var(--s-kit-color-text)`) и записать это в итоги.

- [ ] **Step 2: Ручная приёмка настоящими нажатиями**

(Клавиши только настоящие: `computer key`; фокус на нужной кнопке ставить JS-ом, нажимать Enter.)
1. **Esc с Popover:** открыть «Диалог с Popover», открыть «Открыть панель», ввести символ в поле панели. Первый Esc закрывает только панель (фокус на кнопке «Открыть панель»), второй закрывает диалог (фокус на инициаторе «Диалог с Popover»). `onOpenChange(false)` диалога один раз: проверить через `console.log` в временной правке или по счётчику `Dialog.Root onOpenChange` на странице; временную правку не коммитить.
2. **Подложка:** в первом диалоге клик по подложке закрывает диалог; выделение текста мышью, начатое внутри диалога и законченное над подложкой, диалог не закрывает; в «Диалоге с длинным телом» клик по подложке не закрывает (`closeOnBackdropClick={false}`).
3. **Прокрутка страницы:** при открытом диалоге колесо над подложкой и над диалогом не двигает страницу (`window.scrollY` не меняется), ширина содержимого страницы не прыгает при открытии и закрытии (`document.documentElement.clientWidth` до, во время и после), после закрытия прокрутка возвращается. В длинном диалоге прокручивается только тело (`scrollTop` тела растёт), заголовок и подвал стоят.
4. **Фокус и кольцо:** Tab внутри диалога обходит контролы и кнопки по кругу в пределах диалога (нативная инертность фона); внешнее кольцо у «Input» в теле видно целиком (скриншот увеличенной области, `zoom`), не обрезано краем тела.
5. **Закрытие и повторное открытие:** повторное открытие и закрытие трёх диалогов подряд не оставляет лишних `<dialog>` в DOM (`document.querySelectorAll('dialog').length` равно 0 при закрытых диалогах) и не накапливает слои (поведение Esc стабильно).
6. **`::backdrop` и тема:** подложка полупрозрачная в обеих темах, текст диалога читаем (скриншоты в светлой и тёмной темах).

Каждый пункт записать в итоги как «проверено» или как найденное расхождение (и исправить до коммита, тест на регрессию добавить в `dialog.test.tsx`, если дефект воспроизводим в jsdom).

- [ ] **Step 3: Полная проверка и матрица**

Run: `pnpm check`; затем матрица на закоммиченном HEAD (как в Task 4, Step 2). Записать число тестов и результат матрицы. Dev-серверы остановить по PID.

- [ ] **Step 4: Итоги в спеке и статус в README**

Добавить в конец спека раздел `## 13. Итоги части 2: Dialog (<дата>)` с фактами: число тестов до и после; число автоматических проверок страницы «Панели» в трёх темах; что проверено настоящими нажатиями (пункты Step 2); результат матрицы; отклонения от спека, найденные при выполнении (в том числе поведение `showModal()` в Chrome, `::backdrop` и наследование токенов, `scrollbar-gutter`, «Esc без пользовательской активации» и событие `cancel`); что остаётся непроверенным (Firefox, Safari, close watcher вне Chrome, вложенные диалоги). Только измеренное, без предположений. В разделе 5 спека добавить пометку «реализовано, см. раздел 13», если решения менялись, указать изменения.

В `README.md` в строке статуса заменить «готов Popover» на «готовы Popover и Dialog».

- [ ] **Step 5: Проверка и коммит**

Run: `pnpm check`
Expected: зелёный.

```bash
git add docs README.md
git commit -m "docs: итоги части 2 этапа 2 (Dialog)" -m "$TRAILERS"
```
