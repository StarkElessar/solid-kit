import styles from './calendar.module.css';

import type { JSX } from 'solid-js';

import { IconButton } from '../icon-button';

import { useCalendarContext } from './calendar-context';
import { CalendarIcon } from './calendar-icon';

export function CalendarHeader(): JSX.Element {
	const calendar = useCalendarContext();
	const title = (): string => {
		const focused = calendar.focused();
		return calendar.formats().periodLabel(focused.year, focused.month);
	};

	return (
		<div class={styles['header']}>
			<IconButton
				variant='plain'
				aria-label={calendar.labels().previous(calendar.view())}
				disabled={!calendar.canShift(-1)}
				onClick={() => {
					calendar.shift(-1);
				}}
			>
				<CalendarIcon name='previous' class={styles['icon']}/>
			</IconButton>
			<div class={styles['title']} aria-live='polite'>{title()}</div>
			<IconButton
				variant='plain'
				aria-label={calendar.labels().next(calendar.view())}
				disabled={!calendar.canShift(1)}
				onClick={() => {
					calendar.shift(1);
				}}
			>
				<CalendarIcon name='next' class={styles['icon']}/>
			</IconButton>
		</div>
	);
}
