const PLURAL_RULES = new Intl.PluralRules('ru');

/** «Найдено N записей» с русским склонением: объявляется скринридеру после окончания загрузки. */
export function foundText(count: number): string {
	switch (PLURAL_RULES.select(count)) {
		case 'one':
			return `Найдена ${count} запись`;
		case 'few':
			return `Найдено ${count} записи`;
		default:
			return `Найдено ${count} записей`;
	}
}
