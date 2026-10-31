# solid-kit, этап 3, часть 2: ListBox и Select — план реализации

> **Для исполнителей:** ОБЯЗАТЕЛЬНЫЙ суб-скил: superpowers:executing-plans (или subagent-driven-development). Шаги отмечены чекбоксами (`- [ ]`).
> **О форме плана.** Контракты (сигнатуры, файлы, поведение) и проверки (конкретные утверждения тестов) расписаны здесь; тело реализации пишется при исполнении по этим контрактам и фиксируется коммитами. Так сделано сознательно: объём кода части (около полутора тысяч строк) вдвое увеличил бы план без пользы, а контракты в нём исчерпывающие. Тесты пишутся раньше реализации в каждой задаче.

**Цель:** внутренний ListBox (контроллер состояния и клавиш плюс разметка с виртуализацией, группами и липким заголовком) и публичный `Select` (`Root` / `Trigger` / `Content` и быстрая форма), страница playground «Списки» для проверки в браузере.

**Архитектура:** фокус остаётся на кнопке Select, список показывает активную опцию через `aria-activedescendant` (спек, раздел 5.1). Контроллер (`createListBoxController`) хранит ключ активной опции и обрабатывает клавиши, не зная о разметке; разметка (`ListBox`) рисует строки окна рендера (`RenderWindow` из части 1) между двумя spacer-элементами. Select собирает `flattenRows` → контроллер → окно → `FloatingPanel` (`initialFocus="none"`, `matchAnchorWidth`). Данные приходят пропсами корня, опций-компонентов нет.

**Стек:** как в части 1; `FloatingPanel`, `createControllableSignal`, `Field` из этапов 1–2.

**Спек:** `docs/superpowers/specs/2026-10-31-stage-3-lists-design.md` (разделы 3, 5, 6, 9, 10, 16). Зонтичный: разделы 5, 5.1, 6, 6.1, 6.2, 11.1.

## Global Constraints

- Репозиторий публичный: ни ключей, ни токенов, ни `.env*` в коммитах. Не делать `git push`, не ставить теги (тег `v0.4.0` в конце этапа), не добавлять `LICENSE`, не менять git-идентичность, не переписывать историю (никаких `--amend`/`rebase`).
- Один класс — один файл; kebab-case; именованные экспорты; пропсы не деструктурируются (`splitProps`/`mergeProps`); один компонент на файл; интерфейсы контекста в отдельных файлах; чистые функции отдельными `.ts`.
- `exactOptionalPropertyTypes: true`: необязательные свойства в публичных пропсах `foo?: T | undefined`.
- Ошибки контекста: `${part} must be used inside Select.Root`.
- В CSS: только токены, без литералов цветов, без `outline: none/0`, без голого `var(--s-kit-control-height)` (всегда с фолбэком), `composes ... from "...";` с двойными кавычками; компонентные токены читаются с фолбэком.
- Стиль: ESLint (табы, одинарные кавычки, без висячих запятых, Stroustrup, max-len 140, без комментариев в конце строки кода, `solid/reactivity`: `props.*` читать в JSX, `createEffect` или обработчиках, аксессоры в хуки передавать стрелками, не возвращать void-выражение стрелкой без скобок), Stylelint (`pnpm exec stylelint --fix <файл>`). Перед каждым коммитом `pnpm check` зелёный; код возврата проверяется отдельно.
- `pnpm` через прокси: `env -u HTTPS_PROXY -u HTTP_PROXY -u https_proxy -u http_proxy pnpm ...`.
- Коммиты оканчиваются трейлерами: `export TRAILERS=$'Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_017cEinKKFDiYmGrLaaKPqZu'`, затем `git commit -m "msg" -m "$TRAILERS"`.
- Dev-серверы убивать только по PID после проверки cwd (`lsof -a -p <PID> -d cwd -Fn`), никогда `pkill`.
- Браузер: Chrome; настоящие клавиши через `computer key`; после смены темы ждать 1,5–2 с; Firefox и Safari не проверяются.
- Тесты, которым нужен Popover API, подменяют его в `beforeEach` (`showPopover` снимает атрибут `popover`).
- Начало плана: `git status` чистый, `pnpm check` зелёный (на старте части 2 тестов 504).

