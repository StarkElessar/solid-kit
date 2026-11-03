import styles from './date-time-picker.module.css';

import { createComputed, createEffect, createMemo, createSignal, type JSX, on, splitProps } from 'solid-js';

import { PickerField } from '../../internal/picker-field/picker-field';
import { createControllableSignal } from '../../utils/create-controllable-signal';
import type { DateParts } from '../../utils/date/date-parts';
import { formatIsoDate } from '../../utils/date/format-iso-date';
import { isDateAllowed } from '../../utils/date/is-date-allowed';
import { parseIsoDate } from '../../utils/date/parse-iso-date';
import { todayIso } from '../../utils/date/today-iso';
import { compareDateTimes } from '../../utils/date-time/compare-date-times';
import { dateTimeMaskSpec } from '../../utils/date-time/date-time-mask-spec';
import type { DateTimeParts } from '../../utils/date-time/date-time-parts';
import type { DateTimeRules } from '../../utils/date-time/date-time-rules';
import { fitTimeToDate } from '../../utils/date-time/fit-time-to-date';
import { formatDateTimeText } from '../../utils/date-time/format-date-time-text';
import { formatIsoDateTime } from '../../utils/date-time/format-iso-date-time';
import { isDateTimeAllowed } from '../../utils/date-time/is-date-time-allowed';
import { parseDateTimeText } from '../../utils/date-time/parse-date-time-text';
import { readDateTimeProp } from '../../utils/date-time/read-date-time-prop';
import { timeBoundsForDate } from '../../utils/date-time/time-bounds-for-date';
import { createMask } from '../../utils/mask/create-mask';
import { floorToStep } from '../../utils/time/floor-to-step';
import { nowTime } from '../../utils/time/now-time';
import type { TimeParts } from '../../utils/time/time-parts';
import { timePattern } from '../../utils/time/time-pattern';
import { DatePickerIcon } from '../date-picker/date-picker-icon';

import { DateTimePanel } from './date-time-panel';
import type { DateTimePickerProps } from './date-time-picker-props';
import { dateTimePlaceholder } from './date-time-placeholder';
import { DEFAULT_DATE_TIME_PICKER_LABELS } from './default-date-time-picker-labels';

const DEFAULT_LOCALE = 'ru';
const MIDNIGHT: TimeParts = { hour: 0, minute: 0 };

/**
 * Поле даты со временем (спек DateTimePicker): текст по образцу локали, значок календаря и панель с календарём и колонками
 * времени. Клик по полю и клик по значку открывают панель. Каждый выбор в панели применяется сразу; набранный текст
 * принимается по Enter и при уходе из поля, панель показывает набранное сразу.
 */
