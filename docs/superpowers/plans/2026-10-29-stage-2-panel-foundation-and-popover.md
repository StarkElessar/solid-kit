# solid-kit, этап 2, часть 1: основа плавающих панелей и Popover — план реализации

> **Для исполнителей:** ОБЯЗАТЕЛЬНЫЙ суб-скил: superpowers:executing-plans (или subagent-driven-development). Шаги отмечены чекбоксами (`- [ ]`).

**Цель:** первая часть этапа 2. Общая внутренняя основа плавающих панелей (хост панели и портал, изоляция событий, сброс наследуемых свойств, фокус при открытии и закрытии, защита от неявной отправки формы), доработка стека слоёв (модальный слой, каскадный клик снаружи) и первый потребитель основы: публичный compound-компонент `Popover` (`Popover.Root` / `Popover.Trigger` / `Popover.Content`, хук `usePopover`). Popover заменяет тестовый стенд `Probe`: страница «Темы» и матрица формы пакета переводятся на него.

**Архитектура:** `layer-stack` получает признак `modal` и каскадное закрытие по клику снаружи. `PanelPortal` монтирует панель в хост (`PanelHostContext` → `resolvePanelHost(anchor)` → `document.body`) через `Portal` с обёрткой `display: contents`. `FloatingPanel` собирает хуки `createAnchoredPosition`, `createPanelLayer`, `createFocusOnOpen`, `createFocusRestore`, вешает изоляцию событий и сброс свойств (CSS `panel-base.module.css` через `composes`, основа нулевой специфичности). `Popover.Root` держит состояние (`createControllableSignal`), `Popover.Trigger` это Button кита или пользовательский инициатор через `render`, `Popover.Content` это `FloatingPanel`.

**Стек:** как в этапах 0 и 1 (Solid 1.9.17, Vite 8, Vitest 5, `@floating-ui/dom`).

**Спеки:** `docs/superpowers/specs/2026-10-29-stage-2-overlays-design.md` (основной; разделы 2, 3, 4, 7), `docs/superpowers/specs/2026-10-28-solid-kit-umbrella-design.md` (разделы 4.3, 5.1, 8, 11, 11.1, 12), `docs/superpowers/specs/2026-10-29-stage-1-simple-controls-design.md` (раздел 2, общие соглашения; раздел 18, `:where()` в основах).

## Global Constraints

- Репозиторий публичный: ни ключей, ни токенов, ни `.env*` в коммитах. Не делать `git push`, не ставить теги в этом плане (тег `v0.3.0` ставится после закрытия этапа), не добавлять `LICENSE`, не менять git-идентичность, не переписывать историю (никаких `--amend`/`rebase`).
- Один класс — один файл; kebab-case; именованные экспорты; пропсы не деструктурируются (`splitProps`/`mergeProps`). Один компонент на файл (демо-компоненты playground тоже); интерфейсы контекста и состояния в отдельных файлах. Чистые функции живут отдельными `.ts`.
- `exactOptionalPropertyTypes: true`: необязательные свойства в публичных пропсах пишутся `foo?: T | undefined`.
- Ошибки контекста: `${part} must be used inside Popover.Root` (так же, как у Tabs); строка `must be used inside Popover.Root` служит маркером «компонент в бандле» в матрице.
- Внутренний код (`src/internal/`) не публичен: `exports` отображает `@stark/solid-kit/<имя>` только на `src/components/<имя>/index.ts`.
- В CSS компонентов: только токены, без литералов цветов, без `outline: none/0`, без голого `var(--s-kit-control-height)`. Основа панелей и компонентный CSS подключаются через `composes ... from "...";` (двойные кавычки), базовые правила обёрнуты в `:where()`.
- Стиль: ESLint (табы, одинарные кавычки, без висячих запятых, Stroustrup, max-len 140, `solid/reactivity` как ошибка: в тестах сигналы не читать, использовать `vi.fn`), Stylelint (4 пробела, двойные кавычки, логические свойства; `pnpm exec stylelint --fix <файл>`). Перед каждым коммитом `pnpm check` зелёный.
- Если `pnpm` пытается ходить в реестр через медленный прокси (`registry.npmjs.org error (23)`, зависание), запускать с очищенными переменными: `env -u HTTPS_PROXY -u HTTP_PROXY -u https_proxy -u http_proxy pnpm ...`; `pnpm install --frozen-lockfile --prefer-offline` так отрабатывает за секунды.
- Коммиты оканчиваются трейлерами: `export TRAILERS=$'Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_017cEinKKFDiYmGrLaaKPqZu'`, затем `git commit -m "msg" -m "$TRAILERS"`.
- Dev-серверы убивать только по PID после проверки cwd (`lsof -a -p <PID> -d cwd -Fn`), никогда `pkill` по имени. Порт 5173 может быть занят чужим процессом: брать порт из вывода Vite.
- Браузерные проверки в Chrome. Страница проверок запускается с клавиатуры (сфокусировать кнопку «Запустить проверки» через JS и нажать Enter) или сменой темы через переключатель; после смены темы ждать 1,5–2 с (переходы цвета дают ложные FAIL). Координаты скриншота (1505 px) отличаются от CSS-пикселей страницы: делить `getBoundingClientRect` на `innerWidth / 1505`; прокрутку делать `scrollIntoView({behavior:'instant'})` и снимать скриншот перед щелчком. JS-инструмент иногда возвращает `[BLOCKED: Cookie/query string data]`: повторить коротким строковым результатом. Firefox и Safari не проверяются.
- Тесты, которым нужен Popover API, подменяют его в `beforeEach`: `HTMLElement.prototype.showPopover = vi.fn(); HTMLElement.prototype.hidePopover = vi.fn();` (jsdom его не реализует).
- Начало плана: `git status` чистый, `pnpm check` зелёный (записать число тестов: оно будет базой для итогов).

---

### Task 1: Стек слоёв: модальный слой и каскадный клик снаружи

**Files:**
- Modify: `src/utils/layer-stack.ts`
- Modify: `src/utils/layer-stack.test.ts`
- Modify: `src/utils/create-anchored-position.ts` (типы опций принимают `| undefined`)

**Interfaces:**
- Produces: `Layer.modal?: boolean`; каскад клика снаружи (спек этапа 2, раздел 3.1); `AnchoredPositionOptions` с `placement?: Placement | undefined`, `gap?: number | undefined`, `padding?: number | undefined`, `matchAnchorWidth?: boolean | undefined`.

- [ ] **Step 1: Обновить тесты стека слоёв**

В `src/utils/layer-stack.test.ts` заменить вспомогательную функцию `addLayer`:

```ts
function addLayer(
	contains: (target: Node) => boolean = () => false,
	modal = false
): { close: ReturnType<typeof vi.fn>; unregister: () => void } {
	const close = vi.fn();
	const unregister = registerLayer({ contains, close, modal });
	unregisters.push(unregister);
	return { close, unregister };
}
```

Существующий тест `pointerdown outside the top layer closes it, inside does not` проверяет, что нижний слой не закрывается; при каскаде нижний слой, не содержащий цель, тоже закрывается, поэтому нижний слой теперь содержит `outside`. Заменить тест целиком:

```ts
	it('pointerdown outside the top layer closes it, inside does not; a lower layer holding the target stays open', () => {
		const inside = document.createElement('div');
		const outside = document.createElement('div');
		document.body.append(inside, outside);
		const lower = addLayer((target) => outside.contains(target));
		const upper = addLayer((target) => inside.contains(target));
		pointerDownOn(inside);
		expect(upper.close).not.toHaveBeenCalled();
		pointerDownOn(outside);
		expect(upper.close).toHaveBeenCalledOnce();
		expect(lower.close).not.toHaveBeenCalled();
		inside.remove();
		outside.remove();
	});
```

Добавить в конец `describe`:

```ts
	it('pointerdown outside every layer closes all of them from the top down', () => {
		const outside = document.createElement('div');
		document.body.append(outside);
		const lower = addLayer();
		const upper = addLayer();
		pointerDownOn(outside);
		expect(upper.close).toHaveBeenCalledOnce();
		expect(lower.close).toHaveBeenCalledOnce();
		expect(upper.close.mock.invocationCallOrder[0]).toBeLessThan(lower.close.mock.invocationCallOrder[0] ?? 0);
		outside.remove();
	});

	it('the cascade stops at the first layer that holds the target', () => {
		const inMiddle = document.createElement('div');
		document.body.append(inMiddle);
		const bottom = addLayer();
		const middle = addLayer((target) => inMiddle.contains(target));
		const top = addLayer();
		pointerDownOn(inMiddle);
		expect(top.close).toHaveBeenCalledOnce();
		expect(middle.close).not.toHaveBeenCalled();
		expect(bottom.close).not.toHaveBeenCalled();
		inMiddle.remove();
	});

	it('a modal layer is never closed by the stack and stops the cascade', () => {
		const outside = document.createElement('div');
		document.body.append(outside);
		const bottom = addLayer();
		const modal = addLayer(() => false, true);
		const top = addLayer();
		pointerDownOn(outside);
		expect(top.close).toHaveBeenCalledOnce();
		expect(modal.close).not.toHaveBeenCalled();
		expect(bottom.close).not.toHaveBeenCalled();
		outside.remove();
	});

	it('survives a layer that unregisters itself while being closed', () => {
		const outside = document.createElement('div');
		document.body.append(outside);
		const lower = addLayer();
		let unregisterUpper = (): void => {};
		const upperClose = vi.fn(() => {
			unregisterUpper();
		});
		unregisterUpper = registerLayer({ contains: () => false, close: upperClose });
		unregisters.push(unregisterUpper);
		pointerDownOn(outside);
		expect(upperClose).toHaveBeenCalledOnce();
		expect(lower.close).toHaveBeenCalledOnce();
		outside.remove();
	});
```

