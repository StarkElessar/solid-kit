# Серверная группировка: реализация

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Grid рисует серверную иерархию `GridGroup<T>` (заголовки, строки, подвалы, ленивые группы), управляет UI группировки (панель, чипы, кнопки уровней, пункт меню, перетаскивание) и состоянием `grouping` / `expandedGroupKeys`.

**Architecture:** Тело таблицы строится из плоского списка элементов (`GridItem`): в плоском режиме по требованию (без массива), в сгруппированном из дерева чистой функцией `flattenGroups`. Всё, что работало по `rows`, работает по листовым строкам. UI группировки отдельными компонентами в верхней полосе; перетаскивание одним контроллером на Pointer Events.

**Tech Stack:** Solid 1.9, CSS Modules (нативная вложенность), vitest 5 + jsdom, Chrome-приёмка в playground.

**Spec:** `docs/superpowers/specs/2026-11-01-stage-4b-grouping-design.md`

## Global Constraints

- Один класс, компонент, функция или тип на файл, имена kebab-case; тесты рядом.
- ESLint: табы, одинарные кавычки, до 140 символов (с комментариями), без висящих комментариев, `simple-import-sort`, скобки вокруг многострочного JSX в пропсах, пропсы не деструктурируются.
- CSS: нативная вложенность с явным `&`, на верхнем уровне только корневые селекторы блоков; собственные декларации раньше вложенных правил.
- Комментарии на русском, только неочевидное «почему».
- pnpm: `env -u HTTPS_PROXY -u HTTP_PROXY -u https_proxy -u http_proxy pnpm …`; код возврата `pnpm check` проверять отдельно.
- Коммит: `T=$'Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_017cEinKKFDiYmGrLaaKPqZu'`, затем `git commit -m "…" -m "$T"`.
- Не пушить и не ставить теги без слова владельца.

---

### Task 1: Типы и чистые функции

**Files (all in `src/components/grid/`):** `grid-group.ts`, `grid-item.ts`, `grid-grouping-labels.ts`, `default-grouping-labels.ts`, `flatten-groups.ts`, `all-group-keys.ts`, `expand-level-keys.ts`, `collapse-level-keys.ts`, `add-grouping.ts`, `remove-grouping.ts`, `place-grouping.ts`, `insertion-slot.ts`, `group-title.ts` and their `*.test.ts`.

**Interfaces (Produces):**
- `GridGroup<T>` (раздел 3.2 спека); `GridItem<T>` (раздел 4).
- `flattenGroups<T>(groups: readonly GridGroup<T>[], expanded: ReadonlySet<string>): { items: readonly GridItem<T>[]; rows: readonly T[] }`.
- `allGroupKeys(groups): ReadonlySet<string>`; `expandLevelKeys(groups, expanded): ReadonlySet<string>`; `collapseLevelKeys(groups, expanded): ReadonlySet<string>` (возвращают тот же набор, если менять нечего).
- `addGrouping(list, id): readonly string[]`; `removeGrouping(list, id)`; `placeGrouping(list, id, slot)`; `insertionSlot(centers: readonly number[], x: number): number`; `groupTitle(column: GridColumn<unknown> | undefined, group: GridGroup<unknown>, emptyValue: string): string`.

- [ ] **Step 1:** Написать тесты таблицами: порядок элементов (свёрнутая даёт только заголовок; развёрнутая с rows: заголовок, строки, подвал при `aggregates`; вложенные группы; `not-loaded` даёт `loading`; уровни; `rowIndex` сквозной по листовым строкам); `expandLevelKeys` (самый мелкий свёрнутый видимый уровень, скрытая под свёрнутым предком не берётся), `collapseLevelKeys` (самый глубокий развёрнутый видимый уровень), без изменений возвращают тот же `Set`; `placeGrouping` (удаление исходной позиции перед вставкой, смещение щели), `addGrouping` без дублей, `insertionSlot` на границах.
- [ ] **Step 2:** Прогнать, убедиться что падает: `pnpm exec vitest run src/components/grid/flatten-groups.test.ts …`.
- [ ] **Step 3:** Реализовать (код по спеку, раздел 7).
- [ ] **Step 4:** Зелёные тесты, `pnpm exec eslint --fix src/components/grid`, `tsc`.
- [ ] **Step 5:** Commit `feat(grid): типы и чистые функции группировки`.

---

### Task 2: Плоский список элементов, строки групп, состояние

**Files:** Create `grid-group-row.tsx`, `grid-loading-group-row.tsx`, `grid-item-row.tsx`; Modify `grid-props.ts` (`rows?`, `groupable`, `groups`, `grouping`-тройка, `expandedGroupKeys`-тройка, `onGroupExpand`, `groupingLabels`), `grid-column.ts` (`groupable`, `groupValue`), `grid-context.ts`, `grid.tsx`, `grid-body.tsx`, `grid-row.tsx`, `grid-cell.tsx`, `grid-select-cell.tsx`, `grid-table.tsx`, `grid-totals-row.tsx`, `grid.module.css`, `index.ts` (экспорт `GridGroup`, `GridGroupingLabels`), `grid.test.tsx`.

**Interfaces:**
- Consumes: Task 1.
- Produces (контекст): `itemCount(): number`, `itemAt(index): GridItem<unknown> | undefined`, `rowIndexOfItem(index): number | undefined`, `expandedGroupKeys(): ReadonlySet<string>`, `toggleGroup(key)`, `groupingLabels()`, `columnsById` для заголовков; `rows()` это листовые строки.

