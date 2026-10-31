# solid-kit, этап 3, часть 3: Combobox — план реализации

> **Для исполнителей:** ОБЯЗАТЕЛЬНЫЙ суб-скил: superpowers:executing-plans (или subagent-driven-development). Шаги отмечены чекбоксами (`- [ ]`).
> **О форме плана.** Как в части 2: контракты, файлы и конкретные утверждения тестов расписаны, тело реализации пишется при исполнении. Тесты пишутся вместе с реализацией каждой задачи; шаг «красный тест» выполняется там, где он осмыслен (чистые функции), и честно не выполняется там, где тест без реализации не собирается.

**Цель:** `Combobox` (`Root` / `Input` / `Content` и быстрая форма): поле ввода с фильтруемым списком, значением `T | null`, клиентским и внешним (серверным) фильтром; общий код списка (состояние, окно рендера, контроллер, панель) выносится из Select в общий хук и общую панель, чтобы Combobox и будущий MultiSelect не копировали корень Select.

**Архитектура:** фокус всегда в `<input role="combobox">`, подсветка через `aria-activedescendant` (спек, раздел 5.1). Общий хук `createListBoxOwner` собирает `flattenRows` → окно рендера → контроллер → эффекты открытия и закрытия; общая панель `ListBoxPanel` это `FloatingPanel` + `ListBox`. Select переводится на них без изменения поведения (его 37 тестов страхуют рефакторинг). Combobox добавляет текст поля (`query`), фильтр, сброс текста и значения.

**Стек:** как в частях 1–2; `Input` из этапа 1 внутри оболочки поля.

**Спек:** `docs/superpowers/specs/2026-10-31-stage-3-lists-design.md` (разделы 4, 5, 7, 9, 10, 12, 17). Зонтичный: разделы 5, 5.1, 6, 11.1.

## Global Constraints

- Репозиторий публичный: ни ключей, ни токенов, ни `.env*` в коммитах. Не делать `git push`, не ставить теги (тег `v0.4.0` в конце этапа, часть 5), не добавлять новых лицензионных файлов, не менять git-идентичность, не переписывать историю (никаких `--amend`/`rebase`).
- Один класс — один файл; kebab-case; именованные экспорты; пропсы не деструктурируются (`splitProps`/`mergeProps`); один компонент на файл; интерфейсы контекста в отдельных файлах; чистые функции отдельными `.ts`.
- `exactOptionalPropertyTypes: true`: необязательные свойства в публичных пропсах `foo?: T | undefined`.
- Ошибки контекста: `${part} must be used inside Combobox.Root`.
- В CSS: только токены, без литералов цветов, без `outline: none/0`, без голого `var(--s-kit-control-height)` (всегда с фолбэком), `composes ... from "...";` с двойными кавычками; компонентные токены читаются с фолбэком.
- Стиль: ESLint (табы, одинарные кавычки, без висячих запятых, Stroustrup, max-len 140, без комментариев в конце строки кода, `solid/reactivity`: `props.*` читать в JSX, `createEffect` или обработчиках, одноразовые чтения через `untrack`, не возвращать void-выражение стрелкой без скобок), Stylelint (`pnpm exec stylelint --fix <файл>`). Перед каждым коммитом `pnpm check` зелёный; код возврата проверяется отдельно.
- `pnpm` через прокси: `env -u HTTPS_PROXY -u HTTP_PROXY -u https_proxy -u http_proxy pnpm ...`.
- Коммиты оканчиваются трейлерами: `export TRAILERS=$'Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_017cEinKKFDiYmGrLaaKPqZu'`, затем `git commit -m "msg" -m "$TRAILERS"`.
- Dev-серверы убивать только по PID после проверки cwd (`lsof -a -p <PID> -d cwd -Fn`), никогда `pkill`.
- Браузер: Chrome; настоящие клавиши через `computer key`; Firefox и Safari не проверяются. Текст набирать быстро (буфер typeahead в Select 500 мс); в Combobox typeahead выключен.
- Начало плана: `git status` чистый, `pnpm check` зелёный (на старте 596 тестов).

## Решения, принятые в плане (уточнения к спеку, раздел 7)

