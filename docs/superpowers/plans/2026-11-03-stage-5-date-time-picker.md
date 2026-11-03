# DateTimePicker. План реализации

> **Для исполнителя:** REQUIRED SUB-SKILL: superpowers:executing-plans. Шаги с чекбоксами. Каждая часть заканчивается зелёной `pnpm check` (код возврата проверять отдельно) и своим коммитом.

**Цель:** DateTimePicker на `PickerField` с `Calendar` и `TimeColumns` в одной панели (спека `docs/superpowers/specs/2026-11-03-stage-5-date-time-picker-design.md`, далее «спека»).

**Архитектура:** `PickerField.panelTab` (Tab внутри панели); чистые хелперы `src/utils/date-time/`; DateTimePicker собирает `PickerField`, `Calendar`, `TimeColumns` и общую модель выбора. Calendar и `TimeColumns` не меняются.

**Стек:** Solid 1.9, CSS Modules с нативной вложенностью, Vitest + `@solidjs/testing-library` (без jest-dom), `createControllableSignal`.

## Решения владельца (2026-11-03)

Спека и план приняты одним словом «выполняй»; открытые вопросы раздела 12 спеки приняты по рекомендациям: выбор применяется сразу; недостающая часть `00:00` или сегодня; один подвал «Сейчас»; раскладка в ряд; Tab ходит внутри панели у DateTimePicker и TimePicker; время без даты не принимается.

## Глобальные ограничения

Один компонент, тип или функция на файл; тесты рядом; нативная вложенность CSS (явный `&`), токены, без литералов цветов, классы в kebab-case; пропсы не деструктурируются; табы, одинарные кавычки, длина строки до 140 вместе с комментариями, без комментариев в конце строки кода, `simple-import-sort`, без non-null assertions, без jest-dom, `--max-warnings 0`; не пушить и не ставить теги без слова владельца.

## Часть 1: `PickerField.panelTab`

- [x] `src/internal/floating-panel/tabbable-elements.ts`: общий список tabbable-элементов панели (вынести из `focus-initial.ts`, его поведение и тесты не меняются).
- [x] `PickerFieldProps.panelTab?: 'close' | 'move'` (по умолчанию `'close'`); при `'move'` Tab внутри панели не отменяется, пока есть куда идти; на последнем элементе (Tab) и на первом (Shift+Tab) панель закрывается, фокус в поле, событие отменяется. Тесты: обе ветки, края, без tabbable-элементов.
- [x] TimePicker передаёт `panelTab='move'`; тест TimePicker на Tab между колонками; правка раздела спеки TimePicker (отклонение исправлено).
- [x] `pnpm check`, коммит `feat(picker-field): panelTab для Tab внутри панели`.

## Часть 2: хелперы дата-время (`src/utils/date-time/`)

- [x] Тесты и реализация: `date-time-parts`, `date-time-rules`, `parse-iso-date-time` (+ отказы: без `T`, секунды, пробел, неверная дата, неверное время), `format-iso-date-time` (круг), `compare-date-times`, `read-date-time-prop`, `is-date-time-allowed`, `time-bounds-for-date`, `fit-time-to-date`, `format-date-time-text`, `parse-date-time-text` (`ru`, `en-US`, `ja`, `de`; дата без времени; время без даты и мусор дают `null`; круг с форматом).
- [x] `pnpm check`, коммит `feat(date-time): хелперы даты и времени для DateTimePicker`.

## Часть 3: DateTimePicker

- [ ] `date-time-picker-props`, `date-time-picker-labels`, `default-date-time-picker-labels`, `date-time-placeholder` (+ тест), `date-time-panel.tsx`, `date-time-picker.module.css`, `date-time-picker.tsx`, `index.ts`: текст отдельно от значения (`dirty`), ввод, принятие и откат, модель выбора раздела 5, подгонка времени, `clearable`, `name`, ограничения, `locale`/`hour12`, `showNow`, `panelTab='move'`.
- [ ] Тесты: критерии а–е, ж спеки (в jsdom без геометрии), dev-предупреждения.
- [ ] `pnpm check`, коммит `feat(date-time-picker): DateTimePicker`.

## Часть 4: playground и приёмка

- [ ] Страница «Дата и время» (`demo-date-time-pickers.tsx`, `date-time-picker-checks.ts`, `date-time-picker-page.tsx`), регистрация в `app.tsx`, автопроверки, Chrome в системной, светлой и тёмной темах, ручные проверки настоящими клавишами (включая Tab по областям панели), итоги в спеку, заметка в память.
- [ ] `pnpm check`, коммит, `scripts/verify-package-form.sh HEAD`, уборка временных каталогов потребителя, остановка временного сервера по PID.

## Самопроверка плана

Критерии а–к спеки закрыты частями 1–4; хелперы раздела 6 целиком в части 2; зависимости только вниз по списку; изменённые существующие файлы перечислены в спеке (раздел 9).
