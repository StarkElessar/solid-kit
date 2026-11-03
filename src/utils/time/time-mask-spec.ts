import type { MaskField } from '../mask/mask-field';
import type { MaskSpec } from '../mask/mask-spec';

import { type TimePattern, timePattern } from './time-pattern';

const LATIN_PERIODS = ['am', 'pm', 'a.m.', 'p.m.'];

/** Буквы суффикса периода: латиница плюс названия периода локали, без точек и пробелов. */
export function suffixLettersOf(pattern: TimePattern): string {
	const letters = [pattern.am, pattern.pm, ...LATIN_PERIODS].join('').toLowerCase().replaceAll(/[\s.]/g, '');
	return [...new Set(letters)].join('');
}

/** Части времени для маски: часы и минуты; в 12-часовом виде часы без ведущего нуля. */
export function timeMaskFields(pattern: TimePattern): { fields: MaskField[]; separator: string } {
	const hour: MaskField = pattern.hour12
		? { width: 2, pad: false, maxFirstDigit: 1 }
		: { width: 2, pad: true, maxFirstDigit: 2 };
	return { fields: [hour, { width: 2, pad: false }], separator: pattern.separator };
}

/** Описание маски времени по образцу локали; `null` для 12-часового вида с периодом перед временем (ввод свободный). */
export function timeMaskSpec(locale: string, hour12?: boolean): MaskSpec | null {
	const pattern = timePattern(locale, hour12);
	if (pattern.hour12 && pattern.periodFirst) {
		return null;
	}
	const { fields, separator } = timeMaskFields(pattern);
	return { fields, separators: [separator], suffixLetters: pattern.hour12 ? suffixLettersOf(pattern) : '' };
}
