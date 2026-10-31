# solid-kit, этап 3, часть 4: MultiSelect — план реализации

> **Для исполнителей:** ОБЯЗАТЕЛЬНЫЙ суб-скил: superpowers:executing-plans (или subagent-driven-development). Шаги отмечены чекбоксами (`- [ ]`).
> **О форме плана.** Как в частях 2 и 3: контракты, файлы и конкретные утверждения тестов расписаны, тело реализации пишется при исполнении. Тесты пишутся вместе с реализацией задачи; «красный» шаг выполняется для чистых функций и не выполняется там, где тест без реализации не собирается.

**Цель:** `MultiSelect` (`Root` / `Trigger` / `Content` и быстрая форма): множественный выбор с чипами выбранных значений в триггере, поиском в панели, строкой «Все» и тремя режимами переполнения чипов.

**Архитектура:** на тех же общих частях, что Select и Combobox (`createListBoxOwner`, `ListBoxPanel`). Триггер собран из оболочки с чипами (каждый с кнопкой `×`) и основной `<button role="combobox">`. Панель не закрывается по выбору; при `searchable` в её шапке поле `Input`, оно владелец списка (`aria-activedescendant`), фокус при открытии уходит в него. Строка «Все» это отдельный вид строки `kind: 'all'` (уже есть в `ListRow` и `flattenRows`), активация и разметка дописываются в этой части.

**Стек:** как в частях 1–3; `Input` этапа 1, `ResizeObserver` для режима `collapse`.

**Спек:** `docs/superpowers/specs/2026-10-31-stage-3-lists-design.md` (разделы 4, 5, 8, 9, 10, 12, 18). Зонтичный: разделы 5, 5.1, 6, 11.1.

## Global Constraints

- Репозиторий публичный: ни ключей, ни токенов, ни `.env*` в коммитах. Не делать `git push`, не ставить теги (тег `v0.4.0` в конце этапа, часть 5), не менять git-идентичность, не переписывать историю (никаких `--amend`/`rebase`).
- Один класс — один файл; kebab-case; именованные экспорты; пропсы не деструктурируются (`splitProps`/`mergeProps`); один компонент на файл; интерфейсы контекста в отдельных файлах; чистые функции отдельными `.ts`.
- `exactOptionalPropertyTypes: true`: необязательные свойства в публичных пропсах `foo?: T | undefined`.
- Ошибки контекста: `${part} must be used inside MultiSelect.Root`.
- В CSS: только токены, без литералов цветов, без `outline: none/0`, без голого `var(--s-kit-control-height)` (всегда с фолбэком), `composes ... from "...";` с двойными кавычками, компонентные токены читаются с фолбэком.
- Стиль: ESLint (табы, одинарные кавычки, без висячих запятых, Stroustrup, max-len 140, без комментариев в конце строки кода, `solid/reactivity`: `props.*` читать в JSX, `createEffect` или обработчиках, одноразовые чтения через `untrack`, void-стрелки в скобках), Stylelint (`pnpm exec stylelint --fix <файл>`). Перед каждым коммитом `pnpm check` зелёный; код возврата проверяется отдельно.
- `pnpm` через прокси: `env -u HTTPS_PROXY -u HTTP_PROXY -u https_proxy -u http_proxy pnpm ...`.
- Коммиты оканчиваются трейлерами: `export TRAILERS=$'Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_017cEinKKFDiYmGrLaaKPqZu'`, затем `git commit -m "msg" -m "$TRAILERS"`.
- Dev-серверы убивать только по PID после проверки cwd, никогда `pkill`. Dev-сервер playground (порт 5173) уже запущен, не трогать.
- Браузер: Chrome, настоящие клавиши через `computer key`; Firefox и Safari не проверяются.
- Начало плана: `git status` чистый, `pnpm check` зелёный (636 тестов).

## Решения, принятые в плане (уточнения к спеку, раздел 8)