- [ ] **Step 2: Запустить тесты, убедиться, что падают**

Run: `pnpm exec vitest run src/utils/layer-stack.test.ts`
Expected: FAIL (каскад и `modal` ещё не реализованы; также TS-ошибка про `modal` в `registerLayer`, если vitest проверяет типы, иначе падают три новых теста).

- [ ] **Step 3: Реализовать**

В `src/utils/layer-stack.ts` заменить интерфейс `Layer` и обработчик `onPointerDown`:

```ts
/** Открытый слой (панель или диалог). Раздел 8 спека: Esc обрабатывает только верхний слой, клик снаружи каскадно закрывает слои сверху вниз. */
export interface Layer {
	/** Принадлежит ли цель события слою (его панель или его инициатор). */
	contains: (target: Node) => boolean;
	/** Запрос закрытия; регистрацию снимает владелец слоя. */
	close: () => void;
	/** Модальный слой (Dialog): стек его по клику снаружи не закрывает и дальше вниз не идёт. */
	modal?: boolean;
}
```

```ts
function onPointerDown(event: PointerEvent): void {
	if (!(event.target instanceof Node)) {
		return;
	}
	const target = event.target;
	// обход по копии: close() слоя может синхронно снять регистрацию и изменить стек
	for (const layer of [...layers].reverse()) {
		if (layer.contains(target) || layer.modal) {
			return;
		}
		layer.close();
	}
}
```

В `src/utils/create-anchored-position.ts` в интерфейсе `AnchoredPositionOptions` заменить четыре необязательных поля:

```ts
	/** По умолчанию `bottom-start`. */
	placement?: Placement | undefined;
	/** Зазор между якорем и панелью, по умолчанию 4. */
	gap?: number | undefined;
	/** Отступ от краёв вьюпорта для flip/shift/size, по умолчанию 8. */
	padding?: number | undefined;
	/** Ширина панели равна ширине якоря (разделы 6.2 и 8 спека). */
	matchAnchorWidth?: boolean | undefined;
```

- [ ] **Step 4: Запустить тесты и проверку типов**

Run: `pnpm exec vitest run src/utils && pnpm typecheck`
Expected: PASS (тесты стека, позиционирования, слоя панели зелёные).

- [ ] **Step 5: Коммит**

```bash
git add src/utils/layer-stack.ts src/utils/layer-stack.test.ts src/utils/create-anchored-position.ts
git commit -m "feat(overlays): стек слоёв: модальный слой и каскадное закрытие кликом снаружи" -m "$TRAILERS"
```

---

### Task 2: Хост панели и портал

**Files:**
- Create: `src/internal/panel/panel-host.ts`, `src/internal/panel/panel-host.test.ts`
- Create: `src/internal/panel/panel-portal.tsx`

**Interfaces:**
- Produces: `resolvePanelHost(anchor: Element): Element`; `PanelHostContext: Context<Accessor<Element | undefined> | undefined>`; `PanelPortal(props: { anchor: Accessor<Element | undefined>; children: JSX.Element })`.

- [ ] **Step 1: Написать падающие тесты выбора хоста**

Создать `src/internal/panel/panel-host.test.ts`:

```ts
import { afterEach, describe, expect, it } from 'vitest';

import { resolvePanelHost } from './panel-host';

function build(html: string): HTMLElement {
	const root = document.createElement('div');
	root.innerHTML = html;
	document.body.append(root);
	return root;
}

afterEach(() => {
	document.body.replaceChildren();
});

describe('resolvePanelHost', () => {
	it('is the parent of the anchor when no blocking ancestor exists', () => {
		const root = build('<section id="host"><div><button id="anchor"></button></div></section>');
		expect(resolvePanelHost(root.querySelector('#anchor') as Element)).toBe(root.querySelector('div'));
	});

	it('skips a label: the host is the parent of the label', () => {
		const root = build('<section id="host"><label><span><button id="anchor"></button></span></label></section>');
		expect(resolvePanelHost(root.querySelector('#anchor') as Element)).toBe(root.querySelector('#host'));
	});

	it('skips a table: the host is the parent of the table', () => {
		const root = build('<section id="host"><table><tbody><tr><td><button id="anchor"></button></td></tr></tbody></table></section>');
		expect(resolvePanelHost(root.querySelector('#anchor') as Element)).toBe(root.querySelector('#host'));
	});

	it('skips a link and a summary', () => {
		const link = build('<section id="host"><a href="/x"><span id="anchor"></span></a></section>');
		expect(resolvePanelHost(link.querySelector('#anchor') as Element)).toBe(link.querySelector('#host'));
		const summary = build('<details id="outer"><summary><span id="anchor2"></span></summary></details>');
		expect(resolvePanelHost(summary.querySelector('#anchor2') as Element)).toBe(summary.querySelector('#outer'));
	});

	it('takes the parent of the outermost blocking ancestor when several are nested', () => {
		const root = build('<section id="host"><label><a href="/x"><button id="anchor"></button></a></label></section>');
		expect(resolvePanelHost(root.querySelector('#anchor') as Element)).toBe(root.querySelector('#host'));
	});

	it('does not treat the anchor itself as a blocking ancestor', () => {
		const root = build('<div id="host"><button id="anchor"></button></div>');
		expect(resolvePanelHost(root.querySelector('#anchor') as Element)).toBe(root.querySelector('#host'));
	});

	it('falls back to the body for a detached anchor and for an anchor directly in the body', () => {
		expect(resolvePanelHost(document.createElement('button'))).toBe(document.body);
		const loose = document.createElement('button');
		document.body.append(loose);
		expect(resolvePanelHost(loose)).toBe(document.body);
	});
});
```

В последнем тесте `loose` лежит в `body`, поэтому его родитель это `body`, что и ожидается.

- [ ] **Step 2: Запустить, убедиться, что падает**

Run: `pnpm exec vitest run src/internal/panel`
Expected: FAIL (`./panel-host` не существует).

- [ ] **Step 3: Реализовать выбор хоста и контекст**

Создать `src/internal/panel/panel-host.ts`:

```ts
import { type Accessor, createContext } from 'solid-js';

/** Предки инициатора, детьми которых панель быть не может (спек этапа 2, раздел 3.2; зонтичный, раздел 8.1). */
const BLOCKING_ANCESTORS = 'table, label, button, a[href], summary';

/** Хост панели по умолчанию: родитель инициатора, а при блокирующем предке родитель самого внешнего такого предка. */
export function resolvePanelHost(anchor: Element): Element {
	let outermost: Element | null = null;
	for (let element = anchor.parentElement; element; element = element.parentElement) {
		if (element.matches(BLOCKING_ANCESTORS)) {
			outermost = element;
		}
	}
	return (outermost ?? anchor).parentElement ?? document.body;
}

/** Переопределение хоста: ближайший провайдер выигрывает. Грид (этап 4а) и Dialog задают хост своим корнем. */
export const PanelHostContext = createContext<Accessor<Element | undefined>>();
```

- [ ] **Step 4: Реализовать портал**

Создать `src/internal/panel/panel-portal.tsx`:

```tsx
import { type Accessor, createMemo, type JSX, useContext } from 'solid-js';
import { Portal } from 'solid-js/web';

import { PanelHostContext, resolvePanelHost } from './panel-host';

export interface PanelPortalProps {
	/** Реальный элемент инициатора: от него считается хост по умолчанию. */
	anchor: Accessor<Element | undefined>;
	children: JSX.Element;
}

/** Монтирует панель в хост (спек этапа 2, раздел 3.2): не в `body` и не внутрь инициатора. */
export function PanelPortal(props: PanelPortalProps): JSX.Element {
	const provided = useContext(PanelHostContext);
	const host = createMemo<Element>(() => {
		const fromContext = provided?.();
		if (fromContext) {
			return fromContext;
		}
		const anchor = props.anchor();
		return anchor ? resolvePanelHost(anchor) : document.body;
	});

	return (
		<Portal
			mount={host()}
			ref={(container) => {
				// обёртка Portal не должна стать элементом раскладки хоста (flex или grid с gap)
				container.style.display = 'contents';
			}}
		>
			{props.children}
		</Portal>
	);
}
```