## Решения, принятые в плане (отличия и уточнения к спеку)

1. **`size` у Select** задаётся на корне (`Select.Root size`), а не на `Trigger`: тригер и панель должны получить один размер, а контекст проще, чем синхронизация двух пропсов. Быстрая форма принимает `size` как раньше. Спек, раздел 6, правится.
2. **`virtualized` читается один раз при создании корня** (смена на лету не поддерживается): окно рендера выбирается при создании.
3. **Оценка высоты строки** читается из вычисленного стиля триггера при открытии (не из скроллера: ref скроллера вызывается до вставки в документ), токен `--s-kit-control-height`, потом `-md`, потом 32 (`readControlHeight`).
4. **Прокрутка к выбранному при открытии** выполняется дважды: сразу и в следующем кадре (панель ещё может быть скрыта до `showPopover`, а виртуализатор ещё не измерил строки). Стрелки повторяют вызов в следующем кадре только если строка не смонтирована.
5. **Строка «Все»** контроллер учитывает (навигация), но активация `all` пока ничего не делает: её обработчик добавит часть 4.
6. **Компонентные тесты в jsdom** идут на настоящем `createVirtualWindow` с подставленной геометрией (`src/internal/testing/list-geometry.ts`: `clientHeight`, `scrollHeight`, `scrollTo`, высота строк через `getBoundingClientRect`) и на `virtualized={false}`.

---

### Task 1: Мелкие утилиты: `readTokenPx`, `optionId`, `createTypeaheadBuffer`

**Files:**
- Create: `src/utils/read-token-px.ts`, `src/utils/read-token-px.test.ts`, `src/internal/list-box/option-id.ts`, `src/internal/list-box/option-id.test.ts`, `src/internal/list-box/create-typeahead-buffer.ts`, `src/internal/list-box/create-typeahead-buffer.test.ts`
- Modify: `src/utils/read-control-height.ts` (использует `readTokenPx`; тесты не меняются)

**Interfaces:**
- Produces: `readTokenPx(element: Element, tokens: readonly string[], fallback: number): number` (первый токен с положительным числом px; иначе `fallback`); `optionId(listId: string, key: ListKey): string` (`${listId}-opt-${'n' | 's'}${encodeURIComponent(String(key))}`: число и строка с одним значением различаются); `createTypeaheadBuffer(timeoutMs?: number): { push: (char: string) => string; clear: () => void; value: () => string }` (буфер накапливается, сбрасывается через `timeoutMs`, по умолчанию 500; таймер снимается при уничтожении владельца).

**Проверки:**
- `readTokenPx`: берёт первый подходящий токен, пропускает мусор и нули, `fallback` без токенов (jsdom: токены задаются через `style.setProperty`).
- `optionId`: `optionId('l', 1) !== optionId('l', '1')`; пробел и кириллица в ключе кодируются; результат без пробелов.
- Буфер (fake timers): `push('a')` → `'a'`, `push('b')` → `'ab'`; после 500 мс тишины `push('c')` → `'c'`; каждый `push` продлевает таймер; `clear()` обнуляет; после `dispose` корня таймер не срабатывает.

- [ ] Тесты, падение, реализация, прогон `vitest run src/utils src/internal/list-box`.
- [ ] Коммит `feat(list-box): readTokenPx, optionId, createTypeaheadBuffer` (после `pnpm check`).

---

### Task 2: Контроллер `createListBoxController`

**Files:**
- Create: `src/internal/list-box/create-list-box-controller.ts`, `src/internal/list-box/create-list-box-controller.test.ts`

**Interfaces:**
- Consumes: `ListRow`, `ListKey`, `nextActiveIndex`, `matchTypeahead`, `initialActiveIndex`, `resolveActiveKey`, `isRowAvailable`, `optionId`, `createTypeaheadBuffer`, `RenderWindow`.
- Produces:

