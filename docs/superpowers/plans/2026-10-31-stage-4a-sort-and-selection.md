# Этап 4а, часть 3: колонка чекбоксов, выбор строк, сортировка, клики по строке. План реализации

> **Для исполнителя:** шаги отмечены чекбоксами (`- [ ]`). Задачи выполняются по порядку; в задачах с кодом сначала красный тест, потом реализация, потом `pnpm check` (код возврата проверяется отдельной командой) и коммит. Раскладочное поведение (sticky колонки чекбоксов, кольца фокуса, прокрутка к сфокусированному элементу) в jsdom не проверяется: его проверяют задачи 5–6 в Chrome.

**Цель:** поведение поверх готовой таблицы: колонка чекбоксов (`selectable`), выбор строк кликом по строке и по чекбоксу, главный чекбокс «все / часть / ничего», сортировка по клику на заголовок (грид сам строки не сортирует), `onRowDoubleClick`.

**Архитектура:** состояния выбора и сортировки это два `createControllableSignal` в `Grid`; чистая логика уже есть (`selection-state.ts`, `next-sort.ts`, `is-interactive-target.ts`, часть 1). Колонка чекбоксов входит в раскладку (`selectable` в `computeColumnLayout`, ширина из токена `--s-kit-grid-select-width`) и в переменные таблицы. Клики по строкам обрабатываются одним делегированным обработчиком на `<tbody>`: строка определяется по `data-index`, ключ берётся из `rowIndex().keys[index]` (не из атрибута-строки).

**Стек:** Solid 1.9, CSS Modules, vitest 5 (jsdom), `Checkbox` из `@stark/solid-kit/checkbox`, Chrome для раскладки и фокуса.

**Спек:** `docs/superpowers/specs/2026-10-31-stage-4a-grid-core-design.md` (разделы 2, 4.3, 6, 7, 13 критерии 4 и 7); части 1–2: `…-stage-4a-pure-functions.md`, `…-stage-4a-table.md`.

## Глобальные ограничения

- Репозиторий публичный: ни ключей, ни токенов, ни `.env`, ни корпоративной почты в коммитах.
- Один компонент/функция — один файл (kebab-case).
- ESLint: табы, одинарные кавычки, длина строки ≤ 140 вместе с комментариями, без комментариев в конце строки, `solid/reactivity`, `exactOptionalPropertyTypes`, `no-unnecessary-type-parameters` (части грида не generic, тип строки для них `unknown`). Stylelint: `outline: none/0` запрещён, классы kebab-case, `--s-kit-control-height` с фолбэком, литералов цвета нет, порядок свойств (`pnpm stylelint --fix`).
- Пропсы не деструктурируются. Публичные тексты по умолчанию русские.
- pnpm запускается как `env -u HTTPS_PROXY -u HTTP_PROXY -u https_proxy -u http_proxy pnpm …`; dev-сервер playground на порту 5173 не трогать, вкладки Chrome закрывать, временные серверы останавливать по PID после проверки cwd.
- Тег не ставится и ничего не пушится без отдельного слова владельца.

## Состав части и решения

В `GridProps` добавляются: `selectable`, `selectedKeys` / `defaultSelectedKeys` / `onSelectedKeysChange`, `sort` / `defaultSort` / `onSortChange`, `onRowDoubleClick`, `selectAllLabel` (`'Выбрать все строки'`), `selectRowLabel` (`'Выбрать строку'`). Меню строки, состояния загрузки и пусто, хост панелей это часть 4.