- [ ] **Step 5: Запустить тесты и проверку типов**

Run: `pnpm exec vitest run src/internal/panel && pnpm typecheck`
Expected: PASS.

- [ ] **Step 6: Коммит**

```bash
git add src/internal/panel
git commit -m "feat(overlays): хост панели и портал с обёрткой display: contents" -m "$TRAILERS"
```

---

### Task 3: FloatingPanel: изоляция, сброс свойств, фокус, неявная отправка формы

**Files:**
- Create: `src/internal/floating-panel/focus-initial.ts`, `focus-initial.test.ts`
- Create: `src/internal/floating-panel/blocks-implicit-submit.ts`, `blocks-implicit-submit.test.ts`
- Create: `src/internal/floating-panel/panel-isolation.ts`
- Create: `src/internal/floating-panel/create-focus-on-open.ts`, `create-focus-restore.ts`
- Create: `src/internal/floating-panel/panel-base.module.css`
- Create: `src/internal/floating-panel/floating-panel.tsx`, `floating-panel.test.tsx`
- Create: `src/internal/render-children.ts`, `render-children.test.tsx`

**Interfaces:**
- Consumes: `createAnchoredPosition`, `createPanelLayer` из `../../utils/`; `PanelPortal`, `PanelHostContext` из `../panel/`.
- Produces: `FloatingPanel(props: FloatingPanelProps)`; тип `FloatingPanelAttributes`; `InitialFocus = 'first' | 'panel' | 'none'`; `focusInitial(panel, mode)`; `blocksImplicitSubmit(event, panel)`; `isolationHandlers`, `IsolatedEventProp`; `createFocusOnOpen`, `createFocusRestore`; `renderChildren(children, state)`; CSS-классы `panel` и `material` в `panel-base.module.css`.

- [ ] **Step 1: Тесты чистых функций**

Создать `src/internal/floating-panel/focus-initial.test.ts`:

```ts
import { afterEach, describe, expect, it } from 'vitest';

import { focusInitial } from './focus-initial';

function build(html: string): HTMLElement {
	const panel = document.createElement('div');
	panel.innerHTML = html;
	document.body.append(panel);
	return panel;
}

afterEach(() => {
	document.body.replaceChildren();
});

describe('focusInitial', () => {
	it('focuses the first tabbable element and skips disabled, hidden and tabindex=-1 ones', () => {
		const panel = build(
			'<button disabled id="a"></button><button tabindex="-1" id="b"></button><div hidden><button id="c"></button></div><input id="d"/><button id="e"></button>'
		);
		focusInitial(panel, 'first');
		expect(document.activeElement?.id).toBe('d');
	});

	it('focuses the panel itself (making it focusable) when nothing inside is tabbable', () => {
		const panel = build('<span>text</span>');
		focusInitial(panel, 'first');
		expect(document.activeElement).toBe(panel);
		expect(panel.getAttribute('tabindex')).toBe('-1');
	});

	it('mode "panel" focuses the panel even when it has tabbable content', () => {
		const panel = build('<button id="a"></button>');
		focusInitial(panel, 'panel');
		expect(document.activeElement).toBe(panel);
	});

	it('mode "none" leaves the focus alone', () => {
		const panel = build('<button id="a"></button>');
		const before = document.activeElement;
		focusInitial(panel, 'none');
		expect(document.activeElement).toBe(before);
	});
});
```

Создать `src/internal/floating-panel/blocks-implicit-submit.test.ts`:

```ts
import { afterEach, describe, expect, it } from 'vitest';

import { blocksImplicitSubmit } from './blocks-implicit-submit';

function key(target: Element, name: string): KeyboardEvent {
	const event = new KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true });
	Object.defineProperty(event, 'target', { value: target });
	return event;
}

afterEach(() => {
	document.body.replaceChildren();
});

describe('blocksImplicitSubmit', () => {
	it('blocks Enter in an input whose form lies outside the panel', () => {
		const form = document.createElement('form');
		const panel = document.createElement('div');
		const input = document.createElement('input');
		panel.append(input);
		form.append(panel);
		document.body.append(form);
		expect(blocksImplicitSubmit(key(input, 'Enter'), panel)).toBe(true);
	});

	it('does not block when the form is inside the panel, when there is no form, or for other keys and targets', () => {
		const panel = document.createElement('div');
		const form = document.createElement('form');
		const innerInput = document.createElement('input');
		form.append(innerInput);
		panel.append(form);
		document.body.append(panel);
		expect(blocksImplicitSubmit(key(innerInput, 'Enter'), panel)).toBe(false);

		const loose = document.createElement('input');
		const loosePanel = document.createElement('div');
		loosePanel.append(loose);
		document.body.append(loosePanel);
		expect(blocksImplicitSubmit(key(loose, 'Enter'), loosePanel)).toBe(false);

		const outerForm = document.createElement('form');
		const area = document.createElement('textarea');
		const wrapper = document.createElement('div');
		wrapper.append(area);
		outerForm.append(wrapper);
		document.body.append(outerForm);
		expect(blocksImplicitSubmit(key(area, 'Enter'), wrapper)).toBe(false);
		expect(blocksImplicitSubmit(key(innerInput, 'a'), panel)).toBe(false);
	});
});
```

Создать `src/internal/render-children.test.tsx`:

```tsx
import { describe, expect, it, vi } from 'vitest';

import { renderChildren } from './render-children';

describe('renderChildren', () => {
	it('passes ordinary children through', () => {
		expect(renderChildren('text', { n: 1 })).toBe('text');
	});

	it('calls a function child with the state once', () => {
		const child = vi.fn((state: { n: number }) => `n=${state.n}`);
		expect(renderChildren(child, { n: 2 })).toBe('n=2');
		expect(child).toHaveBeenCalledOnce();
	});

	it('leaves a function without parameters to Solid (it is an ordinary child)', () => {
		const child = (): string => 'lazy';
		expect(renderChildren(child, { n: 3 })).toBe(child);
	});
});
```

- [ ] **Step 2: Запустить, убедиться, что падают**

Run: `pnpm exec vitest run src/internal`
Expected: FAIL (модулей нет).

- [ ] **Step 3: Реализовать чистые функции**

Создать `src/internal/floating-panel/focus-initial.ts`:

```ts
export type InitialFocus = 'first' | 'panel' | 'none';

const TABBABLE = 'a[href], button, input:not([type="hidden"]), select, textarea, summary, [tabindex], [contenteditable=""], [contenteditable="true"]';

function isTabbable(element: HTMLElement): boolean {
	if (element.tabIndex < 0 || element.matches(':disabled')) {
		return false;
	}
	return element.closest('[hidden], [inert]') === null;
}

/** Первый табулируемый элемент панели, а если его нет, сама панель (ей ставится `tabindex="-1"`). Прокрутка страницы не нужна. */
export function focusInitial(panel: HTMLElement, mode: InitialFocus): void {
	if (mode === 'none') {
		return;
	}
	const target = mode === 'first' ? Array.from(panel.querySelectorAll<HTMLElement>(TABBABLE)).find(isTabbable) : undefined;
	if (target) {
		target.focus({ preventScroll: true });
		return;
	}
	if (!panel.hasAttribute('tabindex')) {
		panel.setAttribute('tabindex', '-1');
	}
	panel.focus({ preventScroll: true });
}
```

Создать `src/internal/floating-panel/blocks-implicit-submit.ts`:

```ts
/**
 * Enter в поле внутри панели, чья форма-владелец лежит снаружи панели (панель смонтирована в хосте, который сам внутри `<form>`),
 * иначе отправил бы эту форму (критерий 6 (в) зонтичного спека). Кнопки и `textarea` не трогаются.
 */
export function blocksImplicitSubmit(event: KeyboardEvent, panel: HTMLElement): boolean {
	const target = event.target;
	if (event.key !== 'Enter' || !(target instanceof HTMLInputElement || target instanceof HTMLSelectElement)) {
		return false;
	}
	return target.form !== null && !panel.contains(target.form);
}
```

Создать `src/internal/floating-panel/panel-isolation.ts`:

```ts
import type { JSX } from 'solid-js';

/** События, которые корень панели изолирует делегированными обработчиками Solid (спек этапа 2, раздел 3.3). `onKeyDown` обрабатывает сам FloatingPanel. */
export type IsolatedEventProp = 'onClick' | 'onDblClick' | 'onContextMenu' | 'onPointerDown' | 'onMouseDown' | 'onKeyUp' | 'onInput' | 'onFocusIn' | 'onFocusOut';

function stop(event: Event): void {
	event.stopPropagation();
}

/**
 * Делегированные обработчики Solid (не нативные): обработчики внутри панели срабатывают раньше, а обработчики логических предков нет.
 * Нативный stopPropagation на корне запрещён: он лишил бы событие пути до слушателя Solid на document (зонтичный, раздел 8.3).
 */
export const isolationHandlers: Pick<JSX.HTMLAttributes<HTMLDivElement>, IsolatedEventProp> = {
	onClick: stop,
	onDblClick: stop,
	onContextMenu: stop,
	onPointerDown: stop,
	onMouseDown: stop,
	onKeyUp: stop,
	onInput: stop,
	onFocusIn: stop,
	onFocusOut: stop
};
```

