import { dateMaskFields } from '../date/date-mask-spec';
import type { MaskSpec } from '../mask/mask-spec';
import { suffixLettersOf, timeMaskFields } from '../time/time-mask-spec';
import { timePattern } from '../time/time-pattern';

/** Описание маски даты со временем: дата по образцу локали, пробел, время; `null` для 12-часового вида с периодом перед временем. */
export function dateTimeMaskSpec(locale: string, hour12?: boolean): MaskSpec | null {
	const pattern = timePattern(locale, hour12);
	if (pattern.hour12 && pattern.periodFirst) {
		return null;
	}
	const date = dateMaskFields(locale);
	const time = timeMaskFields(pattern);
	return {
		fields: [...date.fields, ...time.fields],
		separators: [...date.fields.slice(1).map(() => date.separator), ' ', time.separator],
		suffixLetters: pattern.hour12 ? suffixLettersOf(pattern) : ''
	};
}
