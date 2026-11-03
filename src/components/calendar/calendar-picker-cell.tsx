import styles from './calendar.module.css';

import type { JSX } from 'solid-js';

export interface CalendarPickerCellProps {
	text: string;
	label: string;
	selected: boolean;
	today: boolean;
	focused: boolean;
	/** Соседний год блока: приглушён. */
	outside?: boolean | undefined;
	disabled: boolean;
	onPick: () => void;
}

/** Ячейка месяца или года: растянута на всю клетку сетки 3 × 4. */
export function CalendarPickerCell(props: CalendarPickerCellProps): JSX.Element {
	return (
		<div role='gridcell' class={styles['picker-cell']} aria-selected={props.selected}>
			<button
				type='button'
				class={styles['day']}
				tabindex={props.focused ? 0 : -1}
				aria-label={props.label}
				aria-disabled={props.disabled ? 'true' : undefined}
				data-focus-target={props.focused ? '' : undefined}
				data-outside={props.outside === true ? '' : undefined}
				data-today={props.today ? '' : undefined}
				data-selected={props.selected ? '' : undefined}
				onClick={() => {
					props.onPick();
				}}
			>
				{props.text}
			</button>
		</div>
	);
}