Создать `src/internal/render-children.ts`:

```ts
import { type JSX, untrack } from 'solid-js';

/**
 * Контракт функции-ребёнка (зонтичный, раздел 11.1): функция с параметром получает состояние и вызывается один раз через `untrack`;
 * функцию без параметров Solid разворачивает сам как обычного ребёнка.
 */
export function renderChildren<State>(children: JSX.Element | ((state: State) => JSX.Element), state: State): JSX.Element {
	if (typeof children === 'function' && children.length > 0) {
		return untrack(() => (children as (state: State) => JSX.Element)(state));
	}
	return children as JSX.Element;
}
```

- [ ] **Step 4: Хуки фокуса**

Создать `src/internal/floating-panel/create-focus-on-open.ts`:

```ts
import { type Accessor, createEffect, untrack } from 'solid-js';

import { focusInitial, type InitialFocus } from './focus-initial';

export interface FocusOnOpenOptions {
	panel: Accessor<HTMLElement | undefined>;
	open: Accessor<boolean>;
	mode: Accessor<InitialFocus>;
}

/** Переносит фокус в панель после показа. Создавать после createPanelLayer: до showPopover() панель скрыта и не фокусируется. */
export function createFocusOnOpen(options: FocusOnOpenOptions): void {
	createEffect(() => {
		const panel = options.panel();
		if (!options.open() || !panel) {
			return;
		}
		focusInitial(panel, untrack(options.mode));
	});
}
```

Создать `src/internal/floating-panel/create-focus-restore.ts`:

```ts
import { type Accessor, createEffect, onCleanup } from 'solid-js';

export interface FocusRestoreOptions {
	panel: Accessor<HTMLElement | undefined>;
	anchor: Accessor<Element | undefined>;
	open: Accessor<boolean>;
}

/**
 * Возвращает фокус на инициатор при закрытии панели, если фокус потерян (активен body: панель удалена из DOM)
 * или всё ещё внутри панели. Если клик снаружи уже перевёл фокус на другой элемент, фокус не перехватывается.
 */
export function createFocusRestore(options: FocusRestoreOptions): void {
	createEffect(() => {
		if (!options.open()) {
			return;
		}
		onCleanup(() => {
			const anchor = options.anchor();
			const active = document.activeElement;
			const lost = !active || active === document.body || (options.panel()?.contains(active) ?? false);
			if (lost && anchor instanceof HTMLElement && anchor.isConnected) {
				anchor.focus({ preventScroll: true });
			}
		});
	});
}
```

- [ ] **Step 5: CSS основы панели**

Создать `src/internal/floating-panel/panel-base.module.css`:

```css
/*
 * Общая основа плавающих панелей (спек этапа 2, раздел 3.3): сброс UA-стилей [popover] и наследуемых свойств (зонтичный, раздел 8.2),
 * материал панели (раздел 4.3). Подключается через composes: `panel` задаёт сброс, `material` тень и размытие.
 * Фон, отступы, ширину и скругление задаёт компонент своими токенами.
 * Базовые правила обёрнуты в :where() (специфичность 0), как основа контролов: в dev-режиме Vite кладёт копию основы
 * в стиль каждого подключающего компонента, и порядок правил не должен иметь значения.
 */

:where(.panel) {
    /* сброс UA-стилей [popover]; позицию задаёт Floating UI inline-стилями */
    inset: auto;

    overflow: auto;

    box-sizing: border-box;
    margin: 0;
    padding: 0;
    border: 0;

    /* сброс наследуемых свойств с предков хоста; токены --s-kit-* и color-scheme намеренно не сбрасываются */
    font-family: var(--s-kit-font);
    font-size: var(--s-kit-font-size);
    font-weight: 400;
    font-style: normal;
    line-height: var(--s-kit-line-height);
    color: var(--s-kit-color-text);
    text-align: start;
    text-indent: 0;
    text-shadow: none;
    text-transform: none;
    letter-spacing: normal;
    word-break: normal;
    white-space: normal;

    /* предок хоста может быть под оверлеем загрузки или в заблокированном блоке */
    pointer-events: auto;
    cursor: auto;
    visibility: visible;
}

:where(.material) {
    box-shadow: var(--s-kit-shadow-popover);
}

@supports (backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)) {
    @media not (prefers-reduced-transparency: reduce) {
        :where(.material) {
            -webkit-backdrop-filter: blur(var(--s-kit-panel-blur));
            backdrop-filter: blur(var(--s-kit-panel-blur));
        }
    }
}
```

- [ ] **Step 6: Падающие тесты FloatingPanel**

Создать `src/internal/floating-panel/floating-panel.test.tsx`:

```tsx
import { cleanup, createEvent, fireEvent, render, screen } from '@solidjs/testing-library';
import { createSignal, type JSX } from 'solid-js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PanelHostContext } from '../panel/panel-host';

import { FloatingPanel } from './floating-panel';

beforeEach(() => {
	// jsdom не реализует Popover API
	HTMLElement.prototype.showPopover = vi.fn();
	HTMLElement.prototype.hidePopover = vi.fn();
});

afterEach(cleanup);

interface Harness {
	onDismiss: ReturnType<typeof vi.fn>;
	setOpen: (open: boolean) => void;
}

function renderPanel(options: { open?: boolean; wrap?: (inner: JSX.Element) => JSX.Element; children?: JSX.Element } = {}): Harness {
	const onDismiss = vi.fn();
	const [open, setOpen] = createSignal(options.open ?? true);
	const [anchor, setAnchor] = createSignal<HTMLElement>();
	const wrap = options.wrap ?? ((inner: JSX.Element) => inner);
	render(() =>
		wrap(
			<>
				<button type='button' ref={setAnchor}>anchor</button>
				<FloatingPanel open={open} onDismiss={onDismiss} anchor={anchor} data-testid='panel'>
					{options.children ?? 'content'}
				</FloatingPanel>
			</>
		)
	);
	return { onDismiss, setOpen };
}

describe('FloatingPanel', () => {
	it('renders only while open and removes the panel when closed', () => {
		const { setOpen } = renderPanel({ open: false });
		expect(screen.queryByTestId('panel')).toBeNull();
		setOpen(true);
		expect(screen.getByTestId('panel')).toBeTruthy();
		setOpen(false);
		expect(screen.queryByTestId('panel')).toBeNull();
	});

	it('mounts the panel into the parent of the anchor, through a display: contents wrapper', () => {
		renderPanel({ wrap: (inner) => <section data-testid='host'>{inner}</section> });
		const panel = screen.getByTestId('panel');
		const host = screen.getByTestId('host');
		expect(panel.parentElement?.parentElement).toBe(host);
		expect(panel.parentElement?.style.display).toBe('contents');
		expect(screen.getByText('anchor').contains(panel)).toBe(false);
	});

	it('skips a label ancestor: the panel is not a descendant of the label', () => {
		renderPanel({ wrap: (inner) => <section data-testid='host'><label data-testid='label'>{inner}</label></section> });
		const panel = screen.getByTestId('panel');
		expect(screen.getByTestId('label').contains(panel)).toBe(false);
		expect(panel.parentElement?.parentElement).toBe(screen.getByTestId('host'));
	});

	it('mounts into the host given by PanelHostContext', () => {
		const custom = document.createElement('aside');
		document.body.append(custom);
		renderPanel({ wrap: (inner) => <PanelHostContext.Provider value={() => custom}>{inner}</PanelHostContext.Provider> });
		expect(custom.contains(screen.getByTestId('panel'))).toBe(true);
		custom.remove();
	});

	it('puts data-s-kit, the size attribute, class and style on the root and passes other attributes through', () => {
		const [anchor, setAnchor] = createSignal<HTMLElement>();
		render(() => (
			<>
				<button type='button' ref={setAnchor}>anchor</button>
				<FloatingPanel
					open={() => true}
					onDismiss={() => {}}
					anchor={anchor}
					size='lg'
					class='x'
					style={{ color: 'red' }}
					aria-label='Панель'
					data-testid='panel'
				>
					c
				</FloatingPanel>
			</>
		));
		const panel = screen.getByTestId('panel');
		expect(panel.hasAttribute('data-s-kit')).toBe(true);
		expect(panel.getAttribute('data-s-kit-size')).toBe('lg');
		expect(panel.className).toBe('x');
		expect(panel.style.color).toBe('red');
		expect(panel.getAttribute('aria-label')).toBe('Панель');
	});

	it('isolates delegated events from logical ancestors but not from handlers inside', () => {
		const onParentClick = vi.fn();
		const onInnerClick = vi.fn();
		renderPanel({
			wrap: (inner) => <div onClick={onParentClick}>{inner}</div>,
			children: <button type='button' onClick={onInnerClick}>inside</button>
		});
		fireEvent.click(screen.getByText('inside'));
		expect(onInnerClick).toHaveBeenCalledOnce();
		expect(onParentClick).not.toHaveBeenCalled();
		fireEvent.click(screen.getByText('anchor'));
		expect(onParentClick).toHaveBeenCalledOnce();
	});

	it('runs the own keydown handler first and then stops the event from reaching ancestors', () => {
		const onParentKeyDown = vi.fn();
		const onKeyDown = vi.fn();
		const [anchor, setAnchor] = createSignal<HTMLElement>();
		render(() => (
			<div onKeyDown={onParentKeyDown}>
				<button type='button' ref={setAnchor}>anchor</button>
				<FloatingPanel open={() => true} onDismiss={() => {}} anchor={anchor} onKeyDown={onKeyDown} data-testid='panel'>
					<button type='button'>inside</button>
				</FloatingPanel>
			</div>
		));
		fireEvent.keyDown(screen.getByText('inside'), { key: 'a' });
		expect(onKeyDown).toHaveBeenCalledOnce();
		expect(onParentKeyDown).not.toHaveBeenCalled();
	});

	it('Escape and a click outside dismiss, a click on the anchor does not', () => {
		const { onDismiss } = renderPanel();
		fireEvent.pointerDown(screen.getByText('anchor'));
		expect(onDismiss).not.toHaveBeenCalled();
		fireEvent.pointerDown(document.body);
		expect(onDismiss).toHaveBeenCalledOnce();
		fireEvent.keyDown(document.body, { key: 'Escape' });
		expect(onDismiss).toHaveBeenCalledTimes(2);
	});

	it('focuses the first tabbable element on open and returns the focus to the anchor on close', () => {
		const { setOpen } = renderPanel({ children: <button type='button'>inside</button> });
		expect(document.activeElement).toBe(screen.getByText('inside'));
		setOpen(false);
		expect(document.activeElement).toBe(screen.getByText('anchor'));
	});

	it('does not take the focus back when it already moved to another element', () => {
		const { setOpen } = renderPanel({ wrap: (inner) => <>{inner}<input aria-label='other'/></> });
		const other = screen.getByLabelText('other');
		other.focus();
		setOpen(false);
		expect(document.activeElement).toBe(other);
	});

	it('cancels Enter in an input whose form is outside the panel, so that the host form is not submitted', () => {
		renderPanel({
			wrap: (inner) => <form>{inner}</form>,
			children: <input aria-label='name'/>
		});
		const event = createEvent.keyDown(screen.getByLabelText('name'), { key: 'Enter' });
		fireEvent(screen.getByLabelText('name'), event);
		expect(event.defaultPrevented).toBe(true);
	});
});
```

