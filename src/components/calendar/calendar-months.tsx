import styles from './calendar.module.css';

import { For, type JSX } from 'solid-js';

import { daysInMonth } from '../../utils/date/days-in-month';

import { useCalendarContext } from './calendar-context';
import { CalendarPickerCell } from './calendar-picker-cell';

const MONTH_ROWS = [[1, 2, 3], [4, 5, 6], [7, 8, 9], [10, 11, 12]] as const;

export function CalendarMonths(): JSX.Element {
	const calendar = useCalendarContext();
	const year = (): number => calendar.focused().year;
	const dateOf = (month: number) => ({ year: year(), month, day: Math.min(calendar.focused().day, daysInMonth(year(), month)) });

	return (
		<div role='grid' class={styles['picker']} aria-label={calendar.formats().yearLabel(year())}>
			<For each={MONTH_ROWS}>
				{(row) => (
					<div role='row' class={styles['picker-row']}>
						<For each={row}>
							{(month) => (
								<CalendarPickerCell
									text={calendar.formats().monthShort(month)}
									label={calendar.formats().periodLabel(year(), month)}
									selected={calendar.selected()?.year === year() && calendar.selected()?.month === month}
									today={calendar.today().year === year() && calendar.today().month === month}
									focused={calendar.focused().month === month}
									disabled={calendar.disabled() || !calendar.isInRange('months', dateOf(month))}
									onPick={() => {
										calendar.pick(dateOf(month));
									}}
								/>
							)}
						</For>
					</div>
				)}
			</For>
		</div>
	);
}
