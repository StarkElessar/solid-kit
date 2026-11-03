import type { MaskField } from '../mask/mask-field';
import type { MaskSpec } from '../mask/mask-spec';

import { type DatePart, datePattern } from './date-pattern';

const FIELDS: Record<DatePart, MaskField> = {
	day: { width: 2, pad: true, maxFirstDigit: 3 },
	month: { width: 2, pad: true, maxFirstDigit: 1 },
	year: { width: 4, pad: false }
};

/** Части даты для маски в порядке локали. */
export function dateMaskFields(locale: string): { fields: MaskField[]; separator: string } {
	const { order, separator } = datePattern(locale);
	return { fields: order.map((part) => FIELDS[part]), separator };
}

/** Описание маски даты по образцу локали: `дд.мм.гггг`, `мм/дд/гггг`, `гггг/мм/дд`. */
export function dateMaskSpec(locale: string): MaskSpec {
	const { fields, separator } = dateMaskFields(locale);
	return { fields, separators: fields.slice(1).map(() => separator), suffixLetters: '' };
}