```ts
export type ActiveSource = 'keyboard' | 'pointer';

export interface ListBoxControllerOptions<T> {
	listId: string;
	rows: Accessor<readonly ListRow<T>[]>;
	selectedKeys: Accessor<ReadonlySet<ListKey>>;
	/** Клик или Enter/Space на активной опции (не для «Все» и не для отключённой). */
	onActivate: (item: T) => void;
	window: RenderWindow;
	/** Число полностью помещающихся строк окна: шаг PageUp/PageDown; по умолчанию 10. */
	pageSize?: Accessor<number> | undefined;
	keys?: { typeahead?: boolean | undefined; space?: boolean | undefined; homeEnd?: boolean | undefined } | undefined;
}

export interface ListBoxController {
	activeKey: Accessor<ListKey | undefined>;
	activeSource: Accessor<ActiveSource>;
	activeId: Accessor<string | undefined>;
	setActiveKey: (key: ListKey | undefined, source: ActiveSource) => void;
	/** Активирует опцию по ключу (клик): отключённые и «Все» игнорируются. */
	activate: (key: ListKey) => void;
	/** При открытии: подсветка на выбранной (иначе первой доступной) и прокрутка к ней (дважды: сразу и в следующем кадре). */
	resetActive: (source?: ActiveSource) => void;
	/** При закрытии. */
	clearActive: () => void;
	isSelected: (key: ListKey) => boolean;
	/** `true`, если клавиша обработана: владелец вызывает `preventDefault()`. */
	handleKeyDown: (event: KeyboardEvent) => boolean;
}

export function createListBoxController<T>(options: ListBoxControllerOptions<T>): ListBoxController;
```

**Поведение:**
- Подсветка хранится по ключу; индекс строки берётся из `Map` ключ→индекс (только опции и «Все», заголовки в нём нет), пересчитывается при смене `rows`.
- `handleKeyDown` (не обрабатывает при `event.isComposing`, `ctrlKey`, `metaKey`, `altKey`): `ArrowDown` / `ArrowUp` → `next` / `previous`; `Home` / `End` → `first` / `last` (если `keys.homeEnd !== false`); `PageDown` / `PageUp` → `next-page` / `previous-page` с `pageSize`; `Enter` → активация активной опции; `' '` → активация (если `keys.space !== false`), но если буфер typeahead не пуст, пробел идёт в буфер; печатный символ (`key.length === 1`, без модификаторов, если `keys.typeahead !== false`) → буфер → `matchTypeahead` от активной строки. Источник у клавиатурных переходов `keyboard`, прокрутка `scrollToIndex(index)` (auto); если строка не смонтирована (нет в `window.items()`), вызов повторяется в следующем кадре.
- `resetActive`: `initialActiveIndex(rows, [...selectedKeys])` → ключ → `scrollToIndex(index, { align: 'center' })` сразу и ещё раз в `requestAnimationFrame` (безусловно). Нет доступных строк → ключ `undefined`.
- Смена `rows` при наличии подсветки: `resolveActiveKey`; если ключ сменился, подсветка уходит на новый и прокручивается (auto).
- `activeId` = `optionId(listId, key)` или `undefined`.

**Проверки (на `createTestWindow`, 1000 строк, окно 100 px, строка 20 px, `requestAnimationFrame` подменён вручную):**
- стрелки пропускают заголовки и отключённые; на краях без зацикливания; `Home`/`End`; `PageDown` на `pageSize`; `homeEnd: false` отключает `Home`/`End`;
- `Enter`, `Space` вызывают `onActivate` с элементом; `space: false` оставляет пробел необработанным (`false`); отключённая опция и «Все» не активируются;
- typeahead: буква, две буквы, повтор буквы, пробел внутри буфера; `typeahead: false` не обрабатывает буквы; модификаторы (`ctrlKey`) и `isComposing` игнорируются;
- `ArrowDown` у последней смонтированной строки зовёт `scrollToIndex` (журнал адаптера); повтор в кадре, если строка не смонтирована (подменой `items`);
- `resetActive`: выбранная опция вне окна → `scrollToIndex(i, center)` дважды (сразу и в кадре); без выбранного первая доступная; пустой список → `undefined`;
- смена `rows` (фильтр) сохраняет подсветку, если ключ остался, иначе первая доступная; `clearActive`; `activeId`; `isSelected`.

