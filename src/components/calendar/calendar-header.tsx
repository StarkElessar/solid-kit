import styles from './calendar.module.css';

import { type JSX, Show } from 'solid-js';

import { yearBlock } from '../../utils/date/year-block';
import { Button } from '../button';
import { IconButton } from '../icon-button';

import { useCalendarContext } from './calendar-context';
import { CalendarIcon } from './calendar-icon';

export function CalendarHeader(): JSX.Element {
	const calendar = useCalendarContext();
	const title = (): string => {
		const focused = calendar.focused();
		const view = calendar.view();
		if (view === 'days') {
			return calendar.formats().periodLabel(focused.year, focused.month);
		}
		return view === 'months' ? calendar.formats().yearLabel(focused.year) : yearBlock(focused.year).label;
	};
	const drillLabel = (): string => (calendar.view() === 'days' ? calendar.labels().chooseMonth : calendar.labels().chooseYear);

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
			<div class={styles['title']} aria-live='polite'>
				<Show when={calendar.canDrill()} fallback={title()}>
					<Button
						variant='plain'
						class={styles['title-button']}
						aria-label={drillLabel()}
						onClick={() => {
							calendar.drill();
						}}
					>
						{title()}
					</Button>
				</Show>
			</div>
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