1. **Фильтр применяется только после того, как пользователь печатал.** Пока текст в поле это подпись выбранного значения (открыли список, не печатая), список показывается целиком: иначе открытие списка с выбранным значением показывало бы одну опцию. Состояние `typed` включается событием `input` и выключается при выборе, потере фокуса и закрытии по Esc не сбрасывается (текст остаётся, как в спеке). Запрос для фильтра: `typed ? query : ''`.
2. **`onQueryChange(query, reason)`: `reason` это `'input'` (печатает пользователь) или `'reset'` (текст вернулся к подписи значения).** Без `reason` страница с внешним поиском запрашивала бы сервер по подписи только что выбранного значения. Спек, раздел 7, правится.
3. **Печать подсвечивает первую доступную опцию, а не выбранную** (спек: «подсветка сбрасывается на первую доступную»). Для этого `controller.resetActive(source, { ignoreSelected: true })`.
4. **Оболочка поля — якорь панели и носитель размера.** Внутри `Input` этапа 1 и кнопка-шеврон (`tabindex="-1"`, `aria-label` пропом `toggleLabel`, по умолчанию «Показать список»). `mousedown` по шеврону отменяется, чтобы фокус не уходил из поля.
5. **Потеря фокуса:** пустой текст при ушедшем фокусе сбрасывает значение в `null` (решение владельца 3), иначе текст возвращается к подписи значения. Список закрывается.
6. **Общие части выносятся сейчас:** `createListBoxOwner` и `ListBoxPanel` в `src/internal/list-box/`. Третий потребитель (MultiSelect) подключится к ним же; это заложено контрактом раздела 5.
7. **Токены панели:** общая панель читает `--s-kit-listbox-bg`; Select отображает на него свой `--s-kit-select-bg` (публичный токен сохраняется), Combobox свой `--s-kit-combobox-bg`.

---

### Task 1: Общий хук `createListBoxOwner` и панель `ListBoxPanel`, Select на них

**Files:**
- Create: `src/internal/list-box/create-list-box-owner.ts`, `src/internal/list-box/list-box-panel.tsx`, `src/internal/list-box/list-box-panel.module.css`
- Modify: `src/internal/list-box/create-list-box-controller.ts` (опция `ignoreSelected` у `resetActive`), `src/internal/list-box/create-list-box-controller.test.ts`, `src/components/select/select-root.tsx`, `src/components/select/select-content.tsx`, `src/components/select/select.module.css`

**Interfaces:**
- Produces:
  - `controller.resetActive(source?: ActiveSource, options?: { ignoreSelected?: boolean })`: с `ignoreSelected` подсветка идёт на первую доступную строку, выбранные ключи не учитываются.
  - `createListBoxOwner<T>(options: ListBoxOwnerOptions<T>): ListBoxOwner<T>` где `options`: `items: Accessor<readonly T[]>` (уже отфильтрованные), `getKey`, `getLabel`, `groupBy?`, `isItemDisabled?`, `open: Accessor<boolean>`, `anchor: Accessor<HTMLElement | undefined>`, `selectedKeys: Accessor<ReadonlySet<ListKey>>`, `onActivate: (item: T) => void`, `virtualized?: boolean`, `overscan?: number`, `keys?` (как у контроллера), `ignoreSelectedOnReset?: Accessor<boolean>`; результат: `listId`, `rows`, `controller`, `window`, `setScroller`, `openSource: Accessor<ActiveSource>`, `setOpenSource`. Внутри: оценка высоты строки и предельная высота с `anchor` при открытии, `count` окна 0 при закрытом списке, `scrollPaddingStart/End`, `pageSize`, эффект «появился скроллер → `resetActive`», `clearActive` при закрытии.
  - `ListBoxPanel<T>` props: `open`, `onDismiss`, `anchor`, `size`, `owner`-данные (`listId`, `controller`, `rows`, `window`, `setScroller`, `loading`, `loadingText`, `emptyText`, `renderOption`, `renderGroupHeader`), `ref`, `class`, `style`; рендерит `FloatingPanel` (`placement='bottom-start'`, `gap=4`, `matchAnchorWidth`, `initialFocus='none'`) с `ListBox`.
