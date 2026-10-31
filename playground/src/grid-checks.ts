import { frames, required } from './check-helpers';
import type { CheckResult } from './theme-checks';

const OVERSCAN = 12;

function pointer(type: string, clientX: number): MouseEvent {
	const event = new MouseEvent(type, { bubbles: true, clientX, button: 0, cancelable: true });
	Object.defineProperty(event, 'pointerId', { value: 1 });
	return event;
}

function headers(table: HTMLElement): HTMLElement[] {
	return [...table.querySelectorAll<HTMLElement>('thead th')];
}

function bodyRows(table: HTMLElement): HTMLTableRowElement[] {
	return [...table.querySelectorAll<HTMLTableRowElement>('tbody > tr[data-index]')];
}

function handleOf(table: HTMLElement, title: string): HTMLElement {
	const header = headers(table).find((th) => th.textContent === title);
	return required(header ?? table, '[data-grid-resize]');
}

function widthOf(element: HTMLElement): number {
	return element.getBoundingClientRect().width;
}

function leftVar(table: HTMLElement, index: number): number {
	return parseFloat(table.style.getPropertyValue(`--s-kit-grid-left-${index}`));
}

/**
 * Автоматические проверки Grid: размер окна рендера, сумма ширин колонок, закреплённые колонки, ресайз без перерисовки тела,
 * сброс ширины, прокрутка к далёкой строке. Настоящая прокрутка колёсиком, ресайз мышью и замеры на production-сборке проверяются
 * вручную в Chrome. Демо должно быть в состоянии «100 000 строк, виртуализация включена» (так его ставит страница).
 */
