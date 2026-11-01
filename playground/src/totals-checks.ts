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
 * Автопроверки автосумм: один футер без подписей, формат `aggregate`, значение в ячейке своей колонки, нумерация aria, sticky. Прилипание
 * при прокрутке, закреплённые колонки и темы проверяются вручную в Chrome. Переключатель в конце возвращается.
 */
export async function runTotalsChecks(page: HTMLElement): Promise<CheckResult[]> {
	const results: CheckResult[] = [];
	const check = (name: string, ok: boolean, detail: string): void => {
		results.push({ name, ok, detail });
	};
	const frame = required(page, '[data-grid-demo]');
	const table = required(frame, 'table');

	await toggle(page, '[data-grid-totals]', false);
	check('Автосуммы: без totals tfoot нет', frame.querySelector('tfoot') === null, String(footRows(frame).length));

	await toggle(page, '[data-grid-totals]', true);
	const rows = footRows(frame);
	check(
		'Автосуммы: один футер из одной строки, aria-rowcount и aria-rowindex продолжают нумерацию',
		rows.length === 1 && Number(table.getAttribute('aria-rowcount')) === Number(rows[0]?.getAttribute('aria-rowindex')),
		`rowindex ${rows[0]?.getAttribute('aria-rowindex')}; rowcount ${table.getAttribute('aria-rowcount')}`
	);

	const cells = texts(rows[0]);
	const amount = cells.find((text) => text.endsWith('₽')) ?? '';
	check('Автосуммы: aggregate колонки форматирует сумму («₽», разделители тысяч)', /^\d[\d\s]*₽$/.test(amount), amount);
	check(
		'Автосуммы: подписей в ячейках нет, значения стоят только в своих колонках',
		!(rows[0]?.textContent ?? '').includes('Итого') && rows[0]?.querySelector('th') === null && cells.filter(Boolean).length === 2,
		cells.join(' | ')
	);

	const sticky = rows[0]?.cells[rows[0].cells.length - 1];
	check(
		'Автосуммы: ячейки прилипают к низу (position: sticky)',
		sticky !== undefined && getComputedStyle(sticky).position === 'sticky',
		sticky === undefined ? 'нет ячейки' : getComputedStyle(sticky).position
	);

	await toggle(page, '[data-grid-totals]', false);
	return results;
}
