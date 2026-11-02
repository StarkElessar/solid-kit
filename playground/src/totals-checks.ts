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

	// мало строк в высоком гриде: футер стоит у нижнего края скроллера, а не под последней строкой
	const count = required(page, '[data-grid-count]') as HTMLSelectElement;
	const scroller = table.parentElement as HTMLElement;
	count.value = '10';
	count.dispatchEvent(new Event('change', { bubbles: true }));
	frame.style.blockSize = '1400px';
	frame.style.setProperty('--s-kit-grid-max-height', 'none');
	await frames();
	await frames();
	const gap = scroller.getBoundingClientRect().bottom - (frame.querySelector('tfoot')?.getBoundingClientRect().bottom ?? 0);
	const bodyRows = frame.querySelectorAll('tbody > tr[data-index]');
	const rowHeights = [...bodyRows].map((row) => row.getBoundingClientRect().height);
	check(
		'Автосуммы: при малом числе строк футер прижат к нижнему краю грида, строки не растянуты',
		bodyRows.length === 10 && Math.abs(gap) < 20 && Math.max(...rowHeights) < 100,
		`зазор ${gap.toFixed(1)} px, строк ${bodyRows.length}, высота строки до ${Math.max(...rowHeights).toFixed(0)} px`
	);
	frame.style.blockSize = '';
	frame.style.removeProperty('--s-kit-grid-max-height');
	count.value = '100000';
	count.dispatchEvent(new Event('change', { bubbles: true }));
	await frames();

	await toggle(page, '[data-grid-totals]', false);
	return results;
}
