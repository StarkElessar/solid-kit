import styles from './calendar.module.css';

import { createMemo, For, type JSX } from 'solid-js';

import { addYears } from '../../utils/date/add-years';
import type { YearBlockCell } from '../../utils/date/year-block';
import { yearBlock } from '../../utils/date/year-block';

import { useCalendarContext } from './calendar-context';
import { CalendarPickerCell } from './calendar-picker-cell';

const COLUMNS = 3;

export function CalendarYears(): JSX.Element {
	const calendar = useCalendarContext();
	const block = createMemo(() => yearBlock(calendar.focused().year));
	const rows = createMemo(() => {
		const cells = block().cells;
		return Array.from({ length: cells.length / COLUMNS }, (_, row) => cells.slice(row * COLUMNS, (row + 1) * COLUMNS));
	});
	const dateOf = (cell: YearBlockCell) => addYears(calendar.focused(), cell.year - calendar.focused().year);

	return (
		<div role='grid' class={styles['picker']} aria-label={block().label}>
			<For each={rows()}>
				{(row) => (
					<div role='row' class={styles['picker-row']}>
						<For each={row}>
							{(cell) => (
								<CalendarPickerCell
									text={calendar.formats().yearLabel(cell.year)}
									label={calendar.formats().yearLabel(cell.year)}
									selected={calendar.selected()?.year === cell.year}
									today={calendar.today().year === cell.year}
									focused={calendar.focused().year === cell.year}
									outside={!cell.inBlock}
									disabled={calendar.disabled() || !calendar.isInRange('years', dateOf(cell))}
									onPick={() => {
										calendar.pick(dateOf(cell));
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
