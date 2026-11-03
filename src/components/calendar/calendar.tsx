import styles from './calendar.module.css';

import { createMemo, createSignal, type JSX, Match, onMount, Show, Switch } from 'solid-js';

import { createControllableSignal } from '../../utils/create-controllable-signal';
import { clampDate } from '../../utils/date/clamp-date';
import { compareDates } from '../../utils/date/compare-dates';
import { createDateFormats } from '../../utils/date/create-date-formats';
import { MAX_DATE, MIN_DATE } from '../../utils/date/date-limits';
import type { DateParts } from '../../utils/date/date-parts';
import { firstDayOfLocale } from '../../utils/date/first-day-of-locale';
import { formatIsoDate } from '../../utils/date/format-iso-date';
import { parseIsoDate } from '../../utils/date/parse-iso-date';
import { todayIso } from '../../utils/date/today-iso';

import { CalendarContext, type CalendarContextValue } from './calendar-context';
import { CalendarDays } from './calendar-days';
import { CalendarFooter } from './calendar-footer';
import { CalendarHeader } from './calendar-header';
import { CalendarMonths } from './calendar-months';
import type { CalendarProps } from './calendar-props';
import type { CalendarView } from './calendar-view';
import { CalendarYears } from './calendar-years';
import { DEFAULT_CALENDAR_LABELS } from './default-calendar-labels';
import { handleCalendarKeyDown } from './handle-calendar-key-down';
import { isPeriodReachable } from './is-period-reachable';
import { periodOverlapsLimits } from './period-overlaps-limits';
import { readDateProp } from './read-date-prop';
import { shiftFocused } from './shift-focused';
import { unitPeriod } from './unit-period';

const DEFAULT_LOCALE = 'ru';

/**
 * Календарь выбора одной даты (спек этапа 5, часть 1). Значения это ISO-строки `YYYY-MM-DD`, внутри `DateParts`.
 * Показанный месяц это месяц `focusedDate`; в режиме дней всегда 6 недель, чтобы высота не менялась.
 */
export function Calendar(props: CalendarProps): JSX.Element {
	let root: HTMLDivElement | undefined;

	const locale = (): string => props.locale ?? DEFAULT_LOCALE;
	const formats = createMemo(() => createDateFormats(locale()));
	const labels = createMemo(() => ({ ...DEFAULT_CALENDAR_LABELS, ...props.labels }));
	const firstDay = createMemo(() => props.firstDayOfWeek ?? firstDayOfLocale(locale()));
	const today = createMemo(() => readDateProp('today', props.today) ?? parseIsoDate(todayIso()) ?? MIN_DATE);
	const min = createMemo(() => readDateProp('min', props.min));
	const max = createMemo(() => readDateProp('max', props.max));
	const [view, setView] = createSignal<CalendarView>(props.defaultView ?? 'days');

	const [valueIso, setValueIso] = createControllableSignal<string | null>({
		name: 'Calendar',
		value: () => props.value,
		defaultValue: () => props.defaultValue ?? null,
		onChange: (next) => props.onValueChange?.(next)
	});
	const selected = createMemo(() => readDateProp('value', valueIso()) ?? null);

	const [focusedIso, setFocusedIso] = createControllableSignal<string>({
		name: 'Calendar',
		value: () => props.focusedDate,
		defaultValue: () => {
			const initial = readDateProp('defaultFocusedDate', props.defaultFocusedDate) ?? selected() ?? today();
			return formatIsoDate(clampDate(initial, min(), max()));
		},
		onChange: (next) => props.onFocusedDateChange?.(next)
	});
	const focused = createMemo(() => clampDate(readDateProp('focusedDate', focusedIso()) ?? today(), min(), max()));

	const isDisabled = (): boolean => props.disabled === true;
	const isDateDisabled = (date: DateParts): boolean => {
		const lower = min();
		const upper = max();
		if (isDisabled() || compareDates(date, MIN_DATE) < 0 || compareDates(date, MAX_DATE) > 0) {
			return true;
		}
		if ((lower && compareDates(date, lower) < 0) || (upper && compareDates(date, upper) > 0)) {
			return true;
		}
		return props.isDateDisabled?.(formatIsoDate(date)) === true;
	};

	// DOM сфокусированной ячейки пересоздаётся при смене месяца: фокус возвращается после обновления
	const focusCell = (): void => {
		queueMicrotask(() => {
			root?.querySelector<HTMLElement>('[data-focus-target]')?.focus();
		});
	};
	const focusDate = (date: DateParts): void => {
		const next = clampDate(date, min(), max());
		if (compareDates(next, focused()) !== 0) {
			setFocusedIso(formatIsoDate(next));
		}
	};

	const isInRange = (unitView: CalendarView, date: DateParts): boolean => {
		const { from, to } = unitPeriod(unitView, date);
		return periodOverlapsLimits(from, to, min(), max());
	};
	const isUnitDisabled = (unitView: CalendarView, date: DateParts): boolean => {
		return unitView === 'days' ? isDateDisabled(date) : isDisabled() || !isInRange(unitView, date);
	};

	const context: CalendarContextValue = {
		formats,
		labels,
		view,
		focused,
		selected,
		today,
		firstDay,
		disabled: isDisabled,
		showToday: () => props.showToday !== false,
		isDateDisabled,
		isInRange,
		canDrill: () => view() !== 'years',
		drill: () => {
			setView(view() === 'days' ? 'months' : 'years');
			focusCell();
		},
		back: () => {
			setView(view() === 'years' ? 'months' : 'days');
			focusCell();
		},
		pick: (date) => {
			const unitView = view();
			if (unitView === 'days' || isUnitDisabled(unitView, date)) {
				return;
			}
			focusDate(date);
			setView(unitView === 'months' ? 'days' : 'months');
			focusCell();
		},
		canShift: (direction) => !isDisabled() && isPeriodReachable(view(), focused(), direction, min(), max()),
		shift: (direction) => {
			focusDate(shiftFocused(view(), focused(), direction));
		},
		select: (date) => {
			if (isDateDisabled(date)) {
				return;
			}
			setValueIso(formatIsoDate(date));
			focusDate(date);
			focusCell();
		},
		goToToday: () => {
			setView('days');
			focusDate(today());
			focusCell();
		}
	};

	const handleKeyDown = (event: KeyboardEvent): void => {
		if (isDisabled()) {
			return;
		}
		handleCalendarKeyDown(event, {
			view,
			focused,
			firstDay,
			isDisabled: isUnitDisabled,
			isInRange,
			focusDate,
			back: context.back,
			focusCell
		});
	};

	onMount(() => {
		if (props.autoFocus === true) {
			focusCell();
		}
	});

	return (
		<CalendarContext.Provider value={context}>
			<div
				ref={root}
				data-s-kit
				data-s-kit-size={props.size}
				data-s-kit-focus-inset
				role='group'
				aria-label={labels().calendar}
				class={props.class ? `${styles['root']} ${props.class}` : styles['root']}
				style={props.style}
				onKeyDown={handleKeyDown}
			>
				<CalendarHeader/>
				<Switch>
					<Match when={view() === 'days'}><CalendarDays/></Match>
					<Match when={view() === 'months'}><CalendarMonths/></Match>
					<Match when={view() === 'years'}><CalendarYears/></Match>
				</Switch>
				<Show when={context.showToday()}>
					<CalendarFooter/>
				</Show>
			</div>
		</CalendarContext.Provider>
	);
}
