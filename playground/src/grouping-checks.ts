import { closeWithEscape, frames, required } from './check-helpers';
import type { CheckResult } from './theme-checks';

const SETTLE_MS = 900;

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => {
		window.setTimeout(resolve, ms);
	});
}

function kinds(frame: HTMLElement, kind: string): HTMLTableRowElement[] {
	return [...frame.querySelectorAll<HTMLTableRowElement>(`tbody > tr[data-kind="${kind}"]`)];
}

function button(frame: HTMLElement, name: string): HTMLButtonElement {
	const buttons = [...frame.querySelectorAll<HTMLButtonElement>('button')];
	const found = buttons.find((candidate) => candidate.getAttribute('aria-label') === name);
	if (found === undefined) {
		throw new Error(`Playground button is missing: ${name}`);
	}
	return found;
}

async function toggle(page: HTMLElement, selector: string, on: boolean): Promise<void> {
	const box = required(page, selector) as HTMLInputElement;
	if (box.checked !== on) {
		box.click();
		await frames();
	}
}

/**
 * Автопроверки группировки: режим, порядок элементов, свёрнутость и уровни, агрегаты, пункт меню колонки, ленивые группы, границы окна
 * DOM. Перетаскивание мышью, кольца фокуса и темы проверяются вручную в Chrome. Переключатели в конце возвращаются.
 */
export async function runGroupingChecks(page: HTMLElement): Promise<CheckResult[]> {
	const results: CheckResult[] = [];
	const check = (name: string, ok: boolean, detail: string): void => {
		results.push({ name, ok, detail });
	};
	const frame = required(page, '[data-grid-demo]');

	await toggle(page, '[data-grid-lazy]', false);
	await toggle(page, '[data-grid-grouping]', false);
	await toggle(page, '[data-grid-grouping]', true);
	await sleep(SETTLE_MS);
	const panel = required(frame, '[data-grouping-panel]');
	const chips = [...panel.querySelectorAll('[data-chip]')].map((chip) => chip.textContent.trim());
	check(
		'Группировка: панель с чипом «Команда», все группы верхнего уровня свёрнуты',
		chips.join() === 'Команда' && kinds(frame, 'group').length === 4 && kinds(frame, 'row').length === 0,
		`чипы: ${chips.join()}; заголовков ${kinds(frame, 'group').length}`
	);

	const collapsedText = kinds(frame, 'group')[0]?.textContent ?? '';
	check(
		'Группировка: свёрнутая группа показывает агрегат «Сумма» (₽) и счётчик в заголовке',
		collapsedText.includes('₽') && collapsedText.includes('· 25'),
		collapsedText.slice(0, 80)
	);

	button(frame, 'Развернуть уровень').click();
	await frames();
	const first = kinds(frame, 'group')[0]?.querySelector('button[aria-expanded]');
	// подвал первой группы лежит за 25 000 строк и в окно не попадает: подвалы проверяют юнит-тесты
	check(
		'Группировка: «Развернуть уровень» раскрывает группы: строки данных, aria-expanded',
		first?.getAttribute('aria-expanded') === 'true' && kinds(frame, 'row').length > 0,
		`строк ${kinds(frame, 'row').length}`
	);
	check(
		'Группировка: DOM содержит не больше окна плюс overscan при 100 000 строках в группах',
		frame.querySelectorAll('tbody > tr[data-index]').length <= 60,
		String(frame.querySelectorAll('tbody > tr[data-index]').length)
	);

	button(frame, 'Свернуть все').click();
	await frames();
	check('Группировка: «Свернуть все» оставляет только заголовки', kinds(frame, 'row').length === 0, String(kinds(frame, 'group').length));

	required(frame, '[data-grid-column-menu="status"]').click();
	await frames();
	const menuItems = [...document.querySelectorAll<HTMLElement>('[role="menuitem"]')];
	const item = menuItems.find((candidate) => candidate.textContent.trim() === 'Сгруппировать');
	item?.click();
	await sleep(SETTLE_MS);
	const nested = [...required(frame, '[data-grouping-panel]').querySelectorAll('[data-chip]')].map((chip) => chip.textContent.trim());
	check(
		'Группировка: пункт меню колонки «Сгруппировать» добавляет второй чип',
		item !== undefined && nested.join() === 'Команда,Статус',
		nested.join()
	);

	button(frame, 'Развернуть все').click();
	await frames();
	// внутри первой команды раскрыта первая вложенная группа: её заголовок смещён на уровень
	const indentOf = (row: HTMLElement): string => {
		return row.querySelector<HTMLElement>('td[title]')?.style.getPropertyValue('--s-kit-grid-indent') ?? '';
	};
	const indents = kinds(frame, 'group').map(indentOf);
	check(
		'Группировка: «Развернуть все» показывает вложенные группы второго уровня с отступом',
		indents.includes('0px') && indents.includes('16px') && kinds(frame, 'row').length > 0,
		indents.join(', ')
	);
	closeWithEscape();

	await toggle(page, '[data-grid-lazy]', true);
	await sleep(SETTLE_MS);
	button(frame, 'Свернуть все').click();
	await frames();
	const removeButtons = [...frame.querySelectorAll<HTMLButtonElement>('[data-chip] button[aria-label^="Убрать"]')];
	removeButtons.find((candidate) => candidate.getAttribute('aria-label')?.includes('Статус'))?.click();
	await sleep(SETTLE_MS);
	button(frame, 'Развернуть уровень').click();
	await frames();
	const hasLoading = kinds(frame, 'loading').length > 0;
	await sleep(SETTLE_MS);
	check(
		'Группировка: ленивая группа сначала показывает «Загрузка…», затем строки',
		hasLoading && kinds(frame, 'loading').length === 0 && kinds(frame, 'row').length > 0,
		`заглушек сразу ${hasLoading ? 'есть' : 'нет'}, строк ${kinds(frame, 'row').length}`
	);

	await toggle(page, '[data-grid-lazy]', false);
	await toggle(page, '[data-grid-grouping]', false);
	return results;
}
