# Calendar, часть 1: хелперы дат. План реализации

> **Для исполнителя:** REQUIRED SUB-SKILL: superpowers:executing-plans (или subagent-driven-development). Шаги с чекбоксами.

**Цель:** чистые функции дат без DOM для Calendar и будущих пикеров (раздел 4 спеки).

**Архитектура:** внутреннее представление даты `DateParts { year, month, day }`; арифметика через `Date` в UTC, локальное время только в `todayIso()`; названия и форматы через `Intl`; ISO-строка преобразуется на границе (Adapter). Одна функция или тип на файл, у каждой функции тест рядом.

**Стек:** TypeScript strict (`exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`), Vitest.

**Спека:** `docs/superpowers/specs/2026-11-02-stage-5-calendar-design.md` (раздел 4). План частей 2–4 пишется перед каждой частью. Решения владельца по вопросам 1–8 раздела 10 спеки приняты (2026-11-03).

## Глобальные ограничения

- Табы, одинарные кавычки, длина строки до 140 вместе с комментариями, никаких комментариев в конце строки кода, `simple-import-sort`.
- Допустимые годы 1–9999; результаты `addDays`, `addMonths`, `addYears` зажимаются в `MIN_DATE`…`MAX_DATE`.
- Без библиотек дат и полифиллов; локальное время только в `todayIso()`.
- Не пушить и не ставить теги без слова владельца. Коммит после проверки кода возврата `pnpm check`.

## Файлы (все в `src/utils/date/`, тест рядом `*.test.ts`)

| Файл | Экспорт |
|---|---|
| `date-parts.ts` | `interface DateParts` |
| `date-limits.ts` | `MIN_DATE`, `MAX_DATE` |
| `to-utc-time.ts` | `toUtcTime(parts): number` (мс от эпохи UTC, год <100 корректен) |
| `from-utc-time.ts` | `fromUtcTime(ms): DateParts` |
| `days-in-month.ts` | `daysInMonth(year, month)` |
| `parse-iso-date.ts` | `parseIsoDate(text): DateParts \| null` |
| `format-iso-date.ts` | `formatIsoDate(parts): string` |
| `weekday-of.ts` | `weekdayOf(parts): number` (0 воскресенье) |
| `compare-dates.ts` | `compareDates(a, b): number` |
| `clamp-date.ts` | `clampDate(date, min?, max?)` |
| `add-days.ts`, `add-months.ts`, `add-years.ts` | сдвиги с зажатием |
| `month-grid.ts` | `interface MonthGridCell`, `monthGrid(year, month, firstDayOfWeek)`: 42 клетки |
| `year-block.ts` | `interface YearBlockCell`, `interface YearBlock`, `yearBlock(year)` |
| `today-iso.ts` | `todayIso(): string` |
| `first-day-of-region.ts` | `firstDayOfRegion(region): number` (таблица CLDR) |
| `first-day-of-locale.ts` | `firstDayOfLocale(locale): number` (`getWeekInfo`/`weekInfo`, иначе регион, иначе 1) |
| `create-date-formats.ts` | `interface DateFormats`, `createDateFormats(locale): DateFormats` (кэш по локали) |

## Задачи

### Задача 1: база (типы, пределы, UTC-преобразования, длина месяца, разбор и запись ISO)

- [x] Тесты: `daysInMonth` (все 12 месяцев; февраль 2024 = 29, 1900 = 28, 2000 = 29, 2100 = 28); `toUtcTime`/`fromUtcTime` круг для годов 1, 99, 100, 1970, 2026, 9999; `parseIsoDate`: `'2026-11-02'` разбирается; `null` для `'2026-02-30'`, `'2026-13-01'`, `'2026-00-10'`, `'0000-01-01'`, `'2026-1-2'`, `'2026-11-02T10:00'`, `''`, `' 2026-11-02'`; `formatIsoDate` с нулями (год 1 → `'0001-01-01'`) и обратимость с `parseIsoDate`.
- [x] Реализация файлов таблицы выше (`date-parts`, `date-limits`, `to-utc-time`, `from-utc-time`, `days-in-month`, `parse-iso-date`, `format-iso-date`).
- [x] `pnpm vitest run src/utils/date` зелёный.

### Задача 2: порядок и сдвиги

