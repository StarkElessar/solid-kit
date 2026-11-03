import styles from './calendar.module.css';

import type { JSX } from 'solid-js';

import { Button } from '../button';

import { useCalendarContext } from './calendar-context';

export function CalendarFooter(): JSX.Element {
	const calendar = useCalendarContext();

	return (
		<div class={styles['footer']}>
			<Button
				variant='tinted'
				disabled={calendar.isDateDisabled(calendar.today())}
				onClick={() => {
					calendar.goToToday();
				}}
			>
				{calendar.labels().today}
			</Button>
		</div>
	);
}
