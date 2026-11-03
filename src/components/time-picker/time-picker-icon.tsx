import type { JSX } from 'solid-js';

/** Значок часов в поле: штрих `currentColor`, ширина 1.6, скруглённые концы (как у значка календаря). */
export function TimePickerIcon(): JSX.Element {
	return (
		<svg viewBox='0 0 16 16' aria-hidden='true'>
			<path
				d='M8 4.5V8l2.5 1.5M8 14a6 6 0 1 0 0-12 6 6 0 0 0 0 12z'
				fill='none'
				stroke='currentColor'
				stroke-width='1.6'
				stroke-linecap='round'
				stroke-linejoin='round'
			/>
		</svg>
	);
}