- Consumes: `flattenRows`, `createListBoxController`, `createVirtualWindow`, `createFullWindow`, `readControlHeight`, `readTokenPx`.

**Проверки:**
- Контроллер: `resetActive('keyboard', { ignoreSelected: true })` при выбранной опции №5 подсвечивает первую доступную, без опции подсвечивает выбранную (регресс).
- Все 37 тестов Select проходят без правок (поведение не меняется).
- `pnpm check` зелёный.

- [ ] Тест `ignoreSelected` в тестах контроллера, реализация опции.
- [ ] Вынести хук и панель, перевести `SelectRoot` и `SelectContent`; CSS панели переехал в `list-box-panel.module.css`, в `select.module.css` остаётся отображение `--s-kit-select-bg` на `--s-kit-listbox-bg`.
- [ ] `pnpm check`, коммит `refactor(select): общий хук и панель списка`.

### Task 2: Combobox: корень, поле, панель, быстрая форма

**Files:**
- Create: `src/components/combobox/combobox-context.ts`, `combobox-root.tsx`, `combobox-input.tsx`, `combobox-content.tsx`, `combobox.tsx` (быстрая форма), `combobox.module.css`, `index.ts`, `combobox.test.tsx`

**Interfaces:**
- `ComboboxRootProps<T>`: как у Select (`items`, `getKey`, `getLabel`, `groupBy?`, `isItemDisabled?`, `value?`, `defaultValue?`, `onValueChange?`, `open?`, `defaultOpen?`, `onOpenChange?`, `loading?`, `virtualized?`, `overscan?`, `disabled?`, `size?`, `children?`) плюс `query?: string`, `defaultQuery?: string` (по умолчанию подпись значения или `''`), `onQueryChange?: (query: string, reason: 'input' | 'reset') => void`, `filter?: ((item: T, query: string) => boolean) | false` (по умолчанию подпись содержит запрос без регистра; `false`: список приходит отфильтрованным снаружи).
- `ComboboxInputProps`: атрибуты `<input>` без `class`, `style`, `size`, `value`, `defaultValue`, `role`, `onInput`, `onKeyDown`, `onBlur`; `placeholder`, `toggleLabel?: string` («Показать список»), `class`, `style` (оболочка), `onKeyDown?`, `onBlur?` вызываются первыми и могут отменить обработку через `preventDefault`.
- Поведение:
  - `<input role="combobox" aria-autocomplete="list" aria-haspopup="listbox" aria-expanded aria-controls aria-activedescendant>`, значение поля `query()`.
  - `input`: `typed = true`, `setQuery(text, 'input')`, список открывается (источник `keyboard`), подсветка на первую доступную (`ignoreSelected`).
  - Клавиши при закрытом списке: `ArrowDown`/`ArrowUp` открывают (`preventDefault`); остальное не перехватывается. При открытом: `controller.handleKeyDown` с `keys: { typeahead: false, space: false, homeEnd: false }`; `Enter` с активной опцией выбирает и вызывает `preventDefault`, без активной опции не перехватывается; `Tab` закрывает без `preventDefault`; `Esc` обрабатывает стек слоёв.
  - Выбор: значение меняется, только если ключ другой; `typed = false`; текст возвращается к подписи (`reason: 'reset'`) даже при повторном выборе того же значения; список закрывается.
  - Потеря фокуса: `typed = false`, список закрывается; пустой текст и значение не `null` → `onValueChange(null)`; иначе текст возвращается к подписи.
  - Внешняя смена `value` синхронизирует текст с подписью (`reason: 'reset'`), если поле не в состоянии печати.
  - Шеврон: `click` переключает список (источник `pointer`) и возвращает фокус в поле; `mousedown` отменяется; при `disabled` недоступен.
  - Панель: `ListBoxPanel` с якорем-оболочкой; `emptyText` по умолчанию «Нет элементов для отображения»; при `loading` текст загрузки.
- Быстрая форма `<Combobox items=… getKey=… getLabel=… />` собирает `Root`, `Input`, `Content`; `Object.assign(ComboboxFacade, { Root, Input, Content })`; типы экспортируются из `index.ts`.

