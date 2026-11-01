import { frames, required } from './check-helpers';
import type { CheckResult } from './theme-checks';

const SERVER_WAIT_MS = 700;

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => {
		window.setTimeout(resolve, ms);
	});
}

function plain(text: string | null | undefined): string {
	return (text ?? '').replace(/\s/g, ' ');
}

function setSelect(select: HTMLElement, value: string): void {
	(select as HTMLSelectElement).value = value;
	select.dispatchEvent(new Event('change', { bubbles: true }));
}

function setChecked(box: HTMLElement, checked: boolean): void {
	const input = box as HTMLInputElement;
	if (input.checked !== checked) {
		input.click();
	}
}

function navIn(frame: HTMLElement): HTMLElement | null {
	return frame.querySelector<HTMLElement>('nav[aria-label="Постраничная навигация"]');
}

function summaryOf(nav: HTMLElement | null): string {
	return plain(nav?.querySelector('[data-pager-summary]')?.textContent);
}

function buttonOf(nav: HTMLElement, label: string): HTMLButtonElement {
	const found = [...nav.querySelectorAll<HTMLButtonElement>('button')].find((button) => button.getAttribute('aria-label') === label);
	if (!found) {
		throw new Error(`Pager button is missing: ${label}`);
	}
	return found;
}

function firstRowText(frame: HTMLElement): string {
	return frame.querySelector('tbody > tr[data-index]')?.textContent ?? '';
}

function keyDown(target: HTMLElement, key: string): void {
	target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
}

/**
 * Автопроверки пейджера: полоса только с `total`, сводка и ряд номеров на 100 000 строк, листание, смена размера с сохранением первой
 * записи, блокировка при загрузке, фокус на границе. Кольцо фокуса и настоящие Tab проверяются вручную в Chrome.
 */
export async function runPagerChecks(page: HTMLElement): Promise<CheckResult[]> {
	const results: CheckResult[] = [];
	const check = (name: string, ok: boolean, detail: string): void => {
		results.push({ name, ok, detail });
	};

	const frame = required(page, '[data-grid-demo]');
	const paged = required(page, '[data-grid-paged]');
	const delay = required(page, '[data-grid-delay]');
	const count = required(page, '[data-grid-count]');
	const log = required(page, '[data-grid-page-log]');

	setSelect(count, '100000');
	setChecked(paged, false);
	await frames();
	check('Pager: без total полосы нет', navIn(frame) === null, navIn(frame) === null ? 'нет' : 'есть');

	setSelect(delay, '0');
	setChecked(paged, true);
	await sleep(SERVER_WAIT_MS);
	let nav = navIn(frame);
	if (nav === null) {
		check('Pager: с total полоса внутри рамки грида', false, 'полосы нет');
		return results;
	}
	check('Pager: с total полоса внутри рамки грида', true, 'есть');
	check('Pager: сводка «Записей 1–20 из 100 000»', summaryOf(nav) === 'Записей 1–20 из 100 000', summaryOf(nav));

	const numbers = [...nav.querySelectorAll<HTMLElement>('button[aria-label^="Страница"]')].map((button) => button.textContent);
	check('Pager: ряд номеров 1 2 3 4 5 5000 (многоточие не кнопка)', numbers.join(' ') === '1 2 3 4 5 5000', numbers.join(' '));

	buttonOf(nav, 'Вперёд').click();
	await sleep(SERVER_WAIT_MS);
	nav = navIn(frame) ?? nav;
	check(
		'Pager: «Вперёд» грузит страницу 2 (сводка 21–40, первая строка 21)',
		summaryOf(nav) === 'Записей 21–40 из 100 000' && firstRowText(frame).includes('Заказчик 21'),
		`${summaryOf(nav)}; ${firstRowText(frame).slice(0, 40)}`
	);

	buttonOf(nav, 'Страница 3').click();
	await sleep(SERVER_WAIT_MS);
	nav = navIn(frame) ?? nav;
	const sizeTrigger = required(nav, '[role="combobox"]');
	sizeTrigger.focus();
	sizeTrigger.click();
	await frames();
	const fifty = [...document.querySelectorAll<HTMLElement>('[role="option"]')].find((option) => option.textContent === '50');
	fifty?.click();
	await sleep(SERVER_WAIT_MS);
	nav = navIn(frame) ?? nav;
	check(
		'Pager: страница 3 при размере 20 → размер 50 сохраняет первую запись 41 (страница 1, сводка 1–50)',
		fifty !== undefined && summaryOf(nav) === 'Записей 1–50 из 100 000',
		`${summaryOf(nav)}; ${log.textContent}`
	);

	setSelect(delay, '400');
	buttonOf(nav, 'Вперёд').click();
	await frames(2);
	const blocked = [...nav.querySelectorAll<HTMLButtonElement>('button')].every((button) => button.disabled)
		&& frame.querySelector('[aria-busy="true"]') !== null;
	check('Pager: на время загрузки все кнопки отключены, грид aria-busy', blocked, blocked ? 'да' : 'нет');
	await sleep(SERVER_WAIT_MS);
	nav = navIn(frame) ?? nav;
	check('Pager: после загрузки кнопки снова доступны', !buttonOf(nav, 'В начало').disabled, summaryOf(nav));

	setSelect(delay, '0');
	buttonOf(nav, 'В конец').click();
	await sleep(SERVER_WAIT_MS);
	nav = navIn(frame) ?? nav;
	check(
		'Pager: «В конец» открывает последнюю страницу (сводка 99 951–100 000), «Вперёд» отключена',
		summaryOf(nav) === 'Записей 99 951–100 000 из 100 000' && buttonOf(nav, 'Вперёд').disabled,
		summaryOf(nav)
	);

	buttonOf(nav, 'Назад').click();
	await sleep(SERVER_WAIT_MS);
	nav = navIn(frame) ?? nav;
	buttonOf(nav, 'Вперёд').focus();
	buttonOf(nav, 'Вперёд').click();
	await sleep(SERVER_WAIT_MS);
	nav = navIn(frame) ?? nav;
	const active = document.activeElement;
	check(
		'Pager: «Вперёд» на предпоследней странице переносит фокус на текущую страницу',
		buttonOf(nav, 'Вперёд').disabled && active?.getAttribute('aria-current') === 'page',
		active?.getAttribute('aria-label') ?? active?.tagName ?? 'нет'
	);

	keyDown(required(nav, '[role="combobox"]'), 'Escape');
	const standalone = required(page, '[data-pager-standalone]');
	check(
		'Pager: отдельный Pager вне грида работает (сводка «Записей 1–20 из 1 250»)',
		summaryOf(standalone) === 'Записей 1–20 из 1 250',
		summaryOf(standalone)
	);

	setChecked(paged, false);
	setSelect(delay, '400');
	await frames();
	return results;
}
