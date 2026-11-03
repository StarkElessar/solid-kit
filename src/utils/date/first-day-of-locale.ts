import { firstDayOfRegion } from './first-day-of-region';

interface WeekInfo {
	readonly firstDay: number;
}

interface LocaleWithWeekInfo {
	readonly region?: string | undefined;
	getWeekInfo?: () => WeekInfo;
	readonly weekInfo?: WeekInfo;
	maximize: () => LocaleWithWeekInfo;
}

/** Первый день недели локали (0 воскресенье … 6 суббота): `getWeekInfo`/`weekInfo`, иначе по региону, иначе понедельник. */
export function firstDayOfLocale(locale: string): number {
	try {
		const parsed = new Intl.Locale(locale) as unknown as LocaleWithWeekInfo;
		const info = typeof parsed.getWeekInfo === 'function' ? parsed.getWeekInfo() : parsed.weekInfo;
		if (info) {
			// В WeekInfo воскресенье это 7, а в хелперах 0.
			return info.firstDay % 7;
		}
		return firstDayOfRegion(parsed.maximize().region ?? '');
	}
	catch {
		return 1;
	}
}
