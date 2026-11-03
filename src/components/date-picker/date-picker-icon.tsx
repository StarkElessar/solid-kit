import type { JSX } from 'solid-js';

/** Значок календаря в поле: штрих `currentColor`, ширина 1.6, скруглённые концы (как у значков шапки Calendar). */
export function DatePickerIcon(): JSX.Element {
	return (
		<svg viewBox='0 0 16 16' aria-hidden='true'>
			<path
				d='M4 2.5v2M12 2.5v2M2.5 6.5h11M4.5 3.5h7a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-7a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2z'
				fill='none'
				stroke='currentColor'
				stroke-width='1.6'
				stroke-linecap='round'
				stroke-linejoin='round'
			/>
		</svg>
	);
}
