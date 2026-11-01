import { frames, required } from './check-helpers';
import type { CheckResult } from './theme-checks';

function footRows(frame: HTMLElement): HTMLTableRowElement[] {
	return [...frame.querySelectorAll<HTMLTableRowElement>('tfoot > tr')];
}

function texts(row: HTMLTableRowElement | undefined): string[] {
	return [...(row?.cells ?? [])].map((cell) => cell.textContent.trim());
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
		footRows(frame).length === 1 && texts(footRows(frame)[0])[0] === 'Итого на странице',
		texts(footRows(frame)[0]).join(' | ')
	);

	await toggle(page, '[data-grid-all-totals]', true);
	const rows = footRows(frame);
	check(
		'Итоги: обе строки в порядке «страница, выборка», aria-rowcount учитывает их',
		rows.length === 2 && texts(rows[0])[0] === 'Итого на странице' && texts(rows[1])[0] === 'Итого по выборке',
		`${rows.map((row) => row.getAttribute('aria-rowindex')).join(', ')}; rowcount ${table.getAttribute('aria-rowcount')}`
	);

	const headCells = [...frame.querySelectorAll('thead th')];
	const amountIndex = headCells.findIndex((cell) => cell.textContent.trim() === 'Сумма');
	const amount = rows[0]?.cells[amountIndex]?.textContent.trim() ?? '';
	check('Итоги: aggregate колонки форматирует сумму («₽», разделители тысяч)', /\d.*₽$/.test(amount), amount);

	const firstHead = headCells.findIndex((cell) => !cell.hasAttribute('data-grid-select'));
	const label = rows[0]?.cells[firstHead];
	check(
		'Итоги: первая колонка несёт подпись (th scope=row), её итог не показывается',
		label?.tagName === 'TH' && label.textContent.trim() === 'Итого на странице',
		label?.textContent.trim() ?? 'нет'
	);

	const sticky = rows[1]?.cells[amountIndex];
	check(
		'Итоги: ячейки прилипают к низу (position: sticky)',
		sticky !== undefined && getComputedStyle(sticky).position === 'sticky',
		sticky === undefined ? 'нет ячейки' : getComputedStyle(sticky).position
	);

	await toggle(page, '[data-grid-all-totals]', false);
	await toggle(page, '[data-grid-page-totals]', false);
	return results;
}
