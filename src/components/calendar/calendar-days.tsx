import styles from './calendar.module.css';

import { createMemo, For, type JSX } from 'solid-js';

import { MONTH_GRID_SIZE, monthGrid } from '../../utils/date/month-grid';

import { useCalendarContext } from './calendar-context';
import { CalendarDayCell } from './calendar-day-cell';

const WEEK_LENGTH = 7;
const WEEKS = MONTH_GRID_SIZE / WEEK_LENGTH;

export function CalendarDays(): JSX.Element {
	const calendar = useCalendarContext();
	// месяц как число: сетка пересчитывается только при смене месяца, а не при каждом шаге фокуса по дням
	const monthIndex = createMemo(() => calendar.focused().year * 12 + calendar.focused().month - 1);
	const weeks = createMemo(() => {
		const index = monthIndex();
		const year = Math.floor(index / 12);
		const cells = monthGrid(year, index - year * 12 + 1, calendar.firstDay());
		return Array.from({ length: WEEKS }, (_, week) => cells.slice(week * WEEK_LENGTH, (week + 1) * WEEK_LENGTH));
	});
	const weekdays = createMemo(() => Array.from({ length: WEEK_LENGTH }, (_, offset) => (calendar.firstDay() + offset) % WEEK_LENGTH));
	const title = (): string => {
		const focused = calendar.focused();
		return calendar.formats().periodLabel(focused.year, focused.month);
	};

	return (
		<div role='grid' class={styles['days']} aria-label={title()}>
			<div role='row' class={styles['row']}>
				<For each={weekdays()}>
					{(weekday) => (
						<div role='columnheader' class={styles['weekday']} aria-label={calendar.formats().weekdayLong(weekday)}>
							{calendar.formats().weekdayShort(weekday)}
						</div>
					)}
				</For>
			</div>
			<For each={weeks()}>
				{(week) => (
					<div role='row' class={styles['row']}>
						<For each={week}>{(cell) => <CalendarDayCell cell={cell}/>}</For>
					</div>
				)}
			</For>
		</div>
	);
}
