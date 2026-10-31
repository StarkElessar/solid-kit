import { closeWithEscape, frames, required } from './check-helpers';
import type { CheckResult } from './theme-checks';

const RING_STEPS = 45;

function centerOf(element: Element): { x: number; y: number } {
	const rect = element.getBoundingClientRect();
	return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

function mouse(target: Element, type: 'click' | 'dblclick'): void {
	target.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true }));
}

function keyDown(target: HTMLElement, key: string): KeyboardEvent {
	const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
	target.dispatchEvent(event);
	return event;
}

function number(element: HTMLElement): number {
	return Number.parseInt(element.textContent, 10);
}

/** Открывает список кликом по инициатору сценария и возвращает список (он связан с инициатором через `aria-controls`). */
async function openList(trigger: HTMLElement): Promise<HTMLElement> {
	trigger.scrollIntoView({ behavior: 'instant', block: 'center' });
	trigger.focus();
	trigger.click();
	await frames();
	const list = document.getElementById(trigger.getAttribute('aria-controls') ?? '');
	if (!list) {
		throw new Error('List of the scenario trigger is not in the DOM');
	}
	return list;
}

async function closeList(): Promise<void> {
	closeWithEscape();
	await frames();
}

function px(value: string): number {
	return Number.parseFloat(value) || 0;
}

/**
 * Сценарии критериев 4 и 5 на Select (раздел 10 спека этапа 3): тот же набор, что у Popover на странице «Панели». Меряется то, что можно
 * измерить без настоящих клавиш: hit-test, события, геометрия, вычисленные стили. Esc в диалоге проверяется вручную.
 */