1. **Значение и «Все» (решение владельца 2026-10-31).** Тип значения `readonly T[] | ListKey`: массив выбранных элементов в порядке выбора либо ключ `allKey` (например `-1`) при выбранном «Все». Полный набор потребитель запрашивает сам. Любой другой не-массив считается пустым выбором. Проп `allKey` без `allLabel` строку не показывает, а `allLabel` без `allKey` не действует.
2. **Поведение «Все».** Клик по строке: при пустом запросе значение становится `allKey`, а если «Все» уже выбрано, очищается (`[]`). При непустом запросе строка действует на показанные (отфильтрованные) элементы: если выбраны все они, они снимаются из массива, иначе добавляются. Отметка у «Все»: значение `allKey` или все показанные элементы выбраны (при непустом списке).
3. **Снятие одной опции при «Все»** выводит из состояния «Все»: значением становится массив всех элементов `items` кроме снятого (это решение принято предложением в чате, возражений не было). При 100 000 элементах массив большой, случай редкий.
4. **Число «N из M».** `N`: в состоянии «Все» равно `M`, иначе длина массива (в том числе выбранное вне результата поиска); `M`: `total`, а без него длина `items`. `N = 0`: плейсхолдер; `N > M`: «N выбрано»; все выбраны: «M из M».
5. **Режимы чипов.** `collapse` (по умолчанию): чипы в одну строку, не поместившееся уходит в «+N» в основной кнопке; `summary`: чипов нет, в основной кнопке «N из M»; `wrap`: чипы переносятся, контрол растёт. В состоянии «Все» в `collapse` и `wrap` один чип с `allLabel` (по умолчанию «Все»), в `summary` «M из M». Чип «Все» убирается кнопкой `×` (значение `[]`).
6. **Чистая функция `fitChips`** (без DOM): сколько чипов помещается. Ширины чипов измеряются после первого показа и кэшируются по ключу, пересчёт по `ResizeObserver` оболочки. Рендерятся и измеряются не более 24 первых выбранных, остальные сразу в счётчик.
7. **`×` каждого чипа в порядке табуляции** (решение владельца 2026-10-31). После удаления чипа фокус переходит на основную кнопку (удалённая кнопка из DOM исчезает).
8. **Владелец списка.** При `searchable` (по умолчанию `true`): поле поиска в шапке панели с `role="combobox"`-атрибутами списка (`aria-controls`, `aria-activedescendant`), `keys: { typeahead: false, space: false, homeEnd: false }`, фокус при открытии в поле, Esc и Tab возвращают фокус на основную кнопку. Без `searchable`: владелец основная кнопка, фокус при открытии остаётся на ней, работает typeahead. Фильтр применяется сразу (поиск не привязан к подписи значения, как в Combobox), `filter={false}` отключает клиентский фильтр, `onQueryChange(query)` сообщает запрос странице; при закрытии панели запрос очищается.
9. **Токены:** `--s-kit-multiselect-bg` (фон панели, отображается на `--s-kit-listbox-bg`), `--s-kit-multiselect-width` (оболочка), `--s-kit-multiselect-counter-width` (резерв под «+N», фолбэк 72 px); границу, радиус и фон оболочки берут общие `--s-kit-select-*`.

---

### Task 1: Общие части: «Все» в списке, `fitChips`

**Files:**
- Create: `src/components/multiselect/fit-chips.ts`, `src/components/multiselect/fit-chips.test.ts`, `src/internal/list-box/list-box-all-option.tsx`
- Modify: `src/internal/list-box/create-list-box-controller.ts` (опция `onActivateAll`, `activate` и Enter/Space срабатывают на строке «Все»), `src/internal/list-box/create-list-box-owner.ts` (опции `allKey`, `onActivateAll`, `searchPaused` не нужен), `src/internal/list-box/list-box.tsx` (рисует строку «Все», пропы `allLabel`), `src/internal/list-box/list-box-panel.tsx` (проп `multiple`, `allLabel`, слот `header`, `initialFocus`, `restoreFocusTo` уже есть), тесты контроллера и ListBox