- [ ] Тесты, падение, реализация, зелёный прогон.
- [ ] Коммит `feat(list-box): createListBoxController` (после `pnpm check`).

---

### Task 3: Разметка `ListBox` и геометрия для тестов

**Files:**
- Create: `src/internal/list-box/list-box.tsx`, `src/internal/list-box/list-box-option.tsx`, `src/internal/list-box/list-box-group-header.tsx`, `src/internal/list-box/list-box-sticky-header.tsx`, `src/internal/list-box/list-box.module.css`, `src/internal/list-box/list-box.test.tsx`, `src/internal/testing/list-geometry.ts`

**Interfaces:**
- Consumes: контроллер (Task 2), `RenderWindow`, `ListRow`.
- Produces:

```ts
export interface OptionState {
	selected: Accessor<boolean>;
	active: Accessor<boolean>;
	disabled: boolean;
}

export interface ListBoxProps<T> {
	listId: string;
	controller: ListBoxController;
	rows: Accessor<readonly ListRow<T>[]>;
	window: RenderWindow;
	scrollerRef: (element: HTMLElement | undefined) => void;
	/** Оценка высоты строки: она же высота липкого заголовка до измерения. */
	headerHeight?: Accessor<number> | undefined;
	multiple?: boolean | undefined;
	loading?: boolean | undefined;
	loadingText?: JSX.Element;
	emptyText?: JSX.Element;
	renderOption?: ((item: T, state: OptionState) => JSX.Element) | undefined;
	renderGroupHeader?: ((label: string) => JSX.Element) | undefined;
}
// src/internal/testing/list-geometry.ts
export function installListGeometry(options?: { rowHeight?: number; viewportHeight?: number }): void;  // в beforeEach; снимается restoreMocks/ручным restore
```

**Разметка и поведение (спек, раздел 5.3):**
- Скроллер `<div role="listbox" id={listId} data-s-kit-focus-inset data-active-source aria-multiselectable>`, без `tabindex`; `onScroll` обновляет `scrollTop` (для липкого заголовка); `onMouseDown` вызывает `preventDefault()`.
- Строки окна `window.items()` между двумя spacer-элементами (`aria-hidden`, высоты `firstItem.start` и `totalSize - lastItem.end`); у строк `data-index` и `ref={window.measure}`.
- Опция: `role="option"`, `id` из `optionId`, `aria-selected`, `aria-disabled` (только у отключённой), `aria-setsize` (число опций), `aria-posinset` (`optionIndex + 1`), `data-active` у активной, `data-selected` у выбранной, `title` с подписью, внутри отметка выбранного (inline SVG, `aria-hidden`) и подпись с многоточием; `renderOption(item, state)` заменяет внутренности. `mousemove` ставит активной с источником `pointer` (только если она ещё не такая), `click` вызывает `controller.activate`.
- Заголовок группы: `role="presentation"`, `renderGroupHeader(label)` либо подпись. Строка `all` пока рисуется как опция с текстом из ключа не нужна: для `kind: 'all'` ListBox ничего не рисует в части 2 (добавит часть 4).
- Липкий заголовок: отдельный элемент в начале скроллера, нулевой высоты в потоке (`position: sticky; top: 0`), внутри абсолютный блок с подписью группы первой видимой строки; показывается, только если у `rows` есть группы и строка заголовка этой группы уже вне видимой области (индекс заголовка меньше индекса первой видимой строки). Первая видимая строка: первый элемент окна, у которого `start + size > scrollTop`. Высота измеряется, из неё считается `scrollPaddingStart` (экспортируется функцией `createStickyHeaderHeight`, в части 2 это сигнал внутри `ListBox`, значение отдаётся владельцу окна через `onHeaderHeight`, см. Task 4).
- `loading`: вместо строк `<div role="status">{loadingText ?? 'Загрузка…'}</div>`; пустой результат: `{emptyText ?? 'Нет элементов для отображения'}`; окно рендера при этом не используется.
- CSS (`list-box.module.css`): скроллер `overflow: auto; overscroll-behavior: contain; max-block-size: var(--s-kit-listbox-max-height, 320px); padding: var(--s-kit-listbox-padding, 4px)`; опция `min-block-size: var(--s-kit-control-height, var(--s-kit-control-height-md))`, скругление `--s-kit-listbox-item-radius`; `[data-active]` фон `--s-kit-color-tint`; `[data-selected]` фон `--s-kit-color-row-selected`; `[aria-disabled="true"]` `--s-kit-disabled-opacity` и `cursor: not-allowed`; кольцо только при `[data-active-source="keyboard"] [data-active]` внутреннее (`outline-offset` отрицательный).

