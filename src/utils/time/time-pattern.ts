export interface TimePattern {
	/** Двенадцатичасовой вид с периодом AM и PM. */
	readonly hour12: boolean;
	/** Разделитель часов и минут без пробелов по краям. */
	readonly separator: string;
	/** Период пишется перед временем (`午前9:05`), иначе после (`9:05 AM`). */
	readonly periodFirst: boolean;
	/** Что стоит между периодом и временем: пробел или пусто. */
	readonly periodGap: string;
	readonly am: string;
	readonly pm: string;
}

const FALLBACK_24: TimePattern = { hour12: false, separator: ':', periodFirst: false, periodGap: ' ', am: 'AM', pm: 'PM' };
const MORNING = new Date(Date.UTC(2026, 10, 3, 9, 5));
const EVENING = new Date(Date.UTC(2026, 10, 3, 21, 5));
const cache = new Map<string, TimePattern>();

function normalizeSpaces(text: string): string {
	return text.replaceAll(/\s/g, ' ');
}

function formatterOf(locale: string, hour12: boolean): Intl.DateTimeFormat {
	return new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit', hour12, timeZone: 'UTC' });
}

function build(locale: string, hour12: boolean | undefined): TimePattern {
	try {
		const preferred = hour12 ?? new Intl.DateTimeFormat(locale, { hour: 'numeric' }).resolvedOptions().hour12 === true;
		const morning = formatterOf(locale, preferred).formatToParts(MORNING);
		const hourAt = morning.findIndex((part) => part.type === 'hour');
		const minuteAt = morning.findIndex((part) => part.type === 'minute');
		const separator = morning.slice(hourAt + 1, minuteAt).map((part) => part.value).join('').trim();
		if (!preferred) {
			return { ...FALLBACK_24, separator: separator || ':' };
		}
		const evening = formatterOf(locale, true).formatToParts(EVENING);
		const am = morning.find((part) => part.type === 'dayPeriod')?.value;
		const pm = evening.find((part) => part.type === 'dayPeriod')?.value;
		const periodIndex = morning.findIndex((part) => part.type === 'dayPeriod');
		const periodFirst = periodIndex !== -1 && periodIndex < hourAt;
		const gapPart = periodFirst ? morning[periodIndex + 1] : morning[periodIndex - 1];
		const periodGap = gapPart?.type === 'literal' ? normalizeSpaces(gapPart.value) : '';
		return {
			hour12: true,
			separator: separator || ':',
			periodFirst,
			periodGap,
			am: am ?? 'AM',
			pm: pm ?? 'PM'
		};
	}
	catch {
		return hour12 === true ? { ...FALLBACK_24, hour12: true } : FALLBACK_24;
	}
}

/**
 * Образец текста времени локали по `Intl`: цикл часов, разделитель, место и названия периода. `hour12` перекрывает цикл
 * локали. Результат кэшируется по паре локаль и `hour12`.
 */
export function timePattern(locale: string, hour12?: boolean): TimePattern {
	const key = `${locale}|${String(hour12)}`;
	let pattern = cache.get(key);
	if (!pattern) {
		pattern = build(locale, hour12);
		cache.set(key, pattern);
	}
	return pattern;
}
