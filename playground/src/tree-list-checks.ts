import { frames, required } from './check-helpers';
import { TREE_ROOTS } from './demo-tree-data';
import type { CheckResult } from './theme-checks';

const LAZY_DELAY_MS = 400;
/** Порог «развернуть все» на 5 000 узлах: от клика до следующего кадра. */
const EXPAND_ALL_BUDGET_MS = 400;
/** Окно рендера: видимые строки и overscan; на 20 000 узлах в DOM их заведомо меньше. */
const MAX_DOM_ROWS = 80;

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => {
		window.setTimeout(resolve, ms);
	});
}

function bodyRows(frame: HTMLElement): HTMLTableRowElement[] {
	return [...frame.querySelectorAll<HTMLTableRowElement>('tbody > tr[data-index]')];
}

function itemCount(frame: HTMLElement): number {
	return Number(required(frame, 'table').getAttribute('aria-rowcount')) - 1;
}

function button(frame: HTMLElement, name: string): HTMLButtonElement {
	const found = [...frame.querySelectorAll<HTMLButtonElement>('button')].find((item) => item.getAttribute('aria-label') === name);
	if (found === undefined) {
		throw new Error(`Playground button is missing: ${name}`);
	}
	return found;
}

async function click(element: HTMLElement): Promise<void> {
	element.click();
	await frames();
}

async function setSize(page: HTMLElement, size: string): Promise<void> {
	const select = required(page, '[data-tree-size]') as HTMLSelectElement;
	select.value = size;
	select.dispatchEvent(new Event('change', { bubbles: true }));
	await frames(6);
}

async function toggle(page: HTMLElement, selector: string, on: boolean): Promise<void> {
	const box = required(page, selector) as HTMLInputElement;
	if (box.checked !== on) {
		await click(box);
	}
}

function expander(row: HTMLElement): HTMLButtonElement {
	return required(row, 'button[aria-expanded]') as HTMLButtonElement;
}

/**
 * Автопроверки TreeList: структура и aria, кнопки уровней, окно DOM на 20 000 узлах, время «развернуть все», отступ, закрепление,
 * общие части грида в дереве (ресайз, меню колонки, выбор, пейджер, загрузка, пустое состояние), ленивая подгрузка. Скролл настоящим
 * колесом, кольца фокуса, тёмная тема и сверка с макетом проверяются вручную в Chrome. Переключатели в конце возвращаются.
 */