1. **Колонка чекбоксов** первая, всегда sticky (`data-sticky`, `inset-inline-start: 0`), ширина `--s-kit-grid-select-width` (фолбэк 44 px), читается с корня после монтирования (`readTokenPx`), до монтирования 44. Ей принадлежит `<col>` с шириной `var(--s-kit-grid-select-w)`; переменная пишется `layoutCssVars` вместе с остальными (когда `selectWidth > 0`). Смещения закреплённых колонок считаются от её ширины (уже так в `computeColumnLayout`). Индексы колонок `--s-kit-grid-w-<i>` по-прежнему считаются без колонки чекбоксов. Последняя закреплённая ячейка (`data-sticky-last`): последняя закреплённая колонка, а если закреплённых колонок нет, то сама колонка чекбоксов. `aria-colcount` и `colspan` spacer-строк включают колонку чекбоксов.
2. **Чекбокс** строки и главный чекбокс это `Checkbox` кита. Главный: `checked = state === 'all'`, `indeterminate = state === 'some'`, `state = selectionOf(selected, rowIndex().keys)`; по `onCheckedChange(true)` вызывается `selectAllKeys`, по `false` `clearKeys`. Чекбокс строки: `checked = selected.has(key)`, `onCheckedChange` переключает ключ. Подписи из `selectAllLabel` и `selectRowLabel` (aria-label).
3. **Клик по строке.** `onClick` на `<tbody>`: строка = ближайший `tr[data-index]`; если `isInteractiveTarget(event.target, tr)`, ничего не делается; иначе `toggleKey`. **Двойной клик** (`onDblClick` на `<tbody>`): та же проверка цели, затем `onRowDoubleClick(rows()[index])`. Выбор при двойном клике не откатывается отдельно: два клика сами гасят друг друга (раздел 7 спека, открытый вопрос 2); `onSelectedKeysChange` при этом вызывается дважды.
4. **Выбранная строка**: `data-selected` и `aria-selected="true"` на `<tr>`; заливка `--s-kit-color-row-selected`, у sticky-ячеек непрозрачная: `color-mix(in oklch, var(--s-kit-color-row-selected), var(--s-kit-grid-bg, var(--s-kit-color-surface)))`. Наведение у sticky-ячеек так же непрозрачное.
5. **Сортировка**: для `column.sortable === true` в `<th>` лежит `<button type="button">` (стрелка слева от названия, у неактивной колонки приглушённая); клик зовёт `onSortChange(nextSort(sort, column.id))`. `aria-sort="ascending" | "descending"` только у активной колонки, у остальных сортируемых `aria-sort="none"`, у несортируемых атрибута нет. Грид строки не сортирует. Состояние `sort`/`defaultSort` по умолчанию `null`. Кнопка занимает ширину заголовка за вычетом зоны ручки ресайза (8 px справа) и имеет кольцо фокуса внутри ячейки (`outline` с отрицательным смещением, как у контролов в `data-s-kit-focus-inset`).
6. **Фокус не прячется под липкими областями**: `scroll-padding-inline-start` скроллера уже равен `stickyWidth` (включая колонку чекбоксов), `scroll-padding-block-start` высоте шапки; проверка в Chrome (задача 6), в jsdom не проверяется.
7. **Расхождения со спеком, которые закладываются заранее**: нет. Всё, что обнаружится, записывается в итоги.

---

### Task 1: колонка чекбоксов в раскладке и разметке (без чекбоксов внутри)

**Файлы:**
- Изменить: `src/components/grid/column-css-vars.ts`, `column-css-vars.test.ts`, `grid-props.ts`, `grid-context.ts`, `grid.tsx`, `create-grid-resize.ts`, `grid-colgroup.tsx`, `grid-header.tsx`, `grid-body.tsx`, `grid-row.tsx`, `grid-table.tsx`, `grid-header-cell.tsx`, `grid-cell.tsx` (при необходимости), `grid.module.css`, `grid.test.tsx`
- Создать: `src/components/grid/grid-select-header-cell.tsx`, `src/components/grid/grid-select-cell.tsx`

**Интерфейсы:**
- Производит: `SELECT_WIDTH_VAR = '--s-kit-grid-select-w'` в `column-css-vars.ts`; `layoutCssVars(layout)` добавляет `SELECT_WIDTH_VAR: '<selectWidth>px'` при `layout.selectWidth > 0`. `GridResizeOptions.layoutOptions` становится `Accessor<ColumnLayoutOptions>`. `GridContextValue` получает `selectable: Accessor<boolean>` и `selectedKeys: Accessor<ReadonlySet<RowKey>>`, `lastStickyIndex` остаётся (`-1` без закреплённых); признак «последняя sticky-ячейка у колонки чекбоксов» вычисляется в самих ячейках: `selectable && lastStickyIndex === -1`.
- `GridProps` получает все пропсы части (типы как в разделе 2 спека); `defaultSelectedKeys` и `defaultSort` читаются один раз.