- [ ] **Step 7: Запустить, убедиться, что падают**

Run: `pnpm exec vitest run src/internal/floating-panel`
Expected: FAIL (`floating-panel` не существует; тесты чистых функций из Step 1 при этом проходят).

- [ ] **Step 8: Реализовать FloatingPanel**

Создать `src/internal/floating-panel/floating-panel.tsx`:

```tsx
import type { Placement } from '@floating-ui/dom';
import { type Accessor, createSignal, type JSX, Show, splitProps } from 'solid-js';

import { type AnchorElement, createAnchoredPosition } from '../../utils/create-anchored-position';
import { createPanelLayer } from '../../utils/create-panel-layer';
import { PanelPortal } from '../panel/panel-portal';

import { blocksImplicitSubmit } from './blocks-implicit-submit';
import { createFocusOnOpen } from './create-focus-on-open';
import { createFocusRestore } from './create-focus-restore';
import type { InitialFocus } from './focus-initial';
import { type IsolatedEventProp, isolationHandlers } from './panel-isolation';

/** Атрибуты корня панели, которые компонент может принять от пользователя: события, занятые изоляцией, и `ref` исключены. */
export type FloatingPanelAttributes = Omit<
	JSX.HTMLAttributes<HTMLDivElement>,
	IsolatedEventProp | 'onKeyDown' | 'ref' | 'class' | 'style' | 'children'
>;

export interface FloatingPanelProps extends FloatingPanelAttributes {
	open: Accessor<boolean>;
	/** Клик снаружи или Esc. */
	onDismiss: () => void;
	/** Якорь позиционирования: элемент или виртуальный (точка клика). */
	anchor: Accessor<AnchorElement | undefined>;
	/** Реальный элемент инициатора для выбора хоста, исключения из dismiss и возврата фокуса; по умолчанию сам якорь, если он элемент. */
	anchorElement?: Accessor<Element | undefined> | undefined;
	placement?: Placement | undefined;
	gap?: number | undefined;
	matchAnchorWidth?: boolean | undefined;
	size?: 'sm' | 'md' | 'lg' | undefined;
	/** Куда переносится фокус при открытии, по умолчанию на первый табулируемый элемент. */
	initialFocus?: InitialFocus | undefined;
	/** Вызывается раньше изоляции: меню обрабатывает навигацию здесь. */
	onKeyDown?: ((event: KeyboardEvent & { currentTarget: HTMLDivElement }) => void) | undefined;
	panelRef?: ((element: HTMLDivElement) => void) | undefined;
	class?: string | undefined;
	style?: JSX.CSSProperties | undefined;
	children?: JSX.Element;
}

/**
 * Плавающая панель: показ в top layer и стек слоёв, позиционирование, хост, изоляция событий, фокус (спек этапа 2, раздел 3).
 * Класс из `class` должен подключать `panel` (и `material`) из panel-base.module.css через composes.
 */
export function FloatingPanel(props: FloatingPanelProps): JSX.Element {
	const [local, rest] = splitProps(props, [
		'open',
		'onDismiss',
		'anchor',
		'anchorElement',
		'placement',
		'gap',
		'matchAnchorWidth',
		'size',
		'initialFocus',
		'onKeyDown',
		'panelRef',
		'class',
		'style',
		'children'
	]);
	const [panel, setPanel] = createSignal<HTMLDivElement>();

	const anchorElement = (): Element | undefined => {
		const explicit = local.anchorElement?.();
		if (explicit) {
			return explicit;
		}
		const anchor = local.anchor();
		return anchor instanceof Element ? anchor : undefined;
	};

	createAnchoredPosition({
		anchor: local.anchor,
		floating: panel,
		open: local.open,
		get placement() {
			return local.placement;
		},
		get gap() {
			return local.gap;
		},
		get matchAnchorWidth() {
			return local.matchAnchorWidth;
		}
	});
	createPanelLayer({ panel, anchor: anchorElement, open: local.open, onDismiss: local.onDismiss });
	createFocusOnOpen({ panel, open: local.open, mode: () => local.initialFocus ?? 'first' });
	createFocusRestore({ panel, anchor: anchorElement, open: local.open });

	return (
		<Show when={local.open()}>
			<PanelPortal anchor={anchorElement}>
				<div
					{...rest}
					{...isolationHandlers}
					ref={(element) => {
						setPanel(element);
						local.panelRef?.(element);
					}}
					data-s-kit
					data-s-kit-size={local.size}
					class={local.class}
					style={local.style}
					onKeyDown={(event) => {
						local.onKeyDown?.(event);
						if (blocksImplicitSubmit(event, event.currentTarget)) {
							event.preventDefault();
						}
						event.stopPropagation();
					}}
				>
					{local.children}
				</div>
			</PanelPortal>
		</Show>
	);
}
```

- [ ] **Step 9: Запустить тесты, проверку типов и линт**

Run: `pnpm exec vitest run src/internal && pnpm typecheck && pnpm exec eslint src/internal --max-warnings 0 && pnpm exec stylelint "src/internal/**/*.css"`
Expected: PASS. Если `typecheck` ругается на типы `onKeyDown`/`ref`/`Portal`, поправить типы, не меняя поведения. Если тест «returns the focus to the anchor» падает, прочитать комментарий в `create-focus-restore.ts`: порядок удаления DOM и пользовательских эффектов должен давать `document.activeElement === body` в очистке; зафиксировать фактическое поведение в итогах плана.

- [ ] **Step 10: Коммит**

```bash
git add src/internal
git commit -m "feat(overlays): FloatingPanel: изоляция событий, сброс свойств, фокус, защита от неявной отправки формы" -m "$TRAILERS"
```

---

### Task 4: Popover

**Files:**
- Create: `src/components/popover/popover-context.ts`, `popover-state.ts`, `use-popover.ts`
- Create: `src/components/popover/popover-root.tsx`, `popover-trigger.tsx`, `popover-content.tsx`
- Create: `src/components/popover/popover.module.css`, `index.ts`
- Test: `src/components/popover/popover.test.tsx`

