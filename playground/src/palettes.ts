import type { JSX } from 'solid-js';

export type PaletteName = 'mint' | 'blue' | 'mono';

export const PALETTE_NAMES: readonly PaletteName[] = ['mint', 'blue', 'mono'];

/**
 * Переопределения базовых токенов для палитр-примеров. Мята равна `tokens.css` (рабочая палитра), Синий проверяет
 * другой оттенок, Моно проверяет худший случай: primary почти равен цвету текста, поэтому он задаёт hover и active сам
 * (раздел 4.1 спека).
 */
export const PALETTES: Record<PaletteName, JSX.CSSProperties> = {
	mint: {},
	blue: {
		'--s-kit-color-primary': 'light-dark(#0071e3, #4da3ff)',
		'--s-kit-color-primary-contrast': 'light-dark(#fff, #04162e)'
	},
	mono: {
		'--s-kit-color-primary': 'light-dark(#1d1d1f, #f5f5f7)',
		'--s-kit-color-primary-contrast': 'light-dark(#fff, #1d1d1f)',
		'--s-kit-color-primary-hover': 'color-mix(in oklch, var(--s-kit-color-primary), var(--s-kit-color-primary-contrast) 14%)',
		'--s-kit-color-primary-active': 'color-mix(in oklch, var(--s-kit-color-primary), var(--s-kit-color-primary-contrast) 26%)'
	}
};