**Проверки (jsdom, `installListGeometry`, контроллер и окно `createVirtualWindow` из реального скроллера, затем `createFullWindow`):**
- роли, `id` скроллера, `aria-multiselectable` только при `multiple`; у опций `aria-selected`, `aria-setsize`, `aria-posinset` (с группами нумерация сквозная, заголовки не считаются);
- рендерится только окно (из 1000 строк в DOM не больше окна плюс overscan), spacer'ы дают полную высоту;
- `data-active` следует за `controller.activeKey`, `data-active-source` на скроллере;
- `mousemove` ставит `pointer`, `click` вызывает `onActivate`, клик по отключённой не вызывает; `mousedown` на списке отменяется (`defaultPrevented`);
- заголовки групп `role="presentation"`, не активируются; `renderOption` и `renderGroupHeader` подставляются; `loading`/пусто показывают тексты и не рендерят строки; `virtualized={false}`-окно рендерит все строки;
- липкий заголовок появляется при прокрутке за заголовок группы и показывает её подпись, пока заголовок в окне не дублируется.

- [ ] Тесты, падение, реализация, прогон, `stylelint --fix` для CSS.
- [ ] Коммит `feat(list-box): разметка ListBox` (после `pnpm check`).

---

### Task 4: `Select`

**Files:**
- Create: `src/components/select/{index.ts, select.tsx, select-root.tsx, select-trigger.tsx, select-content.tsx, select-context.ts, select.module.css, select.test.tsx}`

**Interfaces:**
- Consumes: `flattenRows`, контроллер, `ListBox`, `createVirtualWindow`, `createFullWindow`, `readControlHeight`, `readTokenPx`, `FloatingPanel`, `createControllableSignal`, `FieldControlProps`.
- Produces (публично, `@stark/solid-kit/select`): `Select` (быстрая форма, она же объект частей), `Select.Root`, `Select.Trigger`, `Select.Content`, типы `SelectProps`, `SelectRootProps`, `SelectTriggerProps`, `SelectContentProps`.

