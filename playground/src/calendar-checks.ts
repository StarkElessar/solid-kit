import { blend, contrastRatio, type Rgb } from '../../src/utils/color-math';

import { frames, required } from './check-helpers';
import { type CheckResult, resolveColor, type Rgba } from './theme-checks';

const TOLERANCE = 0.75;

function rgb([red, green, blue]: Rgba): Rgb {
	return [red, green, blue];
}

function demo(page: HTMLElement, id: string): HTMLElement {
	return required(page, `[data-calendar-demo="${id}"] [data-s-kit]`);
}

function size(element: Element): { width: number; height: number } {
	const { width, height } = element.getBoundingClientRect();
	return { width, height };
}

function press(root: HTMLElement, label: string): void {
	required(root, `button[aria-label="${label}"]`).click();
}

function today(root: HTMLElement): void {
	const button = [...root.querySelectorAll('button')].find((candidate) => candidate.textContent === 'Сегодня');
	button?.click();
}

function near(a: number, b: number): boolean {
	return Math.abs(a - b) <= TOLERANCE;
}

function format(box: { width: number; height: number }): string {
	return `${box.width.toFixed(1)}×${box.height.toFixed(1)}`;
}

/** Цвет поверх поверхности страницы: заливки ячеек могут быть полупрозрачными. */
function over(color: Rgba, surface: Rgba): Rgb {
	return blend(rgb(color), color[3] / 255, rgb(surface));
}

/**
 * Приёмка Calendar (спека этапа 5, критерии а, б, в, г, е): размер календаря одинаков во всех режимах и у месяцев из 4, 5 и 6 недель,
 * месяцы и годы заполняют рамку тела, клавиатура, внутреннее кольцо фокуса у обрезающего контейнера, контраст.
 */