export async function runSelectScenarioChecks(page: HTMLElement): Promise<CheckResult[]> {
	const results: CheckResult[] = [];
	const check = (name: string, ok: boolean, detail: string): void => {
		results.push({ name, ok, detail });
	};

	// (б) список под предком с pointer-events: none остаётся кликабельным
	{
		const scenario = required(page, '[data-scenario="select-b"]');
		const list = await openList(required(scenario, '[data-scenario-trigger]'));
		try {
			const option = required(list, '[role="option"]');
			const { x, y } = centerOf(option);
			const hit = document.elementFromPoint(x, y);
			check(
				'Select (б): предок с pointer-events: none, опция принимает указатель',
				getComputedStyle(scenario).pointerEvents === 'none' && hit !== null && option.contains(hit),
				`предок ${getComputedStyle(scenario).pointerEvents}, под указателем ${hit?.tagName ?? 'ничего'}`
			);
		}
		finally {
			await closeList();
		}
	}

	// (в) label: клик по опции не активирует флажок внутри label
	{
		const scenario = required(page, '[data-scenario="select-c-label"]');
		const input = required(scenario, '[data-label-input]') as HTMLInputElement;
		const list = await openList(required(scenario, '[data-scenario-trigger]'));
		try {
			const option = required(list, '[role="option"]:nth-child(2)');
			mouse(option, 'dblclick');
			mouse(option, 'click');
			check(
				'Select (в): внутри label клик по опции не переключает флажок',
				!input.checked,
				`флажок ${input.checked ? 'включён' : 'выключен'}`
			);
		}
		finally {
			await closeList();
		}
	}

	// (в) карточка: клик и двойной клик по опции не доходят до обработчиков карточки
	{
		const scenario = required(page, '[data-scenario="select-c-card"]');
		const clicks = required(scenario, '[data-counter="select-clicks"]');
		const doubles = required(scenario, '[data-counter="select-doubles"]');
		const trigger = required(scenario, '[data-scenario-trigger]');
		const list = await openList(trigger);
		const beforeClicks = number(clicks);
		const beforeDoubles = number(doubles);
		try {
			const option = required(list, '[role="option"]:nth-child(3)');
			mouse(option, 'dblclick');
			mouse(option, 'click');
			await frames();
			check(
				'Select (в): внутри карточки клик и двойной клик по опции не вызывают её обработчики',
				number(clicks) === beforeClicks && number(doubles) === beforeDoubles,
				`клики ${beforeClicks} → ${number(clicks)}, двойные ${beforeDoubles} → ${number(doubles)}`
			);
		}
		finally {
			await closeList();
		}
	}

	// (в) форма: Enter в списке выбирает опцию, форма не отправляется
	{
		const scenario = required(page, '[data-scenario="select-c-form"]');
		const submits = required(scenario, '[data-counter="select-submits"]');
		const trigger = required(scenario, '[data-scenario-trigger]');
		await openList(trigger);
		try {
			const enter = keyDown(trigger, 'Enter');
			await frames();
			check(
				'Select (в): внутри form Enter в списке отменён и форма не отправляется',
				enter.defaultPrevented && number(submits) === 0,
				`defaultPrevented = ${String(enter.defaultPrevented)}, отправок ${number(submits)}`
			);
		}
		finally {
			await closeList();
		}
	}

	// (д) предки с transform, filter, contain: paint, overflow: hidden не обрезают список, он стоит у якоря
	for (const name of ['transform', 'filter', 'contain', 'overflow']) {
		const scenario = required(page, `[data-scenario="select-d-${name}"]`);
		const trigger = required(scenario, '[data-scenario-trigger]');
		const list = await openList(trigger);
		try {
			const panel = required(document, `#${CSS.escape(list.id)}`).closest<HTMLElement>('[data-s-kit]');
			if (!panel) {
				throw new Error('Panel of the scenario list is not in the DOM');
			}
			const box = panel.getBoundingClientRect();
			const container = scenario.getBoundingClientRect();
			const anchor = trigger.getBoundingClientRect();
			const { x, y } = centerOf(panel);
			const hit = document.elementFromPoint(x, y);
			check(
				`Select (д): ${name}, список не обрезан и стоит у якоря`,
				box.bottom > container.bottom
					&& hit !== null && panel.contains(hit)
					&& Math.abs(box.left - anchor.left) <= 1 && Math.abs(box.top - (anchor.bottom + 4)) <= 1,
				`низ панели ${box.bottom.toFixed(0)} > низ контейнера ${container.bottom.toFixed(0)}; смещение от якоря `
					+ `${(box.left - anchor.left).toFixed(1)}, ${(box.top - anchor.bottom).toFixed(1)}`
			);
		}
		finally {
			await closeList();
		}
	}

	// кольцо активной опции: целиком в видимой области списка у краёв и не под липким заголовком группы
	{
		const scenario = required(page, '[data-scenario="select-ring"]');
		const trigger = required(scenario, '[data-scenario-trigger]');
		const list = await openList(trigger);
		try {
			const scroller = list.closest<HTMLElement>('[data-active-source]') ?? list;
			let worstTop = Number.POSITIVE_INFINITY;
			let worstBottom = Number.POSITIVE_INFINITY;
			let worstSticky = Number.POSITIVE_INFINITY;
			let checked = 0;
			const measure = (): void => {
				const active = list.querySelector<HTMLElement>('[data-active]');
				if (!active) {
					return;
				}
				const style = getComputedStyle(active);
				const reach = Math.max(0, px(style.outlineWidth) + px(style.outlineOffset));
				const box = active.getBoundingClientRect();
				const visible = scroller.getBoundingClientRect();
				worstTop = Math.min(worstTop, box.top - reach - visible.top);
				worstBottom = Math.min(worstBottom, visible.bottom - (box.bottom + reach));
				const sticky = list.querySelector<HTMLElement>('[data-list-box-sticky] > div');
				if (sticky) {
					worstSticky = Math.min(worstSticky, box.top - reach - sticky.getBoundingClientRect().bottom);
				}
				checked += 1;
			};
			keyDown(trigger, 'End');
			await frames(4);
			measure();
			for (let step = 0; step < RING_STEPS; step++) {
				keyDown(trigger, 'ArrowUp');
				await frames(2);
				measure();
			}
			const source = list.closest<HTMLElement>('[data-active-source]')?.getAttribute('data-active-source') ?? 'нет';
			check(
				'Select: кольцо активной опции целиком видно у краёв списка при движении клавишами',
				checked > 0 && source === 'keyboard' && worstTop >= -0.5 && worstBottom >= -0.5,
				`шагов ${checked}, запас сверху ${worstTop.toFixed(1)} px, снизу ${worstBottom.toFixed(1)} px, источник ${source}`
			);
			check(
				'Select: активная опция не уходит под липкий заголовок группы',
				checked > 0 && worstSticky >= -0.5,
				`минимальный зазор до заголовка ${worstSticky === Number.POSITIVE_INFINITY ? 'заголовка нет' : worstSticky.toFixed(1)} px`
			);
		}
		finally {
			await closeList();
		}
		await frames();
		check(
			'Select: после закрытия фокус вернулся к инициатору',
			document.activeElement === trigger,
			`активный элемент: ${document.activeElement?.tagName ?? 'нет'}`
		);
	}

	return results;
}