**Interfaces:**
- Consumes: `FloatingPanel`, `FloatingPanelAttributes` из `../../internal/floating-panel/floating-panel`; `renderChildren` из `../../internal/render-children`; `Button`, `ButtonProps` из `../button/button`; `createControllableSignal`.
- Produces: `Popover = { Root, Trigger, Content }`, `usePopover(): PopoverState`; типы `PopoverRootProps`, `PopoverTriggerProps`, `PopoverTriggerAttributes`, `PopoverContentProps`, `PopoverState`; публичный путь `@stark/solid-kit/popover`; токены `--s-kit-popover-bg`, `-padding`, `-min-width`, `-max-width`, `-radius`; атрибут `data-s-kit-popover-content` на панели.

- [ ] **Step 1: Падающие тесты**

Создать `src/components/popover/popover.test.tsx`:

```tsx
import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Popover, usePopover } from './index';

beforeEach(() => {
	// jsdom не реализует Popover API
	HTMLElement.prototype.showPopover = vi.fn();
	HTMLElement.prototype.hidePopover = vi.fn();
});

afterEach(cleanup);

function CloseButton() {
	const popover = usePopover();
	return <button type='button' onClick={popover.close}>close-hook</button>;
}

describe('Popover', () => {
	it('is closed by default and toggles on the trigger click (uncontrolled), wiring aria-expanded and aria-controls', () => {
		render(() => (
			<Popover.Root>
				<Popover.Trigger>Open</Popover.Trigger>
				<Popover.Content>content</Popover.Content>
			</Popover.Root>
		));
		const trigger = screen.getByRole('button', { name: 'Open' });
		expect(trigger.getAttribute('aria-expanded')).toBe('false');
		expect(screen.queryByText('content')).toBeNull();
		fireEvent.click(trigger);
		expect(trigger.getAttribute('aria-expanded')).toBe('true');
		const panel = screen.getByText('content');
		expect(trigger.getAttribute('aria-controls')).toBe(panel.id);
		expect(trigger.hasAttribute('data-popover-open')).toBe(true);
		fireEvent.click(trigger);
		expect(screen.queryByText('content')).toBeNull();
		expect(trigger.hasAttribute('data-popover-open')).toBe(false);
	});

	it('controlled: the trigger click only reports the change, the prop decides', () => {
		const onOpenChange = vi.fn();
		render(() => (
			<Popover.Root open={false} onOpenChange={onOpenChange}>
				<Popover.Trigger>Open</Popover.Trigger>
				<Popover.Content>content</Popover.Content>
			</Popover.Root>
		));
		fireEvent.click(screen.getByRole('button', { name: 'Open' }));
		expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(true);
		expect(screen.queryByText('content')).toBeNull();
	});

	it('defaultOpen starts open and onOpenChange reports the closing', () => {
		const onOpenChange = vi.fn();
		render(() => (
			<Popover.Root defaultOpen onOpenChange={onOpenChange}>
				<Popover.Trigger>Open</Popover.Trigger>
				<Popover.Content>content</Popover.Content>
			</Popover.Root>
		));
		expect(screen.getByText('content')).toBeTruthy();
		fireEvent.keyDown(document.body, { key: 'Escape' });
		expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
		expect(screen.queryByText('content')).toBeNull();
	});

	it('a click outside closes it, a pointerdown on the trigger does not close it by itself', () => {
		render(() => (
			<Popover.Root defaultOpen>
				<Popover.Trigger>Open</Popover.Trigger>
				<Popover.Content>content</Popover.Content>
			</Popover.Root>
		));
		fireEvent.pointerDown(screen.getByRole('button', { name: 'Open' }));
		expect(screen.getByText('content')).toBeTruthy();
		fireEvent.pointerDown(document.body);
		expect(screen.queryByText('content')).toBeNull();
	});

	it('moves the focus into the panel on open and returns it to the trigger on Escape', () => {
		render(() => (
			<Popover.Root>
				<Popover.Trigger>Open</Popover.Trigger>
				<Popover.Content>
					<button type='button'>inside</button>
				</Popover.Content>
			</Popover.Root>
		));
		const trigger = screen.getByRole('button', { name: 'Open' });
		fireEvent.click(trigger);
		expect(document.activeElement).toBe(screen.getByRole('button', { name: 'inside' }));
		fireEvent.keyDown(document.body, { key: 'Escape' });
		expect(document.activeElement).toBe(trigger);
	});

	it('a custom trigger through render receives the attributes and ref', () => {
		render(() => (
			<Popover.Root>
				<Popover.Trigger render={(attributes) => <span {...attributes} data-testid='custom' role='button'>custom</span>}/>
				<Popover.Content>content</Popover.Content>
			</Popover.Root>
		));
		const custom = screen.getByTestId('custom');
		expect(custom.getAttribute('aria-expanded')).toBe('false');
		fireEvent.click(custom);
		expect(custom.getAttribute('aria-expanded')).toBe('true');
		expect(screen.getByText('content')).toBeTruthy();
	});

	it('a user onClick runs first and event.preventDefault() cancels the toggle', () => {
		render(() => (
			<Popover.Root>
				<Popover.Trigger onClick={(event) => {
					event.preventDefault();
				}}
				>
					Open
				</Popover.Trigger>
				<Popover.Content>content</Popover.Content>
			</Popover.Root>
		));
		fireEvent.click(screen.getByRole('button', { name: 'Open' }));
		expect(screen.queryByText('content')).toBeNull();
	});

	it('a function child receives the state, and usePopover works anywhere inside', () => {
		render(() => (
			<Popover.Root defaultOpen>
				<Popover.Trigger>Open</Popover.Trigger>
				<Popover.Content>
					{(state) => (
						<>
							<button type='button' onClick={state.close}>close-state</button>
							<CloseButton/>
						</>
					)}
				</Popover.Content>
			</Popover.Root>
		));
		fireEvent.click(screen.getByRole('button', { name: 'close-state' }));
		expect(screen.queryByRole('button', { name: 'close-state' })).toBeNull();
	});

	it('usePopover closes the popover and reports the state', () => {
		render(() => (
			<Popover.Root defaultOpen>
				<Popover.Trigger>Open</Popover.Trigger>
				<Popover.Content>
					<CloseButton/>
				</Popover.Content>
			</Popover.Root>
		));
		fireEvent.click(screen.getByRole('button', { name: 'close-hook' }));
		expect(screen.queryByRole('button', { name: 'close-hook' })).toBeNull();
	});

	it('puts data-s-kit, the content marker, size, class and style on the panel', () => {
		render(() => (
			<Popover.Root defaultOpen>
				<Popover.Trigger>Open</Popover.Trigger>
				<Popover.Content size='lg' class='extra' style={{ color: 'red' }} aria-label='Фильтры'>content</Popover.Content>
			</Popover.Root>
		));
		const panel = screen.getByText('content');
		expect(panel.hasAttribute('data-s-kit')).toBe(true);
		expect(panel.hasAttribute('data-s-kit-popover-content')).toBe(true);
		expect(panel.getAttribute('data-s-kit-size')).toBe('lg');
		expect(panel.className).toContain('extra');
		expect(panel.style.color).toBe('red');
		expect(panel.getAttribute('aria-label')).toBe('Фильтры');
	});

	it('mounts the panel next to the trigger, not inside a label around it', () => {
		render(() => (
			<section data-testid='host'>
				<label data-testid='label'>
					<Popover.Root defaultOpen>
						<Popover.Trigger>Open</Popover.Trigger>
						<Popover.Content>content</Popover.Content>
					</Popover.Root>
				</label>
			</section>
		));
		const panel = screen.getByText('content');
		expect(screen.getByTestId('label').contains(panel)).toBe(false);
		expect(screen.getByTestId('host').contains(panel)).toBe(true);
	});

	it('a click inside the panel does not reach the handlers of logical ancestors', () => {
		const onCardClick = vi.fn();
		const onCardDoubleClick = vi.fn();
		render(() => (
			<div onClick={onCardClick} onDblClick={onCardDoubleClick}>
				<Popover.Root defaultOpen>
					<Popover.Trigger>Open</Popover.Trigger>
					<Popover.Content>
						<button type='button'>inside</button>
					</Popover.Content>
				</Popover.Root>
			</div>
		));
		fireEvent.click(screen.getByRole('button', { name: 'inside' }));
		fireEvent.dblClick(screen.getByRole('button', { name: 'inside' }));
		expect(onCardClick).not.toHaveBeenCalled();
		expect(onCardDoubleClick).not.toHaveBeenCalled();
	});

	it('Popover.Content and usePopover outside Popover.Root throw a clear error', () => {
		const silence = vi.spyOn(console, 'error').mockImplementation(() => {});
		expect(() => render(() => <Popover.Content>x</Popover.Content>)).toThrow('Popover.Content must be used inside Popover.Root');
		expect(() => render(() => <CloseButton/>)).toThrow('usePopover must be used inside Popover.Root');
		silence.mockRestore();
	});
});
```