export async function runCalendarChecks(page: HTMLElement): Promise<CheckResult[]> {
	const results: CheckResult[] = [];
	const check = (name: string, ok: boolean, detail: string): void => {
		results.push({ name, ok, detail });
	};
	const surface = resolveColor(getComputedStyle(page).backgroundColor);

	for (const id of ['size-sm', 'size-md', 'size-lg']) {
		const root = demo(page, id);
		const days = size(root);
		const daysGrid = size(required(root, '[role="grid"]'));
		press(root, 'Выбрать месяц');
		const months = size(root);
		const monthsGrid = size(required(root, '[role="grid"]'));
		const monthCells = root.querySelectorAll('[role="gridcell"]').length;
		press(root, 'Выбрать год');
		const years = size(root);
		const yearsGrid = size(required(root, '[role="grid"]'));
		const yearCells = root.querySelectorAll('[role="gridcell"]').length;
		today(root);
		check(
			`Calendar ${id}: размер одинаков в режимах дней, месяцев и годов`,
			[months, years].every((other) => near(days.width, other.width) && near(days.height, other.height)),
			`дни ${format(days)}, месяцы ${format(months)}, годы ${format(years)}`
		);
		check(
			`Calendar ${id}: тело месяцев и годов занимает рамку тела дней`,
			near(daysGrid.width, monthsGrid.width) && near(daysGrid.height, monthsGrid.height)
				&& near(daysGrid.width, yearsGrid.width) && near(daysGrid.height, yearsGrid.height),
			`дни ${format(daysGrid)}, месяцы ${format(monthsGrid)}, годы ${format(yearsGrid)}`
		);
		check(`Calendar ${id}: 12 ячеек месяцев и 12 ячеек годов`, monthCells === 12 && yearCells === 12, `${monthCells} и ${yearCells}`);
	}

	const heights = ['weeks-4', 'weeks-5', 'weeks-6'].map((id) => size(demo(page, id)));
	const first = heights[0] ?? { width: 0, height: 0 };
	check(
		'Calendar: размер не зависит от числа недель месяца (4, 5, 6)',
		heights.every((box) => near(box.width, first.width) && near(box.height, first.height)),
		heights.map(format).join(', ')
	);
	const counts = ['weeks-4', 'weeks-5', 'weeks-6'].map((id) => demo(page, id).querySelectorAll('[role="gridcell"]').length);
	check('Calendar: во всех трёх месяцах 42 ячейки дней', counts.every((count) => count === 42), counts.join(', '));

	const monthRoot = demo(page, 'size-md');
	press(monthRoot, 'Выбрать месяц');
	const body = required(monthRoot, '[role="grid"]').getBoundingClientRect();
	const cells = [...monthRoot.querySelectorAll('[role="gridcell"]')].map((cell) => cell.getBoundingClientRect());
	const last = cells.at(-1);
	check(
		'Calendar: ячейки месяцев растянуты до правого и нижнего края тела',
		last !== undefined && near(last.right, body.right) && near(last.bottom, body.bottom) && near(cells[0]?.left ?? -1, body.left),
		last ? `правый край ${(last.right - body.right).toFixed(2)}, нижний ${(last.bottom - body.bottom).toFixed(2)}` : 'нет ячеек'
	);
	today(monthRoot);

	const limits = demo(page, 'limits');
	required(limits, 'button[aria-label^="среда, 18 ноября"]').click();
	await frames(1);
	const target = required(limits, '[data-focus-target]');
	target.focus({ focusVisible: true } as FocusOptions);
	const before = target.getAttribute('aria-label') ?? '';
	target.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }));
	await frames(1);
	const after = document.activeElement?.getAttribute('aria-label') ?? '';
	check(
		'Calendar: ArrowRight переносит фокус на следующий день',
		before.includes('18 ноября') && after.includes('19 ноября') && limits.contains(document.activeElement),
		`${before} → ${after}`
	);
	const disabledCells = [...limits.querySelectorAll('button[aria-disabled="true"]')];
	const weekendDisabled = disabledCells.some((button) => /суббота|воскресенье/.test(button.getAttribute('aria-label') ?? ''));
	check('Calendar: выходные из isDateDisabled отключены', weekendDisabled, `отключено ${disabledCells.length} ячеек`);
	(document.activeElement as HTMLElement | null)?.blur();

	for (const id of ['size-md', 'clip']) {
		const root = required(page, `[data-calendar-demo="${id}"] [data-s-kit]`);
		const rows = root.querySelectorAll('[role="row"]');
		const lastRow = rows[rows.length - 1]?.getBoundingClientRect();
		const footer = [...root.querySelectorAll('button')].find((button) => button.textContent === 'Сегодня')?.getBoundingClientRect();
		const gap = lastRow && footer ? footer.top - lastRow.bottom : -1;
		check(`Calendar ${id}: между телом и кнопкой «Сегодня» есть зазор (не меньше 6px)`, gap >= 6, `зазор ${gap.toFixed(1)}px`);
	}

	const clip = required(page, '[data-calendar-demo="clip"]');
	const clipRoot = required(clip, '[data-s-kit]');
	const ringed = required(clipRoot, '[data-focus-target]');
	ringed.focus({ focusVisible: true } as FocusOptions);
	const style = getComputedStyle(ringed);
	const offset = Number.parseFloat(style.outlineOffset);
	check('Calendar: кольцо фокуса показано', style.outlineStyle === 'solid', `outline-style = ${style.outlineStyle}`);
	check('Calendar: кольцо внутри ячейки (внутренний вариант)', offset < 0, `outline-offset = ${style.outlineOffset}`);
	const ring = resolveColor(style.outlineColor);
	const fill = resolveColor(style.backgroundColor);
	const under = fill[3] > 0 ? over(fill, surface) : rgb(surface);
	const ringRatio = contrastRatio(blend(rgb(ring), ring[3] / 255, under), under);
	check('Calendar: кольцо контрастно к заливке ячейки (3:1)', ringRatio >= 3, `контраст ${ringRatio.toFixed(2)}:1`);
	ringed.blur();

	const sample = demo(page, 'size-md');
	const textOn = (selector: string, under: Rgb): number => {
		const element = required(sample, selector);
		const color = over(resolveColor(getComputedStyle(element).color), [...under, 255] as unknown as Rgba);
		return contrastRatio(color, under);
	};
	const selectedCell = required(sample, 'button[data-selected]');
	const selectedFill = over(resolveColor(getComputedStyle(selectedCell).backgroundColor), surface);
	const selectedRatio = contrastRatio(rgb(resolveColor(getComputedStyle(selectedCell).color)), selectedFill);
	check('Calendar: текст выбранной даты читаем (4.5:1)', selectedRatio >= 4.5, `контраст ${selectedRatio.toFixed(2)}:1`);
	const surfaceRgb = rgb(surface);
	const dayRatio = textOn('button:not([data-outside]):not([data-selected]):not([data-today])', surfaceRgb);
	check('Calendar: текст обычной даты читаем (4.5:1)', dayRatio >= 4.5, `контраст ${dayRatio.toFixed(2)}:1`);
	const outsideRatio = textOn('button[data-outside]', surfaceRgb);
	check('Calendar: дни соседних месяцев различимы (3:1)', outsideRatio >= 3, `контраст ${outsideRatio.toFixed(2)}:1`);
	const todayCell = required(sample, 'button[data-today]');
	const todayRing = resolveColor(getComputedStyle(todayCell).boxShadow.match(/rgba?\([^)]*\)|color\([^)]*\)/)?.[0] ?? '#000');
	const todayRatio = contrastRatio(blend(rgb(todayRing), todayRing[3] / 255, surfaceRgb), surfaceRgb);
	check('Calendar: контур сегодняшней даты контрастен (3:1)', todayRatio >= 3, `контраст ${todayRatio.toFixed(2)}:1`);

	return results;
}
