import { contrastRatio, type Rgb } from '../../src/utils/color-math';

import { type CheckResult, resolveColor, type Rgba } from './theme-checks';

function rgb([red, green, blue]: Rgba): Rgb {
	return [red, green, blue];
}

/** Первый цвет в вычисленном `box-shadow` (браузер пишет его в любой из своих нотаций). */
const COLOR_IN_SHADOW = /(?:rgba?|color|oklch|oklab|lab|lch|hsla?)\([^)]*\)/;

/**
 * У каждой полосы с data-tabs-demo: роль, одна выбранная вкладка и одна видимая панель, связи вкладок и панелей по id,
 * контраст текста выбранной и невыбранной вкладок (4.5:1) и индикатора (3:1) к поверхности. У полосы `scroll` дополнительно:
 * содержимое шире полосы, прокрутка включена и вкладки занимают всю высоту полосы (полоса прокрутки место не занимает).
 */
export function runTabsChecks(page: HTMLElement): CheckResult[] {
	const results: CheckResult[] = [];
	const check = (name: string, ok: boolean, detail: string): void => {
		results.push({ name, ok, detail });
	};
	const surface = resolveColor(getComputedStyle(page).backgroundColor);
	const ratio = (color: string): number => contrastRatio(rgb(resolveColor(color)), rgb(surface));

	for (const list of page.querySelectorAll<HTMLElement>('[data-tabs-demo]')) {
		const id = list.dataset['tabsDemo'] ?? '?';
		const tabs = [...list.querySelectorAll<HTMLElement>('[role="tab"]')];
		const selected = tabs.filter((item) => item.getAttribute('aria-selected') === 'true');
		const plain = tabs.find((item) => item.getAttribute('aria-selected') === 'false' && !item.hasAttribute('disabled'));
		const firstSelected = selected[0];
		const root = list.parentElement;
		if (!firstSelected || !plain || !root) {
			throw new Error(`Playground element is missing in Tabs ${id}`);
		}

		check(`Tabs ${id}: роль tablist`, list.getAttribute('role') === 'tablist', `role = ${list.getAttribute('role') ?? 'null'}`);
		check(`Tabs ${id}: выбрана одна вкладка`, selected.length === 1, `выбрано ${selected.length} из ${tabs.length}`);
		const visiblePanels = root.querySelectorAll('[role="tabpanel"]:not([hidden])').length;
		check(`Tabs ${id}: видна одна панель`, visiblePanels === 1, `видимых панелей ${visiblePanels}`);
		check(
			`Tabs ${id}: вкладки и панели связаны по id`,
			tabs.every((item) => {
				const panel = document.getElementById(item.getAttribute('aria-controls') ?? '');
				return panel?.getAttribute('aria-labelledby') === item.id;
			}),
			`вкладок ${tabs.length}`
		);

		const selectedText = ratio(getComputedStyle(firstSelected).color);
		check(`Tabs ${id}: текст выбранной вкладки читаем (4.5:1)`, selectedText >= 4.5, `контраст ${selectedText.toFixed(2)}:1`);
		const plainText = ratio(getComputedStyle(plain).color);
		check(`Tabs ${id}: текст невыбранной вкладки читаем (4.5:1)`, plainText >= 4.5, `контраст ${plainText.toFixed(2)}:1`);

		const shadow = getComputedStyle(firstSelected).boxShadow;
		const indicator = COLOR_IN_SHADOW.exec(shadow)?.[0];
		const indicatorRatio = indicator === undefined ? 0 : ratio(indicator);
		check(
			`Tabs ${id}: индикатор выбранной вкладки отличим от фона (3:1)`,
			indicatorRatio >= 3,
			`контраст ${indicatorRatio.toFixed(2)}:1, box-shadow = ${shadow}`
		);
		const plainShadow = getComputedStyle(plain).boxShadow;
		check(`Tabs ${id}: у невыбранной вкладки индикатора нет`, plainShadow === 'none', `box-shadow = ${plainShadow}`);

		if (id === 'scroll') {
			check(
				`Tabs ${id}: содержимое шире полосы`,
				list.scrollWidth > list.clientWidth,
				`scrollWidth ${list.scrollWidth}px, clientWidth ${list.clientWidth}px`
			);
			const overflowX = getComputedStyle(list).overflowX;
			check(`Tabs ${id}: прокрутка по горизонтали включена`, overflowX === 'auto', `overflow-x = ${overflowX}`);
			check(
				`Tabs ${id}: вкладки занимают всю высоту полосы`,
				tabs.every((item) => item.offsetHeight === list.clientHeight),
				`высота полосы ${list.clientHeight}px, вкладки ${[...new Set(tabs.map((item) => item.offsetHeight))].join(', ')}px`
			);
		}
	}
	return results;
}
