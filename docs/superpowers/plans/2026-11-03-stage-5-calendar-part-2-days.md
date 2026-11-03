# Calendar, часть 2: режим дней, шапка, подвал. План реализации

> **Для исполнителя:** REQUIRED SUB-SKILL: superpowers:executing-plans. Шаги с чекбоксами.

**Цель:** компонент `Calendar` в режиме дней (спека разделы 2, 3, 6; режимы месяцев и годов и клавиатура приходят в части 3).

**Архитектура:** состояние `value` и `focusedDate` (ISO-строки) через `createControllableSignal`, внутри `DateParts`; показанный месяц это месяц `focusedDate`. Контекст раздаёт шапке, телу и подвалу готовые значения и действия. Размер ячейки от `--s-kit-control-height` (`data-s-kit-size` на корне), цвета только токены.

**Стек:** Solid 1.9, CSS Modules с нативной вложенностью, Vitest + `@solidjs/testing-library`.

**Спека:** `docs/superpowers/specs/2026-11-02-stage-5-calendar-design.md`. **Часть 1:** `src/utils/date/` готова (`monthGrid`, `createDateFormats`, `clampDate`, `addMonths`…).

## Глобальные ограничения

- Один компонент, тип или контекст на файл; публичный вход `src/components/calendar/index.ts` только реэкспортирует.
- Нативная вложенность CSS (`css-nesting.test.ts`), на верхнем уровне только корневые правила классов; литералов цветов нет; `0` вместо `0px`.
- Пропсы не деструктурируются; `data-s-kit` на корне; нативные `<button type="button">`.
- В этой части: `defaultView` и режимы месяцев и годов не реализуются (часть 3); заголовок периода это текст, а не кнопка.
- Не пушить, не ставить теги. Коммит после проверки кода возврата `pnpm check`.

## Файлы (`src/components/calendar/`, тест рядом)

`calendar-view.ts` (тип `CalendarView`), `calendar-labels.ts` + `default-calendar-labels.ts`, `calendar-props.ts`, `calendar-context.ts`, `calendar-icon-paths.ts` + `calendar-icon.tsx`, `read-date-prop.ts` (разбор ISO-пропа с dev-предупреждением), `shift-focused.ts` (шаг стрелок), `is-period-reachable.ts` (кнопка шапки отключается у границы `min`/`max`), `calendar-header.tsx`, `calendar-days.tsx`, `calendar-day-cell.tsx`, `calendar-footer.tsx`, `calendar.tsx`, `calendar.module.css`, `index.ts`, `calendar.test.tsx`.

## Задачи

### Задача 1: чистые функции

- [x] `shiftFocused(view, date, direction)` (дни ±1 месяц, месяцы ±1 год, годы ±10 лет, через `addMonths`/`addYears`) и `isPeriodReachable(view, date, direction, min, max)`: период целиком вне `[max(min, 0001-01-01), min(max, 9999-12-31)]` недостижим. Тесты: шаги и ужимание дня; достижимость на границах `min`/`max`, без границ, у пределов 1 и 9999, годовой блок.
- [x] `readDateProp(name, text)`: строгий разбор, при непустом недопустимом значении `console.warn` в dev. Тест: валидное, `undefined`, невалидное (предупреждение).

### Задача 2: каркас, контекст, подписи

- [x] Файлы `calendar-view`, `calendar-labels`, `default-calendar-labels`, `calendar-props` (включая `size`), `calendar-context`, значки.

### Задача 3: компонент и разметка

- [x] `calendar.tsx`: две управляемые тройки (`value`, `focusedDate`), мемо `focused`/`selected`/`today`/границы, `isDateDisabled`, `select`, `shift`, `goToToday`, `focusCell` (микрозадача после перерисовки), `autoFocus` в `onMount`.
- [x] Шапка, тело (`role="grid"`, 7 заголовков колонок, 6 строк по 7 ячеек, roving tabindex), подвал; стили.

### Задача 4: тесты компонента

- [x] 42 ячейки при любом месяце (ноябрь 2026, февраль 2027, март 2026); приглушённые чужие дни; выбор дня и дня соседнего месяца (месяц переключается); controlled/uncontrolled для `value` и `focusedDate`; стрелки шапки и их отключение у `min`/`max`; «Сегодня» (перенос без выбора, отключена вне диапазона, `showToday={false}`); `disabled`, `isDateDisabled`; roving tabindex; атрибуты ARIA; `labels`; `autoFocus`; `firstDayOfWeek` и `locale`.

### Задача 5: проверка и коммит

- [x] `pnpm check`, коммит `feat(calendar): режим дней, шапка, подвал (этап 5, часть 2)`.
