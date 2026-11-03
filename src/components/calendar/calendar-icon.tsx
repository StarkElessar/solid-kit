import type { JSX } from 'solid-js';

import { CALENDAR_ICON_PATHS, type CalendarIconName } from './calendar-icon-paths';

export interface CalendarIconProps {
	name: CalendarIconName;
	class?: string | undefined;
}

export function CalendarIcon(props: CalendarIconProps): JSX.Element {
	return (
		<svg class={props.class} viewBox='0 0 16 16' aria-hidden='true'>
			<path
				d={CALENDAR_ICON_PATHS[props.name]}
				fill='none'
				stroke='currentColor'
				stroke-width='1.6'
				stroke-linecap='round'
				stroke-linejoin='round'
			/>
		</svg>
	);
}