```ts
export interface SelectRootProps<T> {
	items: readonly T[];
	getKey: (item: T) => ListKey;
	getLabel: (item: T) => string;
	groupBy?: ((item: T) => string) | undefined;
	isItemDisabled?: ((item: T) => boolean) | undefined;
	value?: T | null | undefined;
	defaultValue?: T | null | undefined;           // по умолчанию null
	onValueChange?: ((value: T | null) => void) | undefined;
	open?: boolean | undefined;
	defaultOpen?: boolean | undefined;
	onOpenChange?: ((open: boolean) => void) | undefined;
	loading?: boolean | undefined;
	virtualized?: boolean | undefined;             // по умолчанию true, читается один раз
	overscan?: number | undefined;                 // по умолчанию 6
	disabled?: boolean | undefined;
	size?: 'sm' | 'md' | 'lg' | undefined;
	children?: JSX.Element;
}
export interface SelectTriggerProps<T> extends Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, 'class' | 'style' | 'disabled' | 'children'> {
	placeholder?: JSX.Element;
	renderValue?: ((item: T) => JSX.Element) | undefined;
	class?: string | undefined;
	style?: JSX.CSSProperties | undefined;
}
export interface SelectContentProps<T> {
	renderOption?: ListBoxProps<T>['renderOption'];
	renderGroupHeader?: ListBoxProps<T>['renderGroupHeader'];
	loadingText?: JSX.Element;
	emptyText?: JSX.Element;
	class?: string | undefined;
	style?: JSX.CSSProperties | undefined;
}
/** Быстрая форма: пропсы корня + пропсы триггера (`placeholder`, `renderValue`, атрибуты кнопки и Field) + пропсы содержимого (`renderOption`, `renderGroupHeader`, `loadingText`, `emptyText`, `contentClass`). */
```

**Поведение (спек, раздел 6):**
- **Корень:** `createControllableSignal` для `open` и `value`; `rows = createMemo(flattenRows(items, …))`; `selectedKeys` из `value`; окно выбирается по `virtualized` (виртуальное: `count = rows().length`, `scroller`, `estimateSize` = `readControlHeight(триггер)` при открытии, `overscan`, `scrollPaddingStart` = высота липкого заголовка, `initialHeight` = `min(readTokenPx(триггер, ['--s-kit-listbox-max-height'], 320), count × estimate)`); контроллер создаётся в корне; `onActivate(item)`: `setValue(item)`, если ключ изменился, затем закрыть; открытие с источником (`keyboard` / `pointer`) запоминается, после появления скроллера вызывается `controller.resetActive(source)`; закрытие вызывает `clearActive`.
- **Триггер:** `<button type="button" role="combobox" aria-haspopup="listbox" aria-expanded aria-controls={listId при открытом} aria-activedescendant={activeId при открытом} disabled data-s-kit-size>`; атрибуты Field (`id`, `aria-describedby`, `aria-invalid`) принимаются как у Input; внутри подпись выбранного (`renderValue` или `getLabel`, значение вне `items` показывается из `value`) либо `placeholder` приглушённым цветом; шеврон inline SVG. Клик переключает (источник `pointer`); на закрытой кнопке `ArrowDown`, `ArrowUp`, `Enter`, `Space` открывают (источник `keyboard`, `preventDefault`, пробел гасится и на `keyup`); на открытой клавиши идут в `controller.handleKeyDown` (при `true` `preventDefault`), `Tab` закрывает без выбора и без `preventDefault`.
- **Содержимое:** `FloatingPanel` (`open`, `onDismiss` закрывает, `anchor` и `anchorElement` — триггер, `matchAnchorWidth`, `initialFocus="none"`, `placement="bottom-start"`, `size`) с классом из `select.module.css` (`composes: panel material`, фон `--s-kit-select-bg`, минимальная ширина `--s-kit-listbox-min-width`, фолбэк 160 px), внутри `ListBox`.
- **Стили триггера:** основа `control` из `control-base.module.css`, граница `--s-kit-select-border`, радиус `--s-kit-select-radius`, ширина `--s-kit-select-width` (фолбэк 12rem, как у Input), подпись с многоточием, плейсхолдер `--s-kit-color-muted`, `aria-invalid="true"` красная граница и кольцо.
- `Select.Content` вне корня бросает `Select.Content must be used inside Select.Root`; так же `Trigger`.

