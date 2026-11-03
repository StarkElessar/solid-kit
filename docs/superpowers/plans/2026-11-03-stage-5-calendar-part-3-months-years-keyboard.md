# Calendar, часть 3: месяцы, годы, клавиатура. План реализации

> **Для исполнителя:** REQUIRED SUB-SKILL: superpowers:executing-plans. Шаги с чекбоксами.

**Цель:** уход вглубь по кнопке названия периода (дни → месяцы → годы), выбор месяца и года, клавиатурная модель раздела 5 спеки.

**Архитектура:** режим `view` это сигнал Calendar (`defaultView`), контекст получает `drill`, `back`, `pick`, `canDrill`, `isInRange`. Тела месяцев и годов используют общую ячейку и сетку 3 × 4 на всю рамку тела (размер тела равен размеру режима дней). Клавиатура: чистая функция `navigateByKey` (клавиша и режим → целевая дата и направление), поиск доступной даты `findEnabledDate`, обработчик `handleCalendarKeyDown` вешается на корень и реагирует только на ячейки.

**Спека:** `docs/superpowers/specs/2026-11-02-stage-5-calendar-design.md` (разделы 3, 5). Уточнение к разделу 5: Backspace в режимах месяцев и годов возвращает на уровень ниже по глубине (годы → месяцы → дни), как выбор ячейки, но без выбора.

## Глобальные ограничения

Те же, что в части 2. Кроме того: поиск доступной даты ограничен `MAX_SKIP` шагов (защита от предиката, отключающего всё); клавиатура игнорирует Alt/Ctrl/Meta и фокус вне ячеек (кнопки шапки и подвала работают как обычные кнопки); Esc не обрабатывается.

## Файлы (`src/components/calendar/`)

`period-overlaps-limits.ts`, `unit-period.ts`, `find-enabled-date.ts`, `navigate-by-key.ts`, `handle-calendar-key-down.ts`, `calendar-picker-cell.tsx`, `calendar-months.tsx`, `calendar-years.tsx`; изменены `calendar-props.ts` (`defaultView`), `calendar-context.ts`, `calendar.tsx`, `calendar-header.tsx`, `calendar.module.css`, `is-period-reachable.ts` (использует `periodOverlapsLimits`), тесты.

## Задачи

### Задача 1: чистые функции

- [x] `periodOverlapsLimits(from, to, min?, max?)` и `unitPeriod(view, date)`; `isPeriodReachable` переводится на первую. Тесты: пересечение, касание границ, пределы 1 и 9999, период месяца, года, дня.
- [x] `navigateByKey(view, key, shiftKey, date, firstDay)`: стрелки, Home/End, PageUp/PageDown во всех трёх режимах; `null` для прочих клавиш. Тесты по таблице клавиш для каждого режима.
- [x] `findEnabledDate(start, direction, view, isDisabled, inRange)`: старт доступен, пропуск отключённых, граница диапазона даёт `null`, лимит шагов даёт `null`.

### Задача 2: компонент

- [x] `defaultView`, `drill`, `back`, `pick`, `isInRange`, подвал «Сегодня» возвращает режим дней; шапка с кнопкой названия (в режиме годов текст); `CalendarMonths`, `CalendarYears`, `CalendarPickerCell`; стили сетки 3 × 4 на всю рамку.
- [x] `handleCalendarKeyDown` на корне; фокус возвращается на ячейку после смены режима.

### Задача 3: тесты компонента

- [x] Переходы по названию туда и обратно, выбор месяца и года без смены `value`, подсветка выбранного и текущего, отключённые месяцы и годы, шаги стрелок шапки в каждом режиме, `defaultView`, размер тела одинаков (классы и число ячеек), клавиатура по режимам (стрелки с пропуском отключённых, Home/End, PageUp/PageDown, Shift+PageUp, Backspace), фокус не теряется.

### Задача 4: проверка и коммит

- [x] `pnpm check`, коммит `feat(calendar): месяцы, годы, клавиатура (этап 5, часть 3)`; в спеке уточнить Backspace.