export async function runTreeListChecks(page: HTMLElement): Promise<CheckResult[]> {
	const results: CheckResult[] = [];
	const check = (name: string, ok: boolean, detail: string): void => {
		results.push({ name, ok, detail });
	};
	const frame = required(page, '[data-tree-demo]');
	const table = required(frame, 'table');

	// время «развернуть все» на 5 000 узлах
	await setSize(page, '5000');
	await click(button(frame, 'Свернуть все'));
	check('сворачивание всего оставляет корни', itemCount(frame) === TREE_ROOTS, `строк ${itemCount(frame)}`);
	const started = performance.now();
	button(frame, 'Развернуть все').click();
	await frames(1);
	const elapsed = Math.round(performance.now() - started);
	check('«развернуть все» на 5 000 узлах в бюджете', elapsed <= EXPAND_ALL_BUDGET_MS, `${elapsed} мс из ${EXPAND_ALL_BUDGET_MS}`);
	check('все 5 000 узлов видны', itemCount(frame) === 5000, `строк ${itemCount(frame)}`);

	// окно DOM на 20 000 узлах
	await setSize(page, '20000');
	await click(button(frame, 'Развернуть все'));
	const domRows = bodyRows(frame).length;
	check('20 000 узлов: в DOM только окно рендера', itemCount(frame) === 20000 && domRows > 0 && domRows <= MAX_DOM_ROWS,
		`в списке ${itemCount(frame)}, в DOM ${domRows}`);

	// структура и кнопки уровней
	await click(button(frame, 'Свернуть все'));
	check('таблица это treegrid', table.getAttribute('role') === 'treegrid', String(table.getAttribute('role')));
	check('свёрнуто: только корни', itemCount(frame) === TREE_ROOTS, `строк ${itemCount(frame)}`);
	await click(button(frame, 'Развернуть уровень'));
	const oneLevel = itemCount(frame);
	await click(button(frame, 'Развернуть уровень'));
	const twoLevels = itemCount(frame);
	check('«развернуть уровень» раскрывает по уровню', oneLevel === TREE_ROOTS + 6 * TREE_ROOTS && twoLevels > oneLevel,
		`корни+дети ${oneLevel}, затем ${twoLevels}`);
	await click(button(frame, 'Свернуть уровень'));
	check('«свернуть уровень» возвращает прежний', itemCount(frame) === oneLevel, `строк ${itemCount(frame)}`);
	await click(button(frame, 'Свернуть все'));

	// шеврон, aria и отступ
	const first = bodyRows(frame)[0];
	if (first === undefined) {
		throw new Error('Playground tree has no rows');
	}
	const collapsed = first.getAttribute('aria-expanded');
	check('у свёрнутого узла aria-expanded=false', collapsed === 'false', `${collapsed}`);
	await click(expander(first));
	const [parent, child] = bodyRows(frame);
	check('клик по шеврону раскрывает узел', itemCount(frame) === TREE_ROOTS + 6 && parent?.getAttribute('aria-expanded') === 'true',
		`строк ${itemCount(frame)}`);
	check('aria-level и aria-posinset детей', child?.getAttribute('aria-level') === '2' && child.getAttribute('aria-posinset') === '1'
		&& child.getAttribute('aria-setsize') === '6', `${child?.getAttribute('aria-level')}/${child?.getAttribute('aria-posinset')}`);
	const parentLeft = parent?.querySelector('td > span')?.getBoundingClientRect().left ?? 0;
	const childLeft = child?.querySelector('td > span')?.getBoundingClientRect().left ?? 0;
	check('отступ ребёнка 16 px', Math.abs(childLeft - parentLeft - 16) <= 1, `${(childLeft - parentLeft).toFixed(1)} px`);

	// закреплённая колонка
	const scroller = required(frame, '[class*="scroller"]');
	const stickyLast = (): HTMLElement => required(frame, 'tbody td[data-sticky-last]');
	const before = stickyLast().getBoundingClientRect().left;
	scroller.scrollLeft = 200;
	await frames();
	const after = stickyLast().getBoundingClientRect().left;
	check('закреплённая колонка не двигается при прокрутке', Math.abs(after - before) <= 1 && scroller.scrollLeft > 0,
		`сдвиг ${(after - before).toFixed(1)} px при scrollLeft ${scroller.scrollLeft}`);
	const shadow = getComputedStyle(stickyLast()).boxShadow;
	check('под закреплённой колонкой нет тени', shadow === 'none', shadow);
	scroller.scrollLeft = 0;

	// общие части грида в дереве
	check('ресайз и меню колонки на месте', frame.querySelectorAll('[data-grid-resize]').length > 0
		&& frame.querySelectorAll('[data-grid-column-menu]').length > 0, 'ручки и кнопки меню есть');
	const summary = frame.querySelector('[data-pager-summary]')?.textContent ?? '';
	check('пейджер показывает сводку', summary.includes('Записей'), summary.trim());
	const refreshed = required(page, '[data-tree-refresh]');
	await click(button(frame, 'Обновить'));
	check('«Обновить» вызывает колбэк', refreshed.textContent === '1', refreshed.textContent);
	const bar = required(frame, '[class*="toolbar"]');
	const barParent = bar.parentElement;
	const gap = (barParent?.getBoundingClientRect().right ?? 0) - bar.getBoundingClientRect().right;
	check('кнопки уровней справа, панели группировки нет', frame.querySelectorAll('[class*="toolbar"] button').length === 4
		&& frame.querySelector('[data-grouping-panel]') === null && Math.abs(gap - 8) <= 1, `отступ справа ${gap.toFixed(1)} px`);

	// выбор строки
	const row = bodyRows(frame)[1];
	await click(row?.querySelectorAll('td')[1] as HTMLElement);
	check('клик по строке выбирает её', bodyRows(frame)[1]?.getAttribute('aria-selected') === 'true', 'строка выбрана');
	await click(bodyRows(frame)[1]?.querySelectorAll('td')[1] as HTMLElement);
	const stillSelected = bodyRows(frame).filter((item) => item.getAttribute('aria-selected') === 'true').length;
	check('повторный клик снимает выбор', stillSelected === 0, `выбрано ${stillSelected}`);

	// загрузка и пустое состояние
	await toggle(page, '[data-tree-loading]', true);
	const levelDisabled = button(frame, 'Развернуть все').disabled;
	check('при загрузке тело заменено заглушками, кнопки уровней отключены', frame.querySelector('[role="progressbar"]') !== null
		&& levelDisabled && bodyRows(frame).length === 0, `кнопка отключена: ${levelDisabled}`);
	await toggle(page, '[data-tree-loading]', false);
	await toggle(page, '[data-tree-empty]', true);
	check('пустое дерево показывает «Ничего не найдено»', frame.textContent.includes('Ничего не найдено'), 'текст на месте');
	await toggle(page, '[data-tree-empty]', false);
	await setSize(page, '1000');

	// ленивая подгрузка
	const lazy = required(page, '[data-tree-lazy-demo]');
	const calls = required(page, '[data-tree-lazy-calls]');
	await click(expander(bodyRows(lazy)[0] as HTMLElement));
	check('ленивый режим: «Загрузка…» и один запрос', lazy.textContent.includes('Загрузка…') && calls.textContent === '1',
		`запросов ${calls.textContent}`);
	await sleep(LAZY_DELAY_MS + 300);
	await frames();
	const settled = !lazy.textContent.includes('Загрузка…') && itemCount(lazy) === TREE_ROOTS + 6;
	check('после ответа показаны дети', settled, `строк ${itemCount(lazy)}`);
	await click(expander(bodyRows(lazy)[0] as HTMLElement));
	await click(expander(bodyRows(lazy)[0] as HTMLElement));
	check('повторное раскрытие не просит дети снова', calls.textContent === '1', `запросов ${calls.textContent}`);

	return results;
}