- [ ] **Step 2: Запустить, убедиться, что падает**

Run: `pnpm exec vitest run src/components/popover`
Expected: FAIL (компонента нет).

- [ ] **Step 3: Контекст, состояние, хук**

Создать `src/components/popover/popover-state.ts`:

```ts
import type { Accessor } from 'solid-js';

export interface PopoverState {
	open: Accessor<boolean>;
	close: () => void;
}
```

Создать `src/components/popover/popover-context.ts`:

```ts
import type { Placement } from '@floating-ui/dom';
import { type Accessor, createContext, useContext } from 'solid-js';

export interface PopoverContextValue {
	open: Accessor<boolean>;
	setOpen: (open: boolean) => void;
	/** Идентификатор панели: инициатор ссылается на него через `aria-controls`. */
	contentId: string;
	anchor: Accessor<HTMLElement | undefined>;
	setAnchor: (element: HTMLElement | undefined) => void;
	placement: Accessor<Placement | undefined>;
	gap: Accessor<number | undefined>;
}

export const PopoverContext = createContext<PopoverContextValue>();

export function usePopoverContext(part: string): PopoverContextValue {
	const context = useContext(PopoverContext);
	if (!context) {
		throw new Error(`${part} must be used inside Popover.Root`);
	}
	return context;
}
```

Создать `src/components/popover/use-popover.ts`:

```ts
import { usePopoverContext } from './popover-context';
import type { PopoverState } from './popover-state';

/** Состояние ближайшего `Popover.Root`: для кнопок и разметки внутри содержимого. */
export function usePopover(): PopoverState {
	const context = usePopoverContext('usePopover');
	return {
		open: context.open,
		close: () => {
			context.setOpen(false);
		}
	};
}
```

- [ ] **Step 4: Root**

Создать `src/components/popover/popover-root.tsx`:

```tsx
import type { Placement } from '@floating-ui/dom';
import { createSignal, createUniqueId, type JSX } from 'solid-js';

import { createControllableSignal } from '../../utils/create-controllable-signal';

import { PopoverContext, type PopoverContextValue } from './popover-context';

export interface PopoverRootProps {
	open?: boolean | undefined;
	defaultOpen?: boolean | undefined;
	onOpenChange?: ((open: boolean) => void) | undefined;
	/** По умолчанию `bottom-start`. */
	placement?: Placement | undefined;
	/** Зазор между инициатором и панелью, по умолчанию 4. */
	gap?: number | undefined;
	children?: JSX.Element;
}

export function PopoverRoot(props: PopoverRootProps): JSX.Element {
	const [open, setOpen] = createControllableSignal<boolean>({
		name: 'Popover',
		value: () => props.open,
		defaultValue: () => props.defaultOpen ?? false,
		onChange: (next) => props.onOpenChange?.(next)
	});
	const [anchor, setAnchor] = createSignal<HTMLElement>();

	const context: PopoverContextValue = {
		open,
		setOpen,
		contentId: `${createUniqueId()}-popover`,
		anchor,
		setAnchor: (element) => {
			setAnchor(element);
		},
		placement: () => props.placement,
		gap: () => props.gap
	};

	return <PopoverContext.Provider value={context}>{props.children}</PopoverContext.Provider>;
}
```

- [ ] **Step 5: Trigger**

Создать `src/components/popover/popover-trigger.tsx`:

```tsx
import { type JSX, onCleanup, splitProps } from 'solid-js';

import { Button, type ButtonProps } from '../button/button';

import { usePopoverContext } from './popover-context';

/** Атрибуты, которые инициатор передаёт своему «рендеру»: их нужно повесить на корневой элемент пользовательского инициатора. */
export interface PopoverTriggerAttributes {
	ref: (element: HTMLElement) => void;
	'aria-expanded': boolean;
	'aria-controls': string;
	'data-popover-open': '' | undefined;
	onClick: JSX.EventHandler<HTMLElement, MouseEvent>;
}

export interface PopoverTriggerProps extends Omit<ButtonProps, 'onClick'> {
	onClick?: JSX.EventHandler<HTMLElement, MouseEvent> | undefined;
	/** Свой инициатор вместо Button: `render={(attributes) => <IconButton {...attributes} aria-label='Меню'>…</IconButton>}`. */
	render?: ((attributes: PopoverTriggerAttributes) => JSX.Element) | undefined;
}

export function PopoverTrigger(props: PopoverTriggerProps): JSX.Element {
	const context = usePopoverContext('Popover.Trigger');
	const [local, rest] = splitProps(props, ['render', 'onClick']);

	onCleanup(() => {
		context.setAnchor(undefined);
	});

	const attributes: PopoverTriggerAttributes = {
		ref: (element) => {
			context.setAnchor(element);
		},
		get 'aria-expanded'() {
			return context.open();
		},
		'aria-controls': context.contentId,
		get 'data-popover-open'() {
			return context.open() ? '' : undefined;
		},
		onClick: (event) => {
			local.onClick?.(event);
			if (!event.defaultPrevented) {
				context.setOpen(!context.open());
			}
		}
	};

	return local.render ? local.render(attributes) : <Button {...rest} {...attributes}/>;
}
```

- [ ] **Step 6: Content и CSS**

Создать `src/components/popover/popover-content.tsx`:

```tsx
import styles from './popover.module.css';

import { type JSX, splitProps } from 'solid-js';

import { FloatingPanel, type FloatingPanelAttributes } from '../../internal/floating-panel/floating-panel';
import { renderChildren } from '../../internal/render-children';

import { usePopoverContext } from './popover-context';
import type { PopoverState } from './popover-state';

export interface PopoverContentProps extends FloatingPanelAttributes {
	size?: 'sm' | 'md' | 'lg' | undefined;
	matchAnchorWidth?: boolean | undefined;
	class?: string | undefined;
	style?: JSX.CSSProperties | undefined;
	children?: JSX.Element | ((state: PopoverState) => JSX.Element);
}

export function PopoverContent(props: PopoverContentProps): JSX.Element {
	const context = usePopoverContext('Popover.Content');
	const [local, rest] = splitProps(props, ['size', 'matchAnchorWidth', 'class', 'style', 'children']);
	const state: PopoverState = {
		open: context.open,
		close: () => {
			context.setOpen(false);
		}
	};

	return (
		<FloatingPanel
			{...rest}
			id={context.contentId}
			data-s-kit-popover-content
			open={context.open}
			onDismiss={state.close}
			anchor={context.anchor}
			placement={context.placement()}
			gap={context.gap()}
			matchAnchorWidth={local.matchAnchorWidth}
			size={local.size}
			class={local.class ? `${styles['content']} ${local.class}` : styles['content']}
			style={local.style}
		>
			{renderChildren(local.children, state)}
		</FloatingPanel>
	);
}
```

Создать `src/components/popover/popover.module.css`:

```css
/*
 * Компонентные токены Popover (публичный API кастомизации):
 *   --s-kit-popover-bg, --s-kit-popover-padding, --s-kit-popover-min-width, --s-kit-popover-max-width, --s-kit-popover-radius
 * Сброс свойств, тень и размытие приходят из основы панелей (src/internal/floating-panel/panel-base.module.css).
 */

.content {
    composes: panel material from "../../internal/floating-panel/panel-base.module.css";

    user-select: text;

    min-inline-size: var(--s-kit-popover-min-width, 0);
    max-inline-size: var(--s-kit-popover-max-width, min(90vw, 480px));
    padding: var(--s-kit-popover-padding, 12px);
    border-radius: var(--s-kit-popover-radius, calc(var(--s-kit-radius) * 1.5));

    /* запасной сплошной фон, затем полупрозрачный материал (зонтичный, раздел 4.3) */
    background: var(--s-kit-popover-bg, var(--s-kit-color-surface));
}

@supports (backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)) {
    @media not (prefers-reduced-transparency: reduce) {
        .content {
            background: var(--s-kit-popover-bg, var(--s-kit-color-panel));
        }
    }
}
```

Создать `src/components/popover/index.ts`:

```ts
import { PopoverContent } from './popover-content';
import { PopoverRoot } from './popover-root';
import { PopoverTrigger } from './popover-trigger';

export type { PopoverContentProps } from './popover-content';
export type { PopoverRootProps } from './popover-root';
export type { PopoverState } from './popover-state';
export type { PopoverTriggerAttributes, PopoverTriggerProps } from './popover-trigger';
export { usePopover } from './use-popover';

export const Popover = { Root: PopoverRoot, Trigger: PopoverTrigger, Content: PopoverContent };
```

- [ ] **Step 7: Запустить тесты, типы, линт**