- [x] Тесты: `weekdayOf` (2026-11-02 понедельник = 1, 2026-11-01 воскресенье = 0, 2000-01-01 суббота = 6); `compareDates` (знак по году, месяцу, дню, равенство); `clampDate` (внутри, ниже `min`, выше `max`, без границ, только одна граница); `addDays` (+1 через конец месяца и года, −1 через начало, 365/366 суток через 2024, переходы на летнее время вокруг 2026-03-29 и 2026-10-25 не теряют и не дублируют сутки, зажатие у `MIN_DATE`/`MAX_DATE`); `addMonths` (31 января + 1 = 28 февраля 2026 и 29 февраля 2024, −1 с января через границу года, +12, 31 мая + 1 = 30 июня, зажатие); `addYears` (29 февраля 2024 + 1 = 28 февраля 2025, +4 = 29 февраля 2028, зажатие).
- [x] Реализация `weekday-of`, `compare-dates`, `clamp-date`, `add-days`, `add-months`, `add-years`.
- [x] Тесты зелёные.

### Задача 3: сетки

- [x] Тесты `monthGrid`: всегда 42 клетки, подряд идущие даты; ноябрь 2026 с понедельника начинается с 2026-10-26 (`inMonth: false`), клетки 6–35 в месяце; февраль 2027 начинается с понедельника (1 февраля 2027 понедельник) и при `firstDayOfWeek = 1` первая строка целиком в месяце, последняя целиком чужая; месяц из 31 дня, начинающийся в воскресенье, при `firstDayOfWeek = 1` занимает 6 строк; `firstDayOfWeek = 0` смещает начало; все клетки `inMonth` подряд и их число = `daysInMonth`. Тесты `yearBlock`: для 2026 годы 2019…2030 (12 штук), `inBlock` только у 2020–2029, подпись `'2020–2029'`; для 2020 и 2029 тот же блок; для 2030 следующий блок; год 5 → блок 0–9 (годы −1…10, края отдаёт как есть).
- [x] Реализация `month-grid.ts`, `year-block.ts` (на миллисекундах без зажатия: клетки у границ диапазона могут выходить за 1–9999, вызывающий код их отключает).
- [x] Тесты зелёные.

### Задача 4: «сегодня» и локаль

- [x] Тесты: `todayIso` при `vi.useFakeTimers(); vi.setSystemTime(new Date(2026, 10, 2, 23, 59))` даёт `'2026-11-02'` (локальные компоненты, не UTC); `firstDayOfRegion` (`'US'` 0, `'RU'` 1, `'EG'` 6, `'JP'` 0, `'DE'` 1, неизвестный 1, регистр безразличен); `firstDayOfLocale`: `'ru'` 1, `'en-US'` 0, `'en'` 0, `'de'` 1, `'ar-EG'` 6, недопустимая строка (`'!!'`) 1 без исключения; запасной путь проверяется подменой `Intl.Locale.prototype.getWeekInfo`/`weekInfo` через `vi.spyOn`/`Object.defineProperty` на `undefined`, и результат остаётся прежним.
- [x] Реализация `today-iso.ts`, `first-day-of-region.ts`, `first-day-of-locale.ts`.
- [x] Тесты зелёные.

### Задача 5: форматы Intl

- [x] Интерфейс `DateFormats`: `monthLong(month): string`, `monthShort(month): string` (первая буква заглавная, по локали), `weekdayShort(weekday): string` (0 воскресенье, первая буква заглавная), `weekdayLong(weekday): string`, `cellLabel(parts): string` («воскресенье, 1 ноября 2026 г.»), `periodLabel(year, month): string` («ноябрь 2026»: части `formatToParts` по порядку локали, хвостовой литерал, начинающийся с пробела, отбрасывается), `yearLabel(year): string`. Все форматтеры `timeZone: 'UTC'`, `createDateFormats` кэширует результат по строке локали.
- [x] Тесты для `ru`: `periodLabel(2026, 11)` = `'ноябрь 2026'`, `monthShort(11)` начинается с заглавной, `weekdayShort(1)` = `'Пн'`, `weekdayLong(0)` = `'воскресенье'`, `cellLabel` содержит день недели, число, месяц, год; для `en-US` `periodLabel(2026, 11)` = `'November 2026'`; для `ja` результат содержит `2026` и не обрезает «月»; второй вызов `createDateFormats('ru')` возвращает тот же объект; значения не зависят от часового пояса процесса (тест выставляет `process.env.TZ` не требуется: форматирование идёт в UTC).
- [x] Реализация `create-date-formats.ts`.
- [x] Тесты зелёные.

### Задача 6: проверка и коммит

- [x] `pnpm check` (код возврата проверить отдельно), затем `git add src/utils/date docs/superpowers/plans/2026-11-03-stage-5-calendar-part-1-date-helpers.md` и коммит `feat(date): хелперы дат для Calendar` с трейлерами.
- [x] Спеку (раздел 4) править только если реализация разошлась с ней, расхождение записать в коммит.

## Самопроверка плана

Покрытие раздела 4 спеки: все 14 строк таблицы ссылаются на задачи 1–5; сигнатуры совпадают с таблицей файлов; зависимости задач только вниз по списку.
