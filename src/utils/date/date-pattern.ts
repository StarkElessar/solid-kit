export type DatePart = 'day' | 'month' | 'year';

export interface DatePattern {
	/** Порядок частей в записи даты локали. */
	readonly order: readonly [DatePart, DatePart, DatePart];
	/** Разделитель частей без пробелов по краям (`.`, `/`, `-`). */
	readonly separator: string;
}

const FALLBACK: DatePattern = { order: ['day', 'month', 'year'], separator: '.' };
const SAMPLE = new Date(Date.UTC(2026, 10, 3));
const cache = new Map<string, DatePattern>();

function build(locale: string): DatePattern {
	try {
		const parts = new Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' })
			.formatToParts(SAMPLE);
		const order = parts.flatMap((part) => (part.type === 'day' || part.type === 'month' || part.type === 'year' ? [part.type] : []));
		const separator = parts.find((part) => part.type === 'literal')?.value.trim();
		const [first, second, third] = order;
		if (first === undefined || second === undefined || third === undefined || new Set(order).size !== 3 || !separator) {
			return FALLBACK;
		}
		return { order: [first, second, third], separator };
	}
	catch {
		return FALLBACK;
	}
}

/** Порядок частей и разделитель числовой записи даты локали (по `Intl`, без привязки к конкретным локалям); результат кэшируется. */
export function datePattern(locale: string): DatePattern {
	let pattern = cache.get(locale);
	if (!pattern) {
		pattern = build(locale);
		cache.set(locale, pattern);
	}
	return pattern;
}