**Interfaces:**
- Produces:
  - `fitChips(widths: readonly number[], available: number, counterWidth: number, gap: number): number`: если сумма ширин с промежутками не больше `available`, число всех чипов; иначе наибольшее `k`, при котором `сумма первых k + промежутки + gap + counterWidth <= available` (`k >= 0`).
  - Контроллер: `onActivateAll?: () => void`; `activate(allKey)` и клавиши вызывают его; для отключённых и заголовков ничего не меняется.
  - Строка «Все» в `ListBox`: `role="option"`, `id = optionId(listId, key)`, `aria-selected`, `data-index`, `data-active`, подпись `allLabel`, отметка как у опций; не входит в `aria-setsize`/`aria-posinset`.
  - `ListBoxPanel`: `header?: JSX.Element` над списком, `initialFocus?: InitialFocusMode` (по умолчанию `'none'`), `multiple`, `allLabel`.
  - `createListBoxOwner`: `allKey?: ListKey | undefined`, `onActivateAll?: () => void`.

**Проверки:**
- `fitChips`: все помещаются; не помещается ни один; помещается часть и резерв счётчика учтён; нулевые ширины; одинаковые ширины; `gap` учитывается.
- Контроллер: Enter на строке «Все» вызывает `onActivateAll`; клик по ней; `nextActiveIndex` проходит по строке «Все» (регресс).
- ListBox: при `allKey` и `allLabel` строка «Все» первая, `aria-selected` по `selectedKeys`, на ней можно подсветить и активировать, `aria-setsize` не растёт.

- [ ] Красные тесты `fitChips`, реализация.
- [ ] Контроллер, owner, ListBox, ListBoxPanel; тесты.
- [ ] `pnpm check`, коммит `feat(list-box): строка «Все» и fitChips`.

### Task 2: MultiSelect

**Files:** `src/components/multiselect/` — `multiselect-context.ts`, `multiselect-root.tsx`, `multiselect-trigger.tsx`, `multiselect-chip.tsx`, `multiselect-content.tsx`, `multiselect.tsx`, `multiselect.module.css`, `index.ts`, `multiselect.test.tsx`; чистые части отдельными файлами: `multiselect-value.ts` (+ тест: `isAllValue`, `valueItems`, `toggleItem`, `toggleAll`, `countLabel`).

**Interfaces:**
- `MultiSelectRootProps<T>`: `items`, `getKey`, `getLabel`, `groupBy?`, `isItemDisabled?`, `value?: readonly T[] | ListKey`, `defaultValue?`, `onValueChange?: (value: readonly T[] | ListKey) => void`, `open`, `defaultOpen`, `onOpenChange`, `query`, `defaultQuery`, `onQueryChange?: (query: string) => void`, `filter`, `loading`, `virtualized`, `overscan`, `disabled`, `size`, `total?`, `searchable?`, `allKey?`, `chipsOverflow?: 'collapse' | 'wrap' | 'summary'`, `children`.
- `MultiSelectTriggerProps<T>`: атрибуты кнопки (как у `SelectTrigger`), `placeholder`, `renderChip?: (item: T) => JSX.Element`, `allLabel?: JSX.Element` (по умолчанию «Все»), `clearChipLabel?: (label: string) => string` (имя кнопки `×`, по умолчанию «Убрать: подпись»), `class`, `style`.
- `MultiSelectContentProps<T>`: `renderOption`, `renderGroupHeader`, `loadingText`, `emptyText`, `searchPlaceholder?`, `searchLabel?` (доступное имя поля поиска, по умолчанию «Поиск»), `allLabel?`, `ref`, `class`, `style`.
- Быстрая форма собирает все три; `allLabel` пробрасывается в строку «Все» и в чип.

