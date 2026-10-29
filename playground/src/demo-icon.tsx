import type { JSX } from 'solid-js';

/** Плюс для демо IconButton: размер задаёт CSS кнопки, цвет берётся у текста. */
export function DemoIcon(): JSX.Element {
	return (
		<svg viewBox='0 0 16 16' fill='none' stroke='currentColor' stroke-width='1.5' stroke-linecap='round' aria-hidden='true'>
			<path d='M8 3v10M3 8h10'/>
		</svg>
	);
}
