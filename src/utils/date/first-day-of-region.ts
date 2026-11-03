const SUNDAY_REGIONS = new Set([
	'AG', 'AS', 'BD', 'BR', 'BS', 'BT', 'BW', 'BZ', 'CA', 'CO', 'DM', 'DO', 'ET', 'GT', 'GU', 'HK', 'HN', 'ID', 'IL', 'IN', 'JM', 'JP',
	'KE', 'KH', 'KR', 'LA', 'MH', 'MM', 'MO', 'MT', 'MX', 'MZ', 'NI', 'NP', 'PA', 'PE', 'PH', 'PK', 'PR', 'PT', 'PY', 'SA', 'SG', 'SV',
	'TH', 'TT', 'TW', 'UM', 'US', 'VE', 'VI', 'WS', 'YE', 'ZA', 'ZW'
]);

const SATURDAY_REGIONS = new Set(['AE', 'AF', 'BH', 'DJ', 'DZ', 'EG', 'IQ', 'IR', 'JO', 'KW', 'LY', 'OM', 'QA', 'SD', 'SY']);

/** Первый день недели региона по данным CLDR (0 воскресенье, 1 понедельник, 6 суббота); нужен, когда у браузера нет `getWeekInfo`. */
export function firstDayOfRegion(region: string): number {
	const code = region.toUpperCase();
	if (SUNDAY_REGIONS.has(code)) {
		return 0;
	}
	return SATURDAY_REGIONS.has(code) ? 6 : 1;
}