- [ ] **Step 1:** Падающие тесты «Grid: группировка»: без `groups` ничего не меняется; с `groups`: порядок `tr` (заголовок, строки, подвал), агрегаты в заголовке свёрнутой и в подвале развёрнутой, подпись с `colspan`, отступ уровня, клик по заголовку/шеврону вызывает `onExpandedGroupKeysChange`, `aria-expanded`, `aria-rowcount`/`aria-rowindex`, выбор по клику на строку внутри группы работает, на заголовок не выбирает и меню строки не открывает, `not-loaded` показывает заглушку и вызывает `onGroupExpand`, пустой `groups` даёт состояние «пусто», `rows` в сгруппированном режиме игнорируется, свёрнутость сохраняется при смене `groups` с теми же ключами.
- [ ] **Step 2:** Прогнать — падает.
- [ ] **Step 3:** Реализация: в `grid.tsx` `groupedMode`, мемо `flat = flattenGroups(...)` (только в сгруппированном режиме), `leafRows`, `itemCount`, `itemAt`, `rowIndexOfItem`; `windowOptions.count = itemCount`; тройки `grouping`, `expandedGroupKeys`; `GridBody` и обработчики событий через `rowIndexOfItem`; `GridItemRow` выбирает компонент по `kind`; `GridRow` получает `index` (элемент) и вычисляет `rowIndex`; `aria-rowcount`/`aria-rowindex` по `itemCount`.
- [ ] **Step 4:** Зелёные тесты, `pnpm check`.
- [ ] **Step 5:** Commit `feat(grid): серверные группы: заголовки, строки, подвалы, свёрнутость`.

---

### Task 3: Панель, чипы, кнопки уровней, пункт меню

**Files:** Create `grid-grouping-bar.tsx`, `grid-grouping-panel.tsx`, `grid-grouping-chip.tsx`, `grid-grouping-toolbar.tsx`; Modify `grid.tsx` (полоса над скроллером, действия), `grid-context.ts`, `grid-column-menu.tsx` (пункт), `grid.module.css`, `grid.test.tsx`.

**Interfaces (контекст):** `groupable()`, `grouping(): readonly string[]`, `setGrouping(next)`, `groupableColumns`, `collapseLevel()`, `collapseAll()`, `expandLevel()`, `expandAll()`, `hasGroups(): boolean`.

- [ ] **Step 1:** Падающие тесты «Grid: панель группировки»: полосы нет без `groupable`; с ним панель с `hint` и четыре кнопки; чипы по `grouping` в порядке; «×» убирает и вызывает `onGroupingChange`; Delete/Backspace убирают; Alt+Arrow переставляют; кнопки уровней дают ожидаемый `onExpandedGroupKeysChange`; кнопки отключены без `groups` и при `loading`; пункт меню колонки «Сгруппировать» добавляет в конец и закрывает меню, у сгруппированной колонки «Убрать группировку», у `groupable: false` пункта нет.
- [ ] **Step 2:** Падает.
- [ ] **Step 3:** Реализация (иконки svg 16 px, кольца фокуса по образцу `.menu-button`).
- [ ] **Step 4:** `pnpm check`.
- [ ] **Step 5:** Commit `feat(grid): панель группировки, чипы, кнопки уровней, пункт меню`.

---

### Task 4: Перетаскивание

**Files:** Create `create-grouping-drag.ts`, `grid-drag-ghost.tsx`; Modify `grid-header-cell.tsx`, `grid-grouping-chip.tsx`, `grid-grouping-panel.tsx`, `grid.tsx`, `grid-context.ts`, `grid.module.css`, `grid.test.tsx`.

**Interfaces (контекст):** `beginGroupingDrag(source, event)`, `drag(): GroupingDragState | undefined`.

- [ ] **Step 1:** Тесты в jsdom событиями pointer (геометрию чипов подставить через `getBoundingClientRect`): порог 4 px (клик без движения не начинает жест), заголовок отпущен над панелью — `onGroupingChange` с колонкой на нужной позиции, чип переставляется, отпускание вне панели и Esc отменяют, после жеста гасится один `click`, тач-указатель жест не начинает, ручка ресайза и кнопка меню жест не начинают.
- [ ] **Step 2:** Падает.
- [ ] **Step 3:** Реализация по разделу 8 спека; слушатели снимаются при завершении и в `onCleanup`.
- [ ] **Step 4:** `pnpm check`.
- [ ] **Step 5:** Commit `feat(grid): перетаскивание заголовков и чипов группировки`.

---

### Task 5: Playground, приёмка в Chrome, итоги

**Files:** Modify `playground/src/demo-grid.tsx`; Create `playground/src/grouping-checks.ts`, `playground/src/demo-groups.ts` («сервер»: `buildGroups(orders, fields, expandedLazy)`); Modify `playground/src/grid-page.tsx`; спек (раздел итогов).

- [ ] **Step 1:** Демо: чекбокс «Группировка» (`data-grid-grouping`), включает `groupable`, `grouping` в состоянии страницы, `groups` строит «сервер» из `ALL_ORDERS` (по выбранным полям; `count`, `aggregates` по `amount` и `score`; страницы режут верхний уровень; группы от 20 строк ленивые: `not-loaded`, пока `onGroupExpand` не догрузит через таймер).
- [ ] **Step 2:** `grouping-checks.ts`: порядок и число `tr`, агрегаты, подвалы, уровни, кнопки уровней, чипы и пункт меню, ленивая группа, окно DOM не больше окна плюс overscan при 10 000 строках; переключатели возвращаются.
- [ ] **Step 3:** `pnpm check`, сборка, временный сервер, автопроверки зелёные; вручную: перетаскивание мышью заголовка и чипов, Esc, светлая и тёмная темы, фокус-кольца, прокрутка, критерии (г) и (е) меню колонки.
- [ ] **Step 4:** Сервер убить по PID, вкладки закрыть; раздел «Итоги приёмки» в спек; `pnpm check`, `scripts/verify-package-form.sh HEAD`, коммиты.