export async function runGridChecks(page: HTMLElement): Promise<CheckResult[]> {
	const results: CheckResult[] = [];
	const check = (name: string, ok: boolean, detail: string): void => {
		results.push({ name, ok, detail });
	};

	const frame = required(page, '[data-grid-demo]');
	const table = required(frame, 'table');
	const scroller = table.parentElement as HTMLElement;
	scroller.scrollTop = 0;
	scroller.scrollLeft = 0;
	await frames();

	const rows = bodyRows(table);
	const heights = rows.map((row) => row.getBoundingClientRect().height);
	const minHeight = Math.min(...heights);
	const allowed = Math.ceil(scroller.clientHeight / minHeight) + 2 * OVERSCAN + 2;
	check(
		'Grid: на 100 000 строк в DOM не больше окна плюс overscan',
		rows.length > 0 && rows.length <= allowed,
		`строк в DOM ${rows.length}, допустимо ${allowed}`
	);

	const columnCount = table.querySelectorAll('colgroup > col').length;
	const headerCells = headers(table);
	check(
		'Grid: число col, th и ячеек строки совпадает, aria-rowcount = строки + 1',
		headerCells.length === columnCount && rows.every((row) => row.cells.length === columnCount)
			&& table.getAttribute('aria-rowcount') === '100001',
		`col ${columnCount}, th ${headerCells.length}, aria-rowcount ${table.getAttribute('aria-rowcount') ?? '—'}`
	);

	const tableWidth = table.getBoundingClientRect().width;
	const sum = headerCells.reduce((total, th) => total + widthOf(th), 0);
	check(
		'Grid: таблица шире контейнера, сумма ширин колонок равна ширине таблицы',
		tableWidth > scroller.clientWidth && Math.abs(sum - tableWidth) <= 1,
		`сумма ${sum.toFixed(1)}, таблица ${tableWidth.toFixed(1)}, контейнер ${scroller.clientWidth}`
	);

	frame.style.inlineSize = '3000px';
	await frames();
	const wideHeaders = headers(table);
	const last = wideHeaders[wideHeaders.length - 1] as HTMLElement;
	const others = wideHeaders.slice(0, -1).reduce((total, th) => total + widthOf(th), 0);
	const expectedLast = scroller.clientWidth - others;
	check(
		'Grid: когда таблица уже контейнера, последняя колонка занимает остаток',
		Math.abs(widthOf(last) - expectedLast) <= 1 && expectedLast > 110,
		`последняя ${widthOf(last).toFixed(1)}, остаток ${expectedLast.toFixed(1)}`
	);
	frame.style.inlineSize = '';
	await frames();

	const firstRow = bodyRows(table)[0] as HTMLTableRowElement;
	const aligned = headers(table).every((th, index) => {
		const cell = firstRow.cells[index] as HTMLElement;
		return Math.abs(th.getBoundingClientRect().left - cell.getBoundingClientRect().left) <= 0.5
			&& Math.abs(widthOf(th) - widthOf(cell)) <= 0.5;
	});
	check('Grid: заголовки и ячейки строки совпадают по позиции и ширине', aligned, `колонок ${headers(table).length}`);

	scroller.scrollLeft = 400;
	await frames();
	const scrollerBox = scroller.getBoundingClientRect();
	const stickyCells = [...(bodyRows(table)[0] as HTMLTableRowElement).cells].filter((cell) => cell.hasAttribute('data-sticky'));
	const stickyHeaders = headers(table).filter((th) => th.hasAttribute('data-sticky'));
	const selectShift = stickyCells[0]?.hasAttribute('data-grid-select') === true ? 1 : 0;
	const lockedCount = 2;
	const offsets = stickyCells.map((cell, index) => {
		const expected = index < selectShift ? 0 : leftVar(table, index - selectShift);
		return cell.getBoundingClientRect().left - scrollerBox.left - scroller.clientLeft - expected;
	});
	check(
		'Grid: при прокрутке вправо закреплённые ячейки (и колонка чекбоксов) стоят у левого края со своим смещением',
		stickyCells.length === lockedCount + selectShift && offsets.every((offset) => Math.abs(offset) <= 0.5),
		`закреплённых ${stickyCells.length}, отклонения ${offsets.map((offset) => offset.toFixed(2)).join(', ')} px`
	);
	const gaps = (cells: readonly HTMLElement[]): number[] => cells.slice(1).map(
		(cell, index) => cell.getBoundingClientRect().left - (cells[index] as HTMLElement).getBoundingClientRect().right
	);
	const bodyGaps = gaps(stickyCells);
	const headerGaps = gaps(stickyHeaders);
	check(
		'Grid: между соседними закреплёнными ячейками нет зазора и наложения',
		bodyGaps.length > 0 && [...bodyGaps, ...headerGaps].every((gap) => Math.abs(gap) <= 0.5),
		`тело ${bodyGaps.map((gap) => gap.toFixed(2)).join(', ')} px, шапка ${headerGaps.map((gap) => gap.toFixed(2)).join(', ')} px`
	);
	scroller.scrollLeft = 0;
	await frames();

	const body = required(table, 'tbody');
	const observer = new MutationObserver(() => undefined);
	observer.observe(body, { subtree: true, childList: true, attributes: true, characterData: true });
	const rowsBefore = bodyRows(table);
	const textsBefore = rowsBefore.map((row) => row.textContent);
	const handle = handleOf(table, 'Город');
	const cityIndex = headers(table).findIndex((th) => th.textContent === 'Город');
	const widthBefore = widthOf(headers(table)[cityIndex] as HTMLElement);
	const colBefore = widthOf(table.querySelectorAll<HTMLElement>('colgroup > col')[cityIndex] as HTMLElement);
	const startX = handle.getBoundingClientRect().left;
	handle.dispatchEvent(pointer('pointerdown', startX));
	for (let step = 1; step <= 10; step++) {
		handle.dispatchEvent(pointer('pointermove', startX + step * 8));
	}
	await frames();
	const widthMid = widthOf(headers(table)[cityIndex] as HTMLElement);
	const colMid = widthOf(table.querySelectorAll<HTMLElement>('colgroup > col')[cityIndex] as HTMLElement);
	handle.dispatchEvent(pointer('pointerup', startX + 80));
	await frames();
	const records = observer.takeRecords().length;
	observer.disconnect();
	const rowsAfter = bodyRows(table);
	check(
		'Grid: ресайз меняет ширину col и th, а тело таблицы остаётся нетронутым',
		Math.abs(widthMid - (widthBefore + 80)) <= 1 && Math.abs(colMid - (colBefore + 80)) <= 1 && records === 0
			&& rowsAfter.length === rowsBefore.length
			&& rowsAfter.every((row, index) => row === rowsBefore[index] && row.textContent === textsBefore[index]),
		`th ${widthBefore.toFixed(0)}→${widthMid.toFixed(0)}, col ${colBefore.toFixed(0)}→${colMid.toFixed(0)}, мутаций тела ${records}`
	);
	const logged = required(page, '[data-grid-widths]').textContent;
	check('Grid: onColumnWidthsChange вызван по окончании ресайза', logged.includes('"city"'), logged);

	handle.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
	await frames();
	const widthReset = widthOf(headers(table)[cityIndex] as HTMLElement);
	check(
		'Grid: двойной клик по ручке возвращает исходную ширину',
		Math.abs(widthReset - widthBefore) <= 1 && !required(page, '[data-grid-widths]').textContent.includes('"city"'),
		`ширина ${widthReset.toFixed(0)}, было ${widthBefore.toFixed(0)}`
	);

	scroller.scrollTop = 0;
	await frames();
	const selectedCount = (): number => Number(required(page, '[data-grid-selected-count]').textContent);
	const firstBodyRow = (): HTMLTableRowElement => bodyRows(table)[0] as HTMLTableRowElement;
	const rowBox = (): HTMLInputElement => required(firstBodyRow(), 'input[type="checkbox"]') as HTMLInputElement;
	const headBox = (): HTMLInputElement => required(table, 'thead input[type="checkbox"]') as HTMLInputElement;
	const textCell = (): HTMLElement => firstBodyRow().cells[firstBodyRow().cells.length - 3] as HTMLElement;

	textCell().click();
	await frames();
	const afterFirstClick = firstBodyRow().getAttribute('aria-selected') === 'true' && selectedCount() === 1;
	textCell().click();
	await frames();
	check(
		'Grid: клик по ячейке выбирает строку (aria-selected), второй клик снимает',
		afterFirstClick && !firstBodyRow().hasAttribute('aria-selected') && selectedCount() === 0,
		`после первого клика ${afterFirstClick ? 'выбрана' : 'не выбрана'}, выбрано сейчас ${selectedCount()}`
	);

	rowBox().click();
	await frames();
	const boxSelected = firstBodyRow().getAttribute('aria-selected') === 'true' && selectedCount() === 1;
	rowBox().click();
	await frames();
	check(
		'Grid: клик по чекбоксу строки переключает выбор ровно один раз',
		boxSelected && selectedCount() === 0,
		`после клика выбрано ${boxSelected ? 1 : 'не 1'}, потом ${selectedCount()}`
	);

	required(firstBodyRow(), '[data-grid-action]').click();
	await frames();
	check('Grid: клик по кнопке внутри ячейки выбор не меняет', selectedCount() === 0, `выбрано ${selectedCount()}`);

	headBox().click();
	await frames(4);
	const allSelected = headBox().checked && !headBox().indeterminate && selectedCount() === 100_000;
	rowBox().click();
	await frames(4);
	const someSelected = headBox().indeterminate && !headBox().checked && selectedCount() === 99_999;
	headBox().click();
	await frames(4);
	const allAgain = headBox().checked && selectedCount() === 100_000;
	headBox().click();
	await frames(4);
	check(
		'Grid: главный чекбокс проходит состояния все, часть, все, ничего',
		allSelected && someSelected && allAgain && !headBox().checked && !headBox().indeterminate && selectedCount() === 0,
		`все ${String(allSelected)}, часть ${String(someSelected)}, снова все ${String(allAgain)}, в конце выбрано ${selectedCount()}`
	);

	textCell().dispatchEvent(new MouseEvent('click', { bubbles: true }));
	textCell().dispatchEvent(new MouseEvent('click', { bubbles: true }));
	textCell().dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
	await frames();
	const doubleLogged = required(page, '[data-grid-dblclick]').textContent;
	check(
		'Grid: click, click, dblclick оставляют выбор прежним и сообщают строку в onRowDoubleClick',
		selectedCount() === 0 && doubleLogged === 'Заказчик 1',
		`выбрано ${selectedCount()}, onRowDoubleClick: ${doubleLogged}`
	);

	const amountHeader = headers(table).find((th) => th.textContent === 'Сумма') as HTMLElement;
	const amountIndex = headers(table).indexOf(amountHeader);
	required(amountHeader, 'button').click();
	let ascending = false;
	for (let attempt = 0; attempt < 30 && !ascending; attempt++) {
		await frames(3);
		ascending = amountHeader.getAttribute('aria-sort') === 'ascending' && firstBodyRow().cells[amountIndex]?.textContent === '0';
	}
	const ascOrder = bodyRows(table).slice(0, 5).map((row) => Number(row.cells[amountIndex]?.textContent));
	required(amountHeader, 'button').click();
	required(amountHeader, 'button').click();
	let reset = false;
	for (let attempt = 0; attempt < 30 && !reset; attempt++) {
		await frames(3);
		reset = amountHeader.getAttribute('aria-sort') === 'none' && firstBodyRow().dataset['rowKey'] === '1';
	}
	check(
		'Grid: клик по заголовку сортирует (asc, desc, сброс), aria-sort у активной колонки, порядок строк даёт страница',
		ascending && ascOrder.every((value, index) => index === 0 || (ascOrder[index - 1] as number) <= value) && reset,
		`asc ${String(ascending)} (${ascOrder.join(', ')}), сброс ${String(reset)}`
	);

	textCell().click();
	await frames();
	const countSelect = required(page, '[data-grid-count]') as HTMLSelectElement;
	countSelect.value = '1000';
	countSelect.dispatchEvent(new Event('change', { bubbles: true }));
	await frames(4);
	const keptAfterShrink = selectedCount() === 1 && firstBodyRow().getAttribute('aria-selected') === 'true';
	countSelect.value = '100000';
	countSelect.dispatchEvent(new Event('change', { bubbles: true }));
	await frames(4);
	textCell().click();
	await frames();
	check(
		'Grid: выбор сохраняется при замене числа строк',
		keptAfterShrink && selectedCount() === 0,
		`после замены выбрано ${keptAfterShrink ? 1 : 'не 1'}, после снятия ${selectedCount()}`
	);

	const headerHeight = required(table, 'thead').getBoundingClientRect().height;
	const rowHeight = heights.reduce((total, value) => total + value, 0) / heights.length;
	scroller.scrollTop = headerHeight + 50_000 * rowHeight;
	await frames(6);
	const jumped = bodyRows(table);
	const visibleTop = scroller.getBoundingClientRect().top + headerHeight;
	const visibleBottom = scroller.getBoundingClientRect().top + scroller.clientHeight;
	const firstVisible = jumped.find((row) => row.getBoundingClientRect().bottom > visibleTop);
	const lastRow = jumped[jumped.length - 1];
	const topOffset = firstVisible ? firstVisible.getBoundingClientRect().top - visibleTop : Number.NaN;
	check(
		'Grid: после прыжка в середину списка тело покрывает видимую область без пустот под шапкой и внизу',
		firstVisible !== undefined && topOffset <= 0.5 && Number(firstVisible.dataset['index']) > 10_000
			&& lastRow !== undefined && lastRow.getBoundingClientRect().bottom >= visibleBottom - 0.5,
		`первая видимая строка ${firstVisible?.dataset['index'] ?? '—'}, строка под шапкой начинается на ${topOffset.toFixed(1)} px`
	);

	scroller.scrollTop = scroller.scrollHeight;
	await frames(6);
	const tail = bodyRows(table);
	const tailLast = tail[tail.length - 1];
	const tailBottom = tailLast?.getBoundingClientRect().bottom ?? Number.NaN;
	const scrollerBottom = scroller.getBoundingClientRect().top + scroller.clientHeight;
	check(
		'Grid: прокрутка в самый конец показывает последнюю строку впритык к нижнему краю, без пустого хвоста',
		tailLast?.dataset['index'] === '99999' && Math.abs(tailBottom - scrollerBottom) <= 1.5,
		`последняя строка ${tailLast?.dataset['index'] ?? '—'}, зазор снизу ${(scrollerBottom - tailBottom).toFixed(1)} px`
	);
	scroller.scrollTop = 0;
	await frames();

	return results;
}