**Проверки (компонентные, на адаптере окна; ширины чипов подменяются через `getBoundingClientRect`, `ResizeObserver` подменяется стабом):**
- controlled/uncontrolled значение и открытие; порядок выбора сохраняется; панель остаётся открытой после выбора, повторный выбор снимает.
- Роли и атрибуты: `role="combobox"` на основной кнопке, `aria-multiselectable` на списке, `aria-selected` у опций, `aria-expanded`/`aria-controls`.
- `searchable`: поле поиска в панели, фокус в нём при открытии, `aria-activedescendant` на подсвеченную опцию; фильтр; `filter={false}`; `onQueryChange`; запрос очищается при закрытии; выбранное вне результата поиска остаётся в значении и в чипах; без `searchable` фокус на кнопке, работает typeahead.
- «Все»: строка первая; клик → `allKey`; повторный клик → `[]`; при непустом запросе действует на показанные; снятие одной опции при «Все» → массив без неё; чип «Все»; «M из M» в `summary`.
- Чипы: `×` убирает чип, фокус на основной кнопке; `×` в порядке табуляции (`tabindex` не `-1`); имя кнопки `×`; не более 24 чипов в DOM; `collapse` скрывает не поместившиеся и показывает «+N»; `summary` показывает «N из M»; `wrap` рендерит все.
- Граничные случаи формулы «N из M»: `N = 0`, `N > M`, все выбраны, `total` не задан.
- Клавиши: на закрытой кнопке ArrowDown, ArrowUp, Enter, Space открывают; в открытом списке Enter (и Space без поиска) переключают активную опцию; Esc закрывает, фокус на кнопке; Tab закрывает, фокус на кнопке.
- `disabled`: кнопка и `×` отключены, список не открывается.

- [ ] Чистые функции `multiselect-value.ts` с тестами.
- [ ] Контекст, корень (значение, «Все», запрос, фильтр, `selectedKeys`, владелец), чип, триггер (режимы), панель, фасад, CSS, `index.ts`.
- [ ] Тесты компонента; `pnpm check`; Stylelint.
- [ ] Коммит `feat(multiselect): MultiSelect с чипами, поиском и строкой «Все»`.

### Task 3: Playground

**Files:** `playground/src/demo-multiselects.tsx`, `playground/src/multiselect-checks.ts`, `playground/src/lists-page.tsx`

- Демонстрации `data-multiselect`: короткий список; с группами и отключёнными; `summary`; `wrap`; «Все» с `allKey={-1}` и выводом текущего значения; 100 000 опций с «Все»; внешний поиск (`filter={false}`, задержка 300 мс, `loading`, `total`); в форме (Enter не отправляет форму из поля поиска); в диалоге; `disabled`/`invalid`.
- Автопроверки: роли; панель остаётся открытой после выбора; фокус в поле поиска; фильтр и сохранение выбранного вне результата; «Все» → `-1`, снятие одной → массив; `×` убирает чип и возвращает фокус на кнопку; режим `collapse` на узкой оболочке показывает «+N»; 100 000 опций: в DOM не более 30, открытие быстрее 100 мс.
- Страница «Списки»: секция «3. MultiSelect»; автопроверки объединяются со Select и Combobox.

- [ ] Реализация, `pnpm check`, коммит `feat(playground): MultiSelect на странице «Списки»`.

### Task 4: Проверка в Chrome и спек

- Настоящими клавишами и мышью: открытие, выбор, повторный выбор, фокус в поле поиска, Esc и Tab, `×` и Tab по чипам, «Все», 100 000 опций, внешний поиск, форма (Enter не отправляет), диалог (Esc: сначала панель, потом диалог), `collapse` при сужении окна, консоль без ошибок.
- Спек: раздел 8 приводится к реализации, строка части 4 в таблице частей «выполнена», раздел 19 «Итоги части 4» (числа тестов, расхождения, проверено и не проверено).
- `pnpm check`, `scripts/verify-package-form.sh HEAD`, коммит `docs: итоги части 4 (MultiSelect)`.
