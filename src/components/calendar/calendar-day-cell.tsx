import styles from './calendar.module.css';

import type { JSX } from 'solid-js';

import { compareDates } from '../../utils/date/compare-dates';
import type { MonthGridCell } from '../../utils/date/month-grid';

import { useCalendarContext } from './calendar-context';

export interface CalendarDayCellProps {
	cell: MonthGridCell;
}

export function CalendarDayCell(props: CalendarDayCellProps): JSX.Element {
	const calendar = useCalendarContext();
	const isSelected = (): boolean => {
		const selected = calendar.selected();
		return selected !== null && compareDates(selected, props.cell.date) === 0;
	};
	const isFocused = (): boolean => compareDates(calendar.focused(), props.cell.date) === 0;
	const isToday = (): boolean => compareDates(calendar.today(), props.cell.date) === 0;
	const isDisabled = (): boolean => calendar.isDateDisabled(props.cell.date);

	return (
		<div role='gridcell' class={styles['cell']} aria-selected={isSelected()}>
			<button
				type='button'
				class={styles['day']}
				tabindex={isFocused() ? 0 : -1}
				aria-label={calendar.formats().cellLabel(props.cell.date)}
				aria-current={isToday() ? 'date' : undefined}
				aria-disabled={isDisabled() ? 'true' : undefined}
				data-focus-target={isFocused() ? '' : undefined}
				data-outside={props.cell.inMonth ? undefined : ''}
				data-today={isToday() ? '' : undefined}
				data-selected={isSelected() ? '' : undefined}
				onClick={() => {
					calendar.select(props.cell.date);
				}}
			>
				{props.cell.date.day}
			</button>
		</div>
	);
}
