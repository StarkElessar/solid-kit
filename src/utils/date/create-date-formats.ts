import type { DateParts } from './date-parts';
import { toUtcTime } from './to-utc-time';

export interface DateFormats {
	/** Полное название месяца (1–12), например «ноябрь». */
	monthLong: (month: number) => string;
	/** Короткое название месяца с заглавной буквы, например «Нояб.». */
	monthShort: (month: number) => string;
	/** Короткое название дня недели (0 воскресенье) с заглавной буквы, например «Пн». */
	weekdayShort: (weekday: number) => string;
	/** Полное название дня недели (0 воскресенье), например «понедельник». */
	weekdayLong: (weekday: number) => string;
	/** Подпись ячейки дня для читалок, например «воскресенье, 1 ноября 2026 г.». */
	cellLabel: (parts: DateParts) => string;
	/** Название периода в шапке режима дней, например «ноябрь 2026». */
	periodLabel: (year: number, month: number) => string;
	yearLabel: (year: number) => string;
}

const cache = new Map<string, DateFormats>();

// 2023-01-01 воскресенье: от него считаются дни недели; год 2000 високосный, поэтому любой месяц существует целиком.
const SUNDAY = { year: 2023, month: 1, day: 1 } as const;

function capitalize(text: string, locale: string): string {
	const first = text.charAt(0);
	return first.toLocaleUpperCase(locale) + text.slice(1);
}

function build(locale: string): DateFormats {
	const make = (options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(locale, { ...options, timeZone: 'UTC' });
	const monthLong = make({ month: 'long' });
	const monthShort = make({ month: 'short' });
	const weekdayShort = make({ weekday: 'short' });
	const weekdayLong = make({ weekday: 'long' });
	const cell = make({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
	const period = make({ month: 'long', year: 'numeric' });
	const year = make({ year: 'numeric' });

	const inMonth = (month: number) => new Date(toUtcTime({ year: 2000, month, day: 1 }));
	const onWeekday = (weekday: number) => new Date(toUtcTime({ ...SUNDAY, day: SUNDAY.day + weekday }));

	return {
		monthLong: (month) => monthLong.format(inMonth(month)),
		monthShort: (month) => capitalize(monthShort.format(inMonth(month)), locale),
		weekdayShort: (weekday) => capitalize(weekdayShort.format(onWeekday(weekday)), locale),
		weekdayLong: (weekday) => weekdayLong.format(onWeekday(weekday)),
		cellLabel: (parts) => cell.format(new Date(toUtcTime(parts))),
		periodLabel: (yearValue, month) => {
			const parts = period.formatToParts(new Date(toUtcTime({ year: yearValue, month, day: 1 })));
			// Хвостовой литерал с пробелом («г.» в русской записи) в названии периода лишний; «月» в японской записи пробела не имеет.
			const last = parts.at(-1);
			if (last?.type === 'literal' && /^\s/.test(last.value)) {
				parts.pop();
			}
			return parts.map((part) => part.value).join('');
		},
		yearLabel: (yearValue) => year.format(new Date(toUtcTime({ year: yearValue, month: 1, day: 1 })))
	};
}

/** Форматтеры `Intl` для календаря (названия месяцев и дней недели, подписи); результат кэшируется по строке локали. */
export function createDateFormats(locale: string): DateFormats {
	let formats = cache.get(locale);
	if (!formats) {
		formats = build(locale);
		cache.set(locale, formats);
	}
	return formats;
}
