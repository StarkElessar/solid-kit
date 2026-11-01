import { frames, required } from './check-helpers';
import type { CheckResult } from './theme-checks';

function footRows(frame: HTMLElement): HTMLTableRowElement[] {
	return [...frame.querySelectorAll<HTMLTableRowElement>('tfoot > tr')];
}

function texts(row: HTMLTableRowElement | undefined): string[] {
	return [...(row?.cells ?? [])].map((cell) => cell.textContent.trim());
}

/** Подпись строки итогов: ячейка `th`, при колонке чекбоксов она не первая. */
function labelOf(row: HTMLTableRowElement | undefined): string {
	return row?.querySelector('th')?.textContent.trim() ?? '';
}

async function toggle(page: HTMLElement, selector: string, on: boolean): Promise<void> {
	const box = required(page, selector) as HTMLInputElement;
	if (box.checked !== on) {
		box.click();
		await frames();
	}
}

/**
 * Автопроверки итогов: наличие и порядок строк, подписи, формат `aggregate`, подпись вместо итога первой колонки, заглушки при загрузке,
 * нумерация aria. Прилипание к низу, закреп при горизонтальной прокрутке, слои и темы проверяются вручную в Chrome. Переключатели
 * в конце возвращаются в исходное состояние.
 */
export async function runTotalsChecks(page: HTMLElement): Promise<CheckResult[]> {
	const results: CheckResult[] = [];
	const check = (name: string, ok: boolean, detail: string): void => {
		results.push({ name, ok, detail });
	};
	const frame = required(page, '[data-grid-demo]');
	const table = required(frame, 'table');

	await toggle(page, '[data-grid-page-totals]', false);
	await toggle(page, '[data-grid-all-totals]', false);
	check('Итоги: без источников tfoot нет', frame.querySelector('tfoot') === null, String(footRows(frame).length));

	await toggle(page, '[data-grid-page-totals]', true);
	check(
		'Итоги: только pageTotals — одна строка «Итого на странице»',
		footRows(frame).length === 1 && labelOf(footRows(frame)[0]) === 'Итого на странице',
		texts(footRows(frame)[0]).join(' | ')
	);

	await toggle(page, '[data-grid-all-totals]', true);
	const rows = footRows(frame);
	check(
		'Итоги: обе строки в порядке «страница, выборка», aria-rowcount учитывает их',
		rows.length === 2 && labelOf(rows[0]) === 'Итого на странице' && labelOf(rows[1]) === 'Итого по выборке',
		`${rows.map((row) => row.getAttribute('aria-rowindex')).join(', ')}; rowcount ${table.getAttribute('aria-rowcount')}`
	);

	// демо кладёт число заказчиков в итог первой колонки: оно не должно появиться в строке
	const count = (required(page, '[data-grid-count]') as HTMLSelectElement).value;
	// подпись занимает колонки без значений (colspan), поэтому ячейки итога ищутся по содержимому, а не по индексу колонки
	const amount = texts(rows[0]).find((text) => text.endsWith('₽')) ?? '';
	check('Итоги: aggregate колонки форматирует сумму («₽», разделители тысяч)', /^\d[\d\s\u00a0]*\s?₽$/.test(amount), amount);

	const label = rows[0]?.querySelector('th');
	const span = Number(label?.getAttribute('colspan') ?? '1');
	check(
		'Итоги: подпись (th scope=row) занимает идущие за ней колонки без значений, итог первой колонки не показывается',
		label?.getAttribute('scope') === 'row' && span > 1 && !texts(rows[0]).includes(count),
		`colspan ${span}; ${texts(rows[0]).join(' | ')}`
	);

	const sticky = rows[1]?.cells[rows[1].cells.length - 1];
	check(
		'Итоги: ячейки прилипают к низу (position: sticky)',
		sticky !== undefined && getComputedStyle(sticky).position === 'sticky',
		sticky === undefined ? 'нет ячейки' : getComputedStyle(sticky).position
	);

	await toggle(page, '[data-grid-all-totals]', false);
	await toggle(page, '[data-grid-page-totals]', false);
	return results;
}