export function DateTimePicker(props: DateTimePickerProps): JSX.Element {
	const [local, rest] = splitProps(props, [
		'value', 'defaultValue', 'onValueChange', 'open', 'defaultOpen', 'onOpenChange', 'min', 'max', 'isDateDisabled', 'isTimeDisabled',
		'minuteStep', 'locale', 'hour12', 'firstDayOfWeek', 'showNow', 'placeholder', 'labels', 'calendarLabels', 'size', 'class', 'mask'
	]);

	const locale = (): string => local.locale ?? DEFAULT_LOCALE;
	const pattern = createMemo(() => timePattern(locale(), local.hour12));
	const labels = createMemo(() => ({ ...DEFAULT_DATE_TIME_PICKER_LABELS, ...local.labels }));
	const mask = createMemo(() => createMask(local.mask === false ? null : dateTimeMaskSpec(locale(), local.hour12)));
	const step = (): number => local.minuteStep ?? 1;
	const rules = createMemo<DateTimeRules>(() => {
		const min = readDateTimeProp('DateTimePicker', 'min', local.min);
		const max = readDateTimeProp('DateTimePicker', 'max', local.max);
		const own = { isDateDisabled: local.isDateDisabled, isTimeDisabled: local.isTimeDisabled, step: step() };
		if (min && max && compareDateTimes(min, max) > 0) {
			if (import.meta.env.DEV) {
				console.warn(`[solid-kit] DateTimePicker: min "${local.min}" is later than max "${local.max}", both are ignored.`);
			}
			return own;
		}
		return { ...own, min, max };
	});

	const [valueIso, setValueIso] = createControllableSignal<string | null>({
		name: 'DateTimePicker',
		value: () => local.value,
		defaultValue: () => local.defaultValue ?? null,
		onChange: (next) => local.onValueChange?.(next)
	});
	const selected = createMemo(() => readDateTimeProp('DateTimePicker', 'value', valueIso()) ?? null);
	const [open, setOpen] = createControllableSignal<boolean>({
		name: 'DateTimePicker',
		value: () => local.open,
		defaultValue: () => local.defaultOpen ?? false,
		onChange: (next) => local.onOpenChange?.(next)
	});

	const valueText = (): string => {
		const parts = selected();
		return parts ? formatDateTimeText(parts, locale(), local.hour12) : '';
	};
	const [text, setText] = createSignal(valueText());
	// набираемый текст не затирается внешним изменением значения, пока пользователь печатает
	let dirty = false;

	const syncText = (): void => {
		dirty = false;
		setText(valueText());
	};
	createEffect(on([valueIso, locale, () => local.hour12], () => {
		if (!dirty) {
			syncText();
		}
	}, { defer: true }));

	const dateAllowed = (date: DateParts): boolean => {
		return isDateAllowed(date, rules().min?.date, rules().max?.date, rules().isDateDisabled);
	};
	// набранное целиком время обязано быть допустимым; у набранной одной даты время подбирается: прежнее, иначе ближайшее допустимое
	const typedValue = (source: string): DateTimeParts | null => {
		const parsed = parseDateTimeText(source, locale(), local.hour12);
		if (!parsed) {
			return null;
		}
		if (parsed.time) {
			const candidate = { date: parsed.date, time: parsed.time };
			return isDateTimeAllowed(candidate, rules()) ? candidate : null;
		}
		const time = fitTimeToDate(parsed.date, selected()?.time ?? MIDNIGHT, rules());
		return time ? { date: parsed.date, time } : null;
	};
	const typedDate = (source: string): DateParts | null => {
		const parsed = parseDateTimeText(source, locale(), local.hour12);
		return parsed && dateAllowed(parsed.date) ? parsed.date : null;
	};
	// набранное допустимое время панель показывает сразу, значение при этом не меняется
	const highlightedTime = createMemo<TimeParts | null>(() => {
		const parsed = parseDateTimeText(text(), locale(), local.hour12);
		return parsed?.time && isDateTimeAllowed({ date: parsed.date, time: parsed.time }, rules()) ? parsed.time : null;
	});

	const [focused, setFocused] = createSignal(todayIso());
	// фокус календаря при открытии: набранная допустимая дата, иначе выбранная, иначе сегодня (вычисляется до рендера панели)
	createComputed(on(open, (isOpen) => {
		if (isOpen) {
			const date = typedDate(text()) ?? selected()?.date;
			setFocused(date ? formatIsoDate(date) : todayIso());
		}
	}));

	const accept = (next: DateTimeParts | null): void => {
		const iso = next ? formatIsoDateTime(next) : null;
		if (iso !== valueIso()) {
			setValueIso(iso);
		}
		syncText();
	};

	const handleTextChange = (next: string): void => {
		dirty = true;
		setText(next);
		const date = typedDate(next);
		if (date) {
			setFocused(formatIsoDate(date));
		}
	};
	const commit = (source: string): void => {
		if (!dirty) {
			return;
		}
		if (source.trim() === '') {
			accept(null);
			return;
		}
		const parts = typedValue(source);
		if (parts) {
			accept(parts);
		}
		else {
			syncText();
		}
	};

	// дата, к которой относится выбор времени: выбранная, иначе сегодня, а если сегодня запрещено, показанная в календаре
	const baseDate = createMemo<DateParts | null>(() => {
		const chosen = selected()?.date;
		if (chosen) {
			return chosen;
		}
		const today = parseIsoDate(todayIso());
		if (today && dateAllowed(today)) {
			return today;
		}
		const shown = parseIsoDate(focused());
		return shown && dateAllowed(shown) ? shown : null;
	});
	const timeBounds = createMemo(() => {
		const date = baseDate();
		return date ? timeBoundsForDate(date, rules().min, rules().max) : {};
	});

	const boundDate = (bound: DateTimeParts | undefined): string | undefined => (bound ? formatIsoDate(bound.date) : undefined);

	const selectDate = (date: DateParts): void => {
		const time = fitTimeToDate(date, selected()?.time ?? MIDNIGHT, rules());
		if (time) {
			accept({ date, time });
		}
	};
	const selectTime = (time: TimeParts): void => {
		const date = baseDate();
		if (date && isDateTimeAllowed({ date, time }, rules())) {
			accept({ date, time });
		}
	};

	// «Сейчас»: сегодня и текущее время, округлённое вниз по шагу, при необходимости подогнанное под ограничения
	const nowCandidate = (): DateTimeParts | null => {
		const date = parseIsoDate(todayIso());
		if (!date) {
			return null;
		}
		const now = nowTime();
		const time = fitTimeToDate(date, { hour: now.hour, minute: floorToStep(now.minute, step()) }, rules());
		return time ? { date, time } : null;
	};

	return (
		<PickerField
			{...rest}
			class={`${styles['root']}${pattern().hour12 ? ` ${styles['hour12']}` : ''}${local.class ? ` ${local.class}` : ''}`}
			size={local.size}
			text={text()}
			onTextChange={handleTextChange}
			onCommit={commit}
			onRevert={syncText}
			mask={mask()}
			open={open()}
			onOpenChange={setOpen}
			panelTab='move'
			icon={<DatePickerIcon/>}
			openLabel={labels().openPicker}
			panelLabel={labels().panel}
			clearLabel={labels().clear}
			onClear={() => {
				accept(null);
			}}
			hiddenValue={valueIso() ?? ''}
			placeholder={local.placeholder ?? dateTimePlaceholder(locale(), local.hour12, labels())}
		>
			{(panel) => (
				<DateTimePanel
					value={selected()}
					focusedDate={focused()}
					onFocusedDateChange={setFocused}
					onDateSelect={selectDate}
					minDate={boundDate(rules().min)}
					maxDate={boundDate(rules().max)}
					isDateDisabled={local.isDateDisabled}
					locale={locale()}
					firstDayOfWeek={local.firstDayOfWeek}
					calendarLabels={local.calendarLabels}
					highlightedTime={highlightedTime()}
					onTimeSelect={selectTime}
					onFinish={panel.close}
					minTime={timeBounds().min}
					maxTime={timeBounds().max}
					isTimeDisabled={local.isTimeDisabled}
					minuteStep={step()}
					hour12={pattern().hour12}
					periodNames={[pattern().am, pattern().pm]}
					showNow={local.showNow !== false}
					nowAllowed={nowCandidate() !== null}
					onNow={() => {
						const parts = nowCandidate();
						if (parts) {
							accept(parts);
							panel.close();
						}
					}}
					labels={labels()}
					size={local.size}
				/>
			)}
		</PickerField>
	);
}
