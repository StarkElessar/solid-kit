import { required } from './check-helpers';
import type { CheckResult } from './theme-checks';

function rootOf(page: HTMLElement, name: string): HTMLElement {
	return required(required(page, `[data-height-demo="${name}"]`), '[data-s-kit-focus-inset]');
}

/**
 * Автопроверки высоты грида: фиксированная (токен), `fill` с данными и без, по умолчанию с данными и без. Размеры сравниваются с родителем
 * и друг с другом; вид (центрирование, футер у нижнего края) проверяется в Chrome вручную.
 */
export function runHeightChecks(page: HTMLElement): CheckResult[] {
	const results: CheckResult[] = [];
	const check = (name: string, ok: boolean, detail: string): void => {
		results.push({ name, ok, detail });
	};
	const height = (element: HTMLElement): number => element.getBoundingClientRect().height;

	const rem = Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
	const fixed = height(rootOf(page, 'fixed'));
	check(
		'Высота: токен --s-kit-grid-height задаёт фиксированную высоту',
		Math.abs(fixed - 14 * rem) < 1.5,
		`${fixed.toFixed(1)} px, ожидается ${14 * rem}`
	);

	const fillRoot = rootOf(page, 'fill');
	const fillColumn = required(page, '[data-height-demo="fill"]');
	check(
		'Высота: fill занимает всю высоту родителя, даже когда строк мало',
		Math.abs(height(fillRoot) - height(fillColumn)) < 3,
		`грид ${height(fillRoot).toFixed(1)} px, родитель ${height(fillColumn).toFixed(1)} px`
	);
	const scroller = required(fillRoot, 'table').parentElement as HTMLElement;
	const footer = required(fillRoot, 'tfoot').getBoundingClientRect().bottom;
	const gap = scroller.getBoundingClientRect().bottom - footer;
	check(
		'Высота: при fill футер автосумм у нижнего края грида (зазор только полоса прокрутки)',
		gap >= 0 && gap < 20,
		`зазор ${gap.toFixed(1)} px`
	);

	const emptyRoot = rootOf(page, 'fill-empty');
	const emptyColumn = required(page, '[data-height-demo="fill-empty"]');
	const emptyBlock = required(emptyRoot, 'tbody td > div');
	const emptyScroller = required(emptyRoot, 'table').parentElement as HTMLElement;
	const middle = emptyBlock.getBoundingClientRect().top + emptyBlock.getBoundingClientRect().height / 2;
	const area = emptyScroller.getBoundingClientRect();
	const header = required(emptyRoot, 'thead').getBoundingClientRect();
	const free = (header.bottom + area.bottom) / 2;
	check(
		'Высота: fill без данных занимает всю высоту, пустое состояние по центру свободной области',
		Math.abs(height(emptyRoot) - height(emptyColumn)) < 3 && Math.abs(middle - free) < 30,
		`грид ${height(emptyRoot).toFixed(1)} из ${height(emptyColumn).toFixed(1)} px, смещение центра ${(middle - free).toFixed(1)} px`
	);

	const autoRoot = rootOf(page, 'auto');
	const autoTable = required(autoRoot, 'table');
	check(
		'Высота: по умолчанию грид по содержимому (таблица плюс рамка и полоса прокрутки)',
		height(autoRoot) <= autoTable.getBoundingClientRect().height + 20,
		`грид ${height(autoRoot).toFixed(1)} px, таблица ${autoTable.getBoundingClientRect().height.toFixed(1)} px`
	);

	const collapsed = height(rootOf(page, 'auto-empty'));
	check(
		'Высота: по умолчанию без данных грид схлопывается (ниже 150 px, без min-height пустого блока)',
		collapsed < 150,
		`${collapsed.toFixed(1)} px`
	);
	return results;
}
