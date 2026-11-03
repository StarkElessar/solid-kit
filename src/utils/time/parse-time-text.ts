import type { TimeParts } from './time-parts';
import { type TimePattern, timePattern } from './time-pattern';

type Period = 'am' | 'pm';

const DIGITS_ONLY = /^\d+$/;
const SEPARATED = /^(\d{1,2})[\s.,:;-]+(\d{2})$/;
const HOURS_ONLY = /^(\d{1,2})[\s.,:;-]+$/;
const LATIN_PERIODS: ReadonlyArray<readonly [string, Period]> = [['a.m.', 'am'], ['p.m.', 'pm'], ['am', 'am'], ['pm', 'pm']];

function periodCandidates(pattern: TimePattern): Array<readonly [string, Period]> {
	const own: Array<readonly [string, Period]> = [[pattern.am.toLowerCase(), 'am'], [pattern.pm.toLowerCase(), 'pm']];
	// длинные названия раньше коротких, чтобы `a.m.` не съедался как `a`
	return [...own, ...LATIN_PERIODS].sort((a, b) => b[0].length - a[0].length);
}

/** Отделяет период (AM или PM) от остального текста; период может стоять перед временем или после него. */
function splitPeriod(text: string, pattern: TimePattern): { rest: string; period: Period | null } {
	const lower = text.toLowerCase();
	for (const [label, period] of periodCandidates(pattern)) {
		if (label === '') {
			continue;
		}
		const index = lower.indexOf(label);
		if (index !== -1) {
			const rest = `${lower.slice(0, index)} ${lower.slice(index + label.length)}`.trim();
			return { rest, period };
		}
	}
	return { rest: text, period: null };
}

function tokensOf(text: string): { hour: number; minute: number } | null {
	if (DIGITS_ONLY.test(text)) {
		if (text.length > 4) {
			return null;
		}
		const hourWidth = text.length <= 2 ? text.length : text.length - 2;
		const minute = text.length <= 2 ? 0 : Number(text.slice(hourWidth));
		return { hour: Number(text.slice(0, hourWidth)), minute };
	}
	const hoursOnly = HOURS_ONLY.exec(text);
	if (hoursOnly) {
		return { hour: Number(hoursOnly[1]), minute: 0 };
	}
	const match = SEPARATED.exec(text);
	return match ? { hour: Number(match[1]), minute: Number(match[2]) } : null;
}

function resolveHour(hour: number, period: Period | null, hour12: boolean): number | null {
	if (!hour12) {
		return hour <= 23 ? hour : null;
	}
	if (period) {
		return hour >= 1 && hour <= 12 ? (hour % 12) + (period === 'pm' ? 12 : 0) : null;
	}
	return hour <= 23 ? hour : null;
}

/**
 * Разбор набранного времени. Часы 1–2 цифры, минуты ровно 2 цифры при разделителе; цифры подряд читаются справа налево
 * (`9` это 09:00, `930` это 09:30, `1430` это 14:30); часы с завершающим разделителем (`9:`) тоже читаются как 09:00.
 * В 12-часовом виде допускается суффикс AM или PM (любой регистр, с точками и без, плюс названия периода локали): без него
 * `2:30` это `02:30`, `12` это полдень, `0` и `13`–`23` читаются как 24-часовые; в 24-часовом виде суффикс не принимается.
 * Недопустимое время и пустая строка дают `null`.
 */
export function parseTimeText(text: string, locale: string, hour12?: boolean): TimeParts | null {
	const trimmed = text.trim();
	if (trimmed === '') {
		return null;
	}
	const pattern = timePattern(locale, hour12);
	const { rest, period } = splitPeriod(trimmed, pattern);
	if (period && !pattern.hour12) {
		return null;
	}
	const tokens = tokensOf(rest.trim());
	if (!tokens || tokens.minute > 59) {
		return null;
	}
	const hour = resolveHour(tokens.hour, period, pattern.hour12);
	return hour === null ? null : { hour, minute: tokens.minute };
}