Run: `pnpm exec vitest run src/components/popover && pnpm typecheck && pnpm exec eslint src --max-warnings 0 && pnpm exec stylelint "src/**/*.css"`
Expected: PASS. Типы `JSX.EventHandler<HTMLElement, MouseEvent>` против `ButtonProps['onClick']` и `ref` у `Button` при необходимости поправить без смены поведения; если тест с ошибкой вне Root падает не на тексте ошибки, а на обёртке testing-library, проверять `toThrow` по подстроке.

- [ ] **Step 8: Коммит**

```bash
git add src/components/popover
git commit -m "feat(popover): Popover: Root, Trigger (Button или render), Content на основе FloatingPanel, хук usePopover" -m "$TRAILERS"
```

---

### Task 5: Замена Probe на Popover: страница «Темы», матрица, README

**Files:**
- Modify: `playground/src/themes-page.tsx`, `playground/src/theme-checks.ts`
- Modify: `scripts/consumer/src/main.tsx`, `scripts/verify-package-form.sh`
- Modify: `README.md`
- Delete: `src/components/probe/` (весь каталог, включая `probe.test.tsx`)

**Interfaces:**
- Consumes: `Popover`, `usePopover` из `@stark/solid-kit/popover`.
- Produces: страница «Темы» и матрица без `Probe`; `probe-unused` остаётся до части 2.

- [ ] **Step 1: Записать базу на странице «Темы» до замены**

Запустить playground (`pnpm dev`, порт взять из вывода Vite), открыть `#themes`, запустить проверки с клавиатуры. Записать число проверок и убедиться, что FAIL нет: система, светлая и тёмная темы (после переключения ждать 1,5–2 с). Это база для сравнения после замены.

- [ ] **Step 2: Перевести страницу «Темы» на Popover**

В `playground/src/themes-page.tsx` заменить импорт:

```tsx
import { Popover } from '@stark/solid-kit/popover';
```

Секция 1 (две обёртки): заменить `<Probe defaultOpen>Светлая обёртка</Probe>` и `<Probe defaultOpen>Тёмная обёртка</Probe>` на

```tsx
<Popover.Root defaultOpen>
	<Popover.Trigger>Popover</Popover.Trigger>
	<Popover.Content>Светлая обёртка</Popover.Content>
</Popover.Root>
```

(во второй обёртке текст «Тёмная обёртка»).

Секция 3 (форма с компонентным токеном): заменить токен и содержимое:

```tsx
<form
	style={{ '--s-kit-popover-bg': '#ffe8cc' }}
	onSubmit={(event) => {
		event.preventDefault();
	}}
>
	<Popover.Root defaultOpen>
		<Popover.Trigger>Popover</Popover.Trigger>
		<Popover.Content>
			<i class='chip' data-chip/>
			Содержимое панели
		</Popover.Content>
	</Popover.Root>
</form>
```

Секция 4 (панель поверх модального `<dialog>`): заменить `<Probe>Панель над dialog</Probe>` на

```tsx
<Popover.Root>
	<Popover.Trigger>Панель над dialog</Popover.Trigger>
	<Popover.Content>Содержимое над dialog</Popover.Content>
</Popover.Root>
```

В `playground/src/theme-checks.ts` заменить три вхождения селектора `[data-probe-panel]` на `[data-s-kit-popover-content]` (в строке `required(nested, ...)` и в шаблонной строке `[data-scenario="${theme}"] ...`) и в названии проверки `--s-kit-probe-panel-bg` на `--s-kit-popover-bg`.

- [ ] **Step 3: Перевести матрицу формы пакета**

В `scripts/consumer/src/main.tsx` заменить импорт `Probe, ProbeScope` на `import { Popover, usePopover } from '@stark/solid-kit/popover';`, компонент `ScopeReader` на

Хук `usePopover()` вызывается внутри содержимого панели:

```tsx
function ScopeReader() {
	const popover = usePopover();
	const app = useContext(AppContext);
	return (
		<>
			<output id="scope">{popover.open() ? 'popover-open' : 'popover-closed'}</output>
			<output id="app">{app}</output>
		</>
	);
}
```

и блок `<Probe defaultOpen>…</Probe>` на

```tsx
<Popover.Root defaultOpen>
	<Popover.Trigger>Popover</Popover.Trigger>
	<Popover.Content>
		<ScopeReader />
	</Popover.Content>
</Popover.Root>
```

В `scripts/verify-package-form.sh`:
- строку про `--s-kit-probe-radius` заменить на `grep -lq -- '--s-kit-popover-padding' dist/assets/*.css && ok "Popover styles are in the built CSS" || fail "Popover styles are missing from the built CSS"`;
- проверку `grep -lq 'marker-used' dist/assets/*.js` заменить на `grep -lq 'must be used inside Popover.Root' dist/assets/*.js` (сообщения `imported component is in the bundle`/`...is missing from the bundle` оставить);
- проверку `marker-unused` не трогать (`probe-unused` остаётся до части 2);
- в завершающей подсказке заменить `#scope = probe-scope` на `#scope = popover-open`.

- [ ] **Step 4: README и удаление Probe**

В `README.md` в блоке подключения заменить строку `import { Probe } from '@stark/solid-kit/probe';` на `import { Popover } from '@stark/solid-kit/popover';`.

```bash
git rm -r src/components/probe
```

Затем выполнить `grep -rn "probe" --include=*.ts --include=*.tsx --include=*.css --include=*.sh --include=*.md -i src playground scripts README.md | grep -vi "probe-unused\|probe.setAttribute\|const probe\|probe.style\|probe.remove\|probe.append\|getComputedStyle(probe)"`: остаться не должно ничего, кроме упоминаний `probe-unused` (его заменит часть 2) и локальной переменной `probe` в `button-checks.ts`.

- [ ] **Step 5: Проверка**

Run: `pnpm check`
Expected: зелёная (число тестов: база минус тесты Probe плюс тесты частей 1, записать).

- [ ] **Step 6: Страница «Темы» в Chrome**

Открыть `#themes`, запустить проверки с клавиатуры в системной, светлой и тёмной темах (ждать 1,5–2 с после переключения). Ожидается: то же число проверок, что в базе Step 1, 0 FAIL; панели видны во всех четырёх секциях; панель из секции 4 поверх модального dialog. Настоящими нажатиями проверить: в открытом dialog открыть Popover, один Esc закрывает только Popover, второй закрывает dialog (нативный `<dialog>` страницы закрывается нативно, это проверка того, что стек Esc не мешает диалогу, когда слоёв нет). Проверить глазами: панель не прыгает при открытии, шрифт и цвет из токенов, тень и материал на месте. Если что-то расходится, зафиксировать в итогах и исправить до коммита.

- [ ] **Step 7: Матрица формы пакета**

Закоммитить изменения (Step 8), затем из корня репозитория:

```bash
env -u HTTPS_PROXY -u HTTP_PROXY -u https_proxy -u http_proxy bash scripts/verify-package-form.sh HEAD
```

Ожидается: все строки OK, TypeScript 5.9.3 и 7.0.2 зелёные, `#scope = popover-open`, `#app = app`. Если сеть недоступна, записать это в итогах как не выполненное и не писать «матрица зелёная».

- [ ] **Step 8: Коммит**

```bash
git add -A
git commit -m "refactor(playground): Popover заменяет Probe на странице «Темы», в матрице формы пакета и в README" -m "$TRAILERS"
```

(если матрица из Step 7 требует правок скрипта, они идут отдельным коммитом после её прогона).

---

### Task 6: Итоги части 1

**Files:**
- Modify: `docs/superpowers/specs/2026-10-29-stage-2-overlays-design.md` (раздел «Итоги части 1»)
- Modify: `README.md` (строка статуса: этап 2 в работе)

- [ ] **Step 1: Дописать итоги в спек**

Добавить в конец спека раздел `## 12. Итоги части 1: основа панелей и Popover (<дата>)` с фактами: число тестов до и после; число проверок на странице «Темы» в системной, светлой и тёмной темах и подтверждение 0 FAIL; результат матрицы формы пакета (или причина, почему не выполнена); что проверено настоящими нажатиями (Esc, возврат фокуса); отклонения от спека, найденные при выполнении (в том числе поведение порядка DOM и эффектов в `createFocusRestore`, `display: contents` у обёртки `Portal`, Enter в форме-хосте); что остаётся непроверенным (Firefox, Safari). Только измеренное, без предположений.

- [ ] **Step 2: Статус в README**

В `README.md` заменить «этапы 0 (фундамент) и 1 (простые контролы) готовы» на «этапы 0 (фундамент) и 1 (простые контролы) готовы, этап 2 (оверлеи) в работе: готов Popover».

- [ ] **Step 3: Проверка и коммит**

Run: `pnpm check`
Expected: зелёная.

```bash
git add docs README.md
git commit -m "docs: итоги части 1 этапа 2 (основа панелей и Popover)" -m "$TRAILERS"
```
