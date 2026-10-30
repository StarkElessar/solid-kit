import { closeWithEscape, frames, required } from './check-helpers';
import type { CheckResult } from './theme-checks';

function centerOf(element: Element): { x: number; y: number } {
	const rect = element.getBoundingClientRect();
	return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

function mouse(target: Element, type: 'click' | 'dblclick'): void {
	target.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true }));
}

/** Открывает панель инициатора сценария кликом и возвращает панель (она связана с инициатором через `aria-controls`). */
async function openPanel(trigger: HTMLElement): Promise<HTMLElement> {
	trigger.scrollIntoView({ behavior: 'instant', block: 'center' });
	trigger.focus();
	trigger.click();
	await frames();
	const panel = document.getElementById(trigger.getAttribute('aria-controls') ?? '');
	if (!panel) {
		throw new Error('Panel of the scenario trigger is not in the DOM');
	}
	return panel;
}

async function closePanel(): Promise<void> {
	closeWithEscape();
	await frames();
}

function number(element: HTMLElement): number {
	return Number.parseInt(element.textContent, 10);
}

/**
 * Сценарии (б), (в), (д) критерия 6 на Popover и мини-вариант (а) на ContextMenu (спек этапа 2, раздел 8). Меряется то, что можно
 * измерить без настоящих клавиш: hit-test, события, геометрия, вычисленные стили. Enter в форме и Esc в диалоге проверяются вручную.
 */
export async function runPopoverScenarioChecks(page: HTMLElement): Promise<CheckResult[]> {
	const results: CheckResult[] = [];
	const check = (name: string, ok: boolean, detail: string): void => {
		results.push({ name, ok, detail });
	};

	// (б) панель под предком с pointer-events: none остаётся кликабельной
	{
		const scenario = required(page, '[data-scenario="b"]');
		const panel = await openPanel(required(scenario, '[data-scenario-trigger]'));
		try {
			const button = required(panel, '[data-panel-button]');
			const { x, y } = centerOf(button);
			const hit = document.elementFromPoint(x, y);
			check(
				'(б) предок с pointer-events: none: кнопка в панели принимает указатель',
				getComputedStyle(scenario).pointerEvents === 'none' && hit !== null && button.contains(hit),
				`предок ${getComputedStyle(scenario).pointerEvents}, панель ${getComputedStyle(panel).pointerEvents}, `
					+ `под указателем ${hit?.tagName ?? 'ничего'}`
			);
		}
		finally {
			await closePanel();
		}
	}

	// (в) label: клик и двойной клик по панели не переключают флажок
	{
		const scenario = required(page, '[data-scenario="c-label"]');
		const input = required(scenario, '[data-label-input]');
		if (!(input instanceof HTMLInputElement)) {
			throw new Error('Label scenario input is not an input');
		}
		const panel = await openPanel(required(scenario, '[data-scenario-trigger]'));
		try {
			const before = input.checked;
			const text = required(panel, '[data-panel-text]');
			mouse(text, 'click');
			mouse(text, 'dblclick');
			mouse(required(panel, '[data-panel-button]'), 'click');
			check(
				'(в) Popover внутри label: клик по панели не переключает флажок',
				input.checked === before,
				`флажок был ${String(before)}, стал ${String(input.checked)}`
			);
		}
		finally {
			await closePanel();
		}
	}

	// (в) карточка: клик и двойной клик по панели не доходят до обработчиков карточки
	{
		const scenario = required(page, '[data-scenario="c-card"]');
		const clicks = required(scenario, '[data-counter="c-card-clicks"]');
		const doubles = required(scenario, '[data-counter="c-card-double"]');
		const panel = await openPanel(required(scenario, '[data-scenario-trigger]'));
		try {
			// клик по самому инициатору карточку задевает: счёт ведётся после открытия
			const beforeClicks = number(clicks);
			const beforeDoubles = number(doubles);
			const text = required(panel, '[data-panel-text]');
			mouse(text, 'click');
			mouse(text, 'dblclick');
			mouse(required(panel, '[data-panel-button]'), 'click');
			check(
				'(в) Popover внутри карточки: клик и двойной клик по панели не вызывают её обработчики',
				number(clicks) === beforeClicks && number(doubles) === beforeDoubles,
				`клики ${beforeClicks} → ${number(clicks)}, двойные ${beforeDoubles} → ${number(doubles)}`
			);
		}
		finally {
			await closePanel();
		}
	}

	// (в) форма: Enter в поле панели отменён, чтобы не отправить чужую форму
	{
		const scenario = required(page, '[data-scenario="c-form"]');
		const submits = required(scenario, '[data-counter="c-submits-count"]');
		const panel = await openPanel(required(scenario, '[data-scenario-trigger]'));
		try {
			const input = required(panel, '[data-panel-input]');
			const enter = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
			input.dispatchEvent(enter);
			check(
				'(в) Popover внутри form: Enter в поле панели отменён (форма не отправляется)',
				enter.defaultPrevented && number(submits) === 0,
				`defaultPrevented = ${String(enter.defaultPrevented)}, отправок ${number(submits)}`
			);
		}
		finally {
			await closePanel();
		}
	}

	// (д) предки с transform, filter, contain: paint, overflow: hidden не обрезают панель, она стоит у якоря
	for (const name of ['transform', 'filter', 'contain', 'overflow']) {
		const scenario = required(page, `[data-scenario="d-${name}"]`);
		const trigger = required(scenario, '[data-scenario-trigger]');
		const panel = await openPanel(trigger);
		try {
			const box = panel.getBoundingClientRect();
			const container = scenario.getBoundingClientRect();
			const anchor = trigger.getBoundingClientRect();
			const { x, y } = centerOf(panel);
			const hit = document.elementFromPoint(x, y);
			check(
				`(д) ${name}: панель не обрезана и стоит у якоря`,
				box.bottom > container.bottom
					&& hit !== null && panel.contains(hit)
					&& Math.abs(box.left - anchor.left) <= 1 && Math.abs(box.top - (anchor.bottom + 4)) <= 1,
				`низ панели ${box.bottom.toFixed(0)} > низ контейнера ${container.bottom.toFixed(0)}; смещение от якоря `
					+ `${(box.left - anchor.left).toFixed(1)}, ${(box.top - anchor.bottom).toFixed(1)}`
			);
		}
		finally {
			await closePanel();
		}
	}

	// (а, мини) меню из ячейки таблицы с text-align: right, nowrap и overflow: hidden
	{
		const cell = required(page, '[data-scenario="a-cell"]');
		const area = required(cell, '[data-scenario-area]');
		area.scrollIntoView({ behavior: 'instant', block: 'center' });
		const { x, y } = centerOf(area);
		area.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: x, clientY: y }));
		await frames();
		const menu = required(document, '[data-scenario-menu]');
		try {
			const style = getComputedStyle(menu);
			const box = menu.getBoundingClientRect();
			const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
			check(
				'(а) ContextMenu из ячейки: меню вне таблицы, не обрезано, без унаследованных выравнивания и переноса',
				menu.closest('table') === null
					&& box.width > cell.getBoundingClientRect().width
					&& hit !== null && menu.contains(hit)
					&& style.textAlign === 'start' && style.whiteSpace === 'normal',
				`в таблице: ${String(menu.closest('table') !== null)}; ширина меню ${box.width.toFixed(0)} при ячейке `
					+ `${cell.getBoundingClientRect().width.toFixed(0)}; text-align ${style.textAlign}, white-space ${style.whiteSpace}`
			);
		}
		finally {
			await closePanel();
		}
	}

	return results;
}
