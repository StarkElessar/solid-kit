import type { JSX } from 'solid-js';

export type PaletteName = 'blue' | 'mono';

export const PALETTE_NAMES: readonly PaletteName[] = ['blue', 'mono'];

/**
 * Переопределения базовых токенов для палитр-примеров. Синий равен `tokens.css` (рабочая палитра),
 * Моно проверяет худший случай: primary почти равен цвету текста (раздел 4.1 спека).
 */
export const PALETTES: Record<PaletteName, JSX.CSSProperties> = {
	blue: {},
	mono: {
		'--s-kit-color-primary': 'light-dark(#1d1d1f, #f5f5f7)',
		'--s-kit-color-primary-contrast': 'light-dark(#fff, #1d1d1f)'
	}
};