- [ ] Тесты: `layoutCssVars` пишет `--s-kit-grid-select-w` только при `selectWidth > 0` (обновить тесты части 1: с `selectable` ключ есть, без нет); в `grid.test.tsx` при `selectable`: первая `<col>` с `width: var(--s-kit-grid-select-w)`, число `<col>` = колонки + 1, на таблице стоят `--s-kit-grid-select-w: 44px` и `--s-kit-grid-table-w` с учётом 44, `--s-kit-grid-left-<i>` закреплённых сдвинуты на 44, первая `<th>` и первая `<td>` каждой строки имеют `data-sticky` и `inset-inline-start: 0px`, `data-sticky-last` у колонки чекбоксов только когда закреплённых колонок нет, иначе у последней закреплённой; `aria-colcount` на единицу больше; colspan spacer-строки на единицу больше; без `selectable` ничего из этого нет.
- [ ] Реализация (в `Grid` ширина колонки чекбоксов: `createSignal(44)` с обновлением из `readTokenPx(root, ['--s-kit-grid-select-width'], 44)` в `onMount`; `layoutOptions` реактивный). Ресайз продолжает работать (тест части 2 на ресайз проходит без изменений, плюс тест: при `selectable` ресайз закреплённой колонки двигает `--s-kit-grid-left-<j>` от 44).
- [ ] `pnpm check`, коммит.

### Task 2: чекбоксы, состояние выбора, главный чекбокс

**Файлы:**
- Изменить: `src/components/grid/grid.tsx`, `grid-context.ts`, `grid-select-header-cell.tsx`, `grid-select-cell.tsx`, `grid.module.css`, `grid.test.tsx`

**Интерфейсы:**
- Потребляет: `Checkbox`, `toggleKey`, `selectAllKeys`, `clearKeys`, `selectionOf`, `createControllableSignal`.
- Производит: `GridContextValue.toggleRow(index: number)`, `GridContextValue.toggleAll(checked: boolean)`, `GridContextValue.selectionState: Accessor<SelectionState>`, `GridContextValue.selectAllLabel`, `selectRowLabel` (аксессоры строк с фолбэками).

- [ ] Тесты: чекбокс строки с aria-label `Выбрать строку`, главный `Выбрать все строки`; клик по чекбоксу строки зовёт `onSelectedKeysChange` с новым `Set` (старый не мутируется), строка получает `data-selected` и `aria-selected="true"`; главный чекбокс: `checked`/`indeterminate` по состоянию none/some/all; клик по главному при `none` и `some` выбирает все ключи загрузки, при `all` убирает только ключи загрузки (ключ постороннего набора остаётся); controlled: если родитель не обновил `selectedKeys`, чекбокс возвращается к значению пропа; выбор сохраняется при замене `rows` (ключи не пропадают); `defaultSelectedKeys` задаёт начальный выбор.
- [ ] Реализация, стили колонки чекбоксов (центрирование, отсутствие многоточия), заливка выбранной строки с `color-mix` для sticky-ячеек.
- [ ] `pnpm check`, коммит.

### Task 3: клик и двойной клик по строке

**Файлы:**
- Изменить: `src/components/grid/grid-body.tsx`, `grid.tsx`, `grid-context.ts`, `grid.test.tsx`

**Интерфейсы:**
- Потребляет: `isInteractiveTarget`, `toggleRow`.
- Производит: делегированные `onClick` и `onDblClick` на `<tbody>`; вспомогательная функция `rowOfEvent(event, tbody)` внутри `grid-body.tsx` (возвращает `{ tr, index }` или `undefined` для spacer-строк и целей вне строки).

- [ ] Тесты: клик по ячейке с текстом переключает выбор; клик по `button`, `a[href]`, `input`, `select`, `[role="combobox"]`, `label`, `[data-grid-no-select]` внутри ячейки выбор не меняет; клик по spacer-строке и по чекбоксу строки не даёт двойного переключения (чекбокс переключает один раз); без `selectable` клик по строке ничего не вызывает; `dblclick` по тексту вызывает `onRowDoubleClick` с объектом строки (не индексом и не ключом); `dblclick` по `button` в ячейке не вызывает; последовательность `click`, `click`, `dblclick` оставляет итоговый выбор прежним, `onRowDoubleClick` вызван один раз, `onSelectedKeysChange` дважды; смена `rows` до клика (строка с тем же индексом, другим ключом) переключает ключ новой строки.
- [ ] Реализация, `pnpm check`, коммит.

### Task 4: сортировка по клику на заголовок