**Проверки (jsdom, на `virtualized={false}` и с `installListGeometry`):**
- роли и `aria-*` (поле, `aria-controls` совпадает с `id` скроллера, `aria-activedescendant` совпадает с `[data-active]`, шеврон с `tabindex=-1` и `aria-label`);
- controlled/uncontrolled для `value`, `query`, `open`;
- печать открывает список и фильтрует (по умолчанию и своим `filter`), `filter={false}` показывает `items` как пришли, `onQueryChange` вызывается с `'input'` на каждое изменение;
- открытие списка без печати показывает все опции даже при выбранном значении;
- печать подсвечивает первую доступную, а не выбранную;
- `ArrowDown`/`ArrowUp` на закрытом списке открывают; `Home`, `End`, `Space` не отменяются (`defaultPrevented === false`); `PageDown` двигает подсветку;
- `Enter` с активной опцией выбирает, закрывает, `defaultPrevented === true`; `Enter` без активной опции и при закрытом списке не отменяется;
- после выбора текст равен подписи, `'reset'` в `onQueryChange`; повторный выбор того же значения не вызывает `onValueChange`, но возвращает текст;
- уход фокуса с напечатанным текстом возвращает подпись; с пустым текстом сбрасывает значение в `null`;
- `Esc` закрывает список, фокус остаётся в поле, текст не меняется;
- `Tab` закрывает список;
- клик по шеврону открывает и закрывает, фокус остаётся в поле;
- пустой результат показывает `emptyText`, `loading` показывает текст загрузки;
- отключённая опция не выбирается; группы и заголовки при фильтре;
- внешняя смена `value` меняет текст;
- ошибка вне `Combobox.Root`.

- [ ] Контекст и корень; тесты корня (значения, фильтр, `query`).
- [ ] Поле и шеврон, клавиши и фокус; тесты.
- [ ] Панель, быстрая форма, `index.ts`; тесты.
- [ ] `pnpm check`, коммит `feat(combobox): Combobox на общем списке`.

### Task 3: Страница «Списки»: демонстрации и проверки Combobox

**Files:**
- Create: `playground/src/demo-comboboxes.tsx`, `playground/src/combobox-checks.ts`
- Modify: `playground/src/lists-page.tsx`, `playground/src/playground.css`

**Демонстрации** (`data-combobox`): короткий список с клиентским фильтром; сгруппированный (60 элементов); 100 000 элементов; внешний (серверный) поиск с задержкой 300 мс и `filter={false}` и `loading`; пустой результат; в `<form>` (Enter не отправляет форму при выборе); в диалоге; `disabled` и `aria-invalid`.

**Проверки `runComboboxChecks`:** роли и `aria-*`; панель по ширине оболочки; фильтр сокращает число опций; в 100 000 списке при печати в DOM не более 30 опций; время открытия 100 000 < 100 мс; Enter в `<form>` с активной опцией не вызывает `submit`; открытый список с выбранным значением показывает все опции; уход фокуса с пустым текстом сбрасывает значение; Esc в диалоге закрывает сначала список, потом диалог.

- [ ] Демонстрации и проверки, подключение на странице.
- [ ] `pnpm check`, коммит `feat(playground): демонстрации и проверки Combobox`.

### Task 4: Проверка в Chrome, итоги

- [ ] Вручную настоящими клавишами: печать с фильтром, `ArrowDown`/`ArrowUp`, `Enter`, `Esc`, `Tab`, `Home`/`End` в поле (курсор переносится, список не реагирует), `Space` в тексте, шеврон мышью, выбор мышью, выбор значения и повторное открытие (виден весь список), стирание текста и уход (значение сбрасывается), внешний поиск с задержкой, 100 000 элементов при печати, Combobox в диалоге, панель вверх у нижнего края, кольцо фокуса на поле и на активной опции.
- [ ] Исправить найденное, регрессии покрыть тестами там, где воспроизводимо.
- [ ] Спек: раздел 7 (`onQueryChange(query, reason)`, правило `typed`), таблица частей, новый раздел «Итоги части 3» с числами, расхождениями, находками и непроверенным (Firefox/Safari, IME, скринридеры).
- [ ] `pnpm check`, `scripts/verify-package-form.sh HEAD`, коммит `docs: итоги части 3 (Combobox)`. Без `git push` и тегов.