**Проверки (jsdom, Popover API подменён, геометрия из Task 3):**
- роли и атрибуты триггера (`combobox`, `aria-haspopup`, `aria-expanded`, `aria-controls` совпадает с id скроллера, `aria-activedescendant` совпадает с id активной опции), плейсхолдер и подпись, значение вне `items`, `renderValue`, Field (`id`, `aria-describedby`, `aria-invalid`, `<label for>` кликабелен);
- открытие кликом и четырьмя клавишами, повторный клик закрывает; `disabled` не открывает;
- при открытии активна выбранная опция (иначе первая доступная); стрелки, `Home`, `End`, пропуск заголовков и отключённых, 1000 строк: активная опция вне окна попадает в окно (прокрутка), `PageDown`;
- выбор `Enter`, `Space`, кликом: `onValueChange` один раз с элементом, панель закрыта, фокус на кнопке; повторный выбор того же значения не вызывает `onValueChange`; typeahead по буквам;
- `Esc` закрывает (настоящий стек слоёв), `Tab` закрывает без выбора, клик снаружи закрывает, `Enter` внутри `<form>` не отправляет форму;
- controlled/uncontrolled для `value` и `open` (в controlled состояние следует пропу, `onChange` сообщает запрос);
- группы: заголовки, `aria-posinset` сквозной; `loading` и пустой список показывают тексты; `virtualized={false}` рендерит все строки; смена `items` при открытом списке сохраняет или сбрасывает подсветку;
- изоляция: клик и двойной клик по опции внутри `<label>` и кликабельной карточки не доходят до них; быстрая форма собирает те же роли.

- [ ] Тесты, падение, реализация по частям (контекст, корень, триггер, содержимое, фасад), прогон, `stylelint --fix`.
- [ ] Коммит `feat(select): Select на ListBox` (после `pnpm check`).

---

### Task 5: Страница playground «Списки»

**Files:**
- Create: `playground/src/lists-page.tsx`, `playground/src/demo-selects.tsx`, `playground/src/select-checks.ts`
- Modify: `playground/src/app.tsx` (маршрут `lists`), при необходимости `playground/src/playground.css`

**Содержимое страницы (раздел 8 зонтичного; наращивается частями этапа):** выбор темы как на странице «Панели»; секция «Select»: (а) короткий список с плейсхолдером и `Field`, (б) с группами и отключёнными, (в) 100 000 опций (создаются при открытии страницы одним массивом), (г) `virtualized={false}` на 200 опциях, (д) со своим `renderOption` (аватар и подпись), (е) `loading` и пустой список, (ж) внутри `Dialog` (приёмка Esc: первый закрывает панель Select, второй диалог). Кнопка «Запустить проверки» вызывает `runSelectChecks`: роли, `aria-activedescendant` совпадает с активной опцией, число строк в DOM на 100 000 не больше окна плюс overscan, высота строки не меньше высоты контрола, сохранение подсветки при фильтрации; результат в таблице как на странице «Панели».

- [ ] Реализация; `pnpm typecheck` и `pnpm lint` зелёные.
- [ ] Коммит `feat(playground): страница «Списки» с демонстрациями Select` (после `pnpm check`).

---

### Task 6: Проверка в Chrome, правки, итоги

- [ ] Запустить playground (`pnpm dev`, порт из вывода), открыть страницу `#lists` в Chrome (`claude-in-chrome`), записать результат автоматических проверок.
- [ ] Вручную настоящими клавишами: открытие и выбор, стрелки с прокруткой на 100 000 опций, `Home`/`End`, typeahead, `Esc`, `Tab`, возврат фокуса, кольцо фокуса на активной опции, липкий заголовок на группах, ширина панели равна ширине кнопки, поведение у нижнего края окна (панель открывается вверх).
- [ ] Измерить открытие на 100 000 опций (`performance.now` вокруг клика до появления опции) и долю длинных кадров при прокрутке (если инструмент позволяет); записать числа, не подгонять.
- [ ] Исправить найденное; новое поведение покрыть тестом, если оно воспроизводится в jsdom.
- [ ] `pnpm check`, затем `scripts/verify-package-form.sh` (если запускается без сети; иначе записать, что не запускалось).
- [ ] В спек добавить «Итоги части 2» (раздел 17): числа, расхождения с планом, находки, список непроверенного; поправить раздел 6 (`size` на корне) и таблицу частей (план части 2).
- [ ] Коммит документации. Не пушить, не ставить тег.