**Файлы:**
- Создать: `src/components/grid/grid-sort-button.tsx`
- Изменить: `src/components/grid/grid-header-cell.tsx`, `grid.tsx`, `grid-context.ts`, `grid.module.css`, `grid.test.tsx`

**Интерфейсы:**
- Потребляет: `nextSort`, `createControllableSignal`.
- Производит: `GridContextValue.sort: Accessor<GridSort | null>`, `GridContextValue.toggleSort(columnId: string)`; `GridSortButton({ title: string; direction: 'asc' | 'desc' | undefined; onClick })`: кнопка с inline-SVG-стрелкой (`aria-hidden`), `data-active` у активной.

- [ ] Тесты: у несортируемой колонки нет кнопки и `aria-sort`; у сортируемой есть кнопка с именем колонки и `aria-sort="none"`; клик: `onSortChange({columnId, direction: 'asc'})`, затем `desc`, затем `null`, смена колонки начинает с `asc`; активная колонка `aria-sort="ascending"` / `"descending"`, остальные `"none"`; controlled: родитель не принял сортировку, атрибуты не меняются; `defaultSort` задаёт начальное состояние; Enter и Space на кнопке работают как клик (нативная кнопка, проверяется `userEvent` или `click`); кнопка внутри `th` не входит в зону ручки ресайза (`th textContent === title` остаётся верным, стрелка без текста); сортировка не меняет порядок строк.
- [ ] Реализация, кольцо фокуса кнопки внутри ячейки, `pnpm stylelint --fix`.
- [ ] `pnpm check`, коммит.

### Task 5: страница «Грид» в playground

**Файлы:**
- Изменить: `playground/src/demo-grid.tsx`, `playground/src/grid-page.tsx`, `playground/src/grid-checks.ts`, `playground/src/playground.css`

**Интерфейсы:**
- Производит: в демо переключатель `selectable` (по умолчанию включён), сортируемые колонки (номер, заказчик, сумма, оценка, создан) и клиентская сортировка `rows` по `value` (числа, строки, `Date`), состояние сортировки на странице, вывод числа выбранных и последней записи `onRowDoubleClick`, кнопка с `data-grid-no-select` и текстовое поле в одной из колонок (проверка кликов по контролам). Проверки: (8) колонка чекбоксов sticky, при горизонтальной прокрутке стоит у левого края и вплотную к первой закреплённой колонке (зазор 0); существующие проверки sticky параметризуются наличием `[data-grid-select]` (колонка чекбоксов добавляет одну sticky-ячейку, смещения закреплённых колонок начинаются с её ширины); (9) клик по ячейке выбирает строку (`aria-selected`), второй клик снимает; (10) клик по чекбоксу строки выбирает один раз; (11) клик по контролу в ячейке выбор не меняет; (12) главный чекбокс: none → all → none, `indeterminate` при частичном выборе; (13) `dblclick` не меняет выбор и логирует строку; (14) сортировка: клик по заголовку даёт `aria-sort="ascending"`, первая строка с наименьшим значением; (15) выбор сохраняется при замене числа строк.

- [ ] Реализация без тестов vitest, `pnpm check`, коммит.

### Task 6: приёмка части в Chrome

- [ ] `#grid` на dev-сервере, автопроверки зелёные в обеих темах и при размерах `sm`, `md`, `lg`.
- [ ] Настоящими действиями: клик мышью по строке и по чекбоксу, двойной клик, главный чекбокс, Tab и Shift+Tab по таблице при горизонтальной прокрутке (кольцо фокуса кнопки сортировки, чекбокса и контрола в ячейке видно целиком внутри рамки, не под липкой шапкой и не под закреплёнными колонками), Enter и Space на кнопке сортировки и на чекбоксе, клик по контролу в ячейке без выбора.
- [ ] Production-сборка: число `<tr>`, доля медленных кадров при прокрутке с `selectable` (число `Checkbox` на строку может удорожать монтирование; результат записать в итоги в тех же режимах и скоростях, что в части 2, и отметить скорость критерия из раздела 13).
- [ ] Всё найденное исправить и записать в итоги.

### Task 7: итоги части

- [ ] `pnpm check` (число тестов выросло) и `scripts/verify-package-form.sh HEAD` (код возврата и число OK записать).
- [ ] В спеке строка 3 таблицы частей «выполнена», раздел «Итоги части 3» (расхождения, число тестов, что проверено в Chrome, что нет).
- [ ] Коммит. Тег и push не делаются.
