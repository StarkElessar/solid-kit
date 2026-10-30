import { blend, contrastRatio, type Rgb } from '../../src/utils/color-math';

import { closeWithEscape, frames, required } from './check-helpers';
import { type CheckResult, resolveColor, type Rgba } from './theme-checks';

function rgb([red, green, blue]: Rgba): Rgb {
	return [red, green, blue];
}

function openAt(area: HTMLElement, x: number, y: number): void {
	area.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: x, clientY: y }));
}

/**
 * Открывает меню областью «basic» (событие `contextmenu` с координатами) и проверяет измеримое: позицию в точке клика и
 * удержание во вьюпорте у четырёх краёв, роли, контраст текста (в том числе `danger`) и материала на чёрной и белой подложке,
 * закрытие при прокрутке. Настоящие клавиши, Esc в диалоге и внутреннее кольцо фокуса проверяются вручную.
 */
export async function runContextMenuChecks(page: HTMLElement): Promise<CheckResult[]> {
	const results: CheckResult[] = [];
	const check = (name: string, ok: boolean, detail: string): void => {
		results.push({ name, ok, detail });
	};
	const area = required(page, '[data-menu-area="basic"]');

	openAt(area, 200, 200);
	await frames();
	const menu = required(document, '[data-menu-content="basic"]');
	try {
		const rect = menu.getBoundingClientRect();
		check(
			'ContextMenu: меню появляется у точки клика',
			Math.abs(rect.left - 200) <= 1 && Math.abs(rect.top - 202) <= 1,
			`угол меню (${rect.left.toFixed(0)}, ${rect.top.toFixed(0)}), точка (200, 200) плюс зазор 2 px`
		);
		check(
			'ContextMenu: роли меню и пунктов',
			menu.getAttribute('role') === 'menu'
				&& menu.querySelectorAll('[role="menuitem"]').length >= 6
				&& menu.querySelector('[role="separator"]') !== null,
			`пунктов ${menu.querySelectorAll('[role="menuitem"]').length}`
		);
		check(
			'ContextMenu: меню в top layer',
			menu.matches(':popover-open'),
			`popover-open = ${String(menu.matches(':popover-open'))}`
		);

		const surface = getComputedStyle(menu);
		const fill = resolveColor(surface.backgroundColor);
		for (const [name, element] of [
			['пункта', required(menu, '[data-menu-item="rename"]')],
			['пункта danger', required(menu, '[data-menu-item="delete"]')]
		] as const) {
			const text = rgb(resolveColor(getComputedStyle(element).color));
			const worst = Math.min(
				...([
					[0, 0, 0],
					[255, 255, 255]
				] as const).map((backdrop) => contrastRatio(text, blend(rgb(fill), fill[3] / 255, backdrop)))
			);
			check(`ContextMenu: контраст текста ${name} на любом фоне под меню (4.5:1)`, worst >= 4.5, `минимум ${worst.toFixed(2)}:1`);
		}

		const items = [...menu.querySelectorAll<HTMLElement>('[role="menuitem"]')];
		const longItem = items.find((item) => item.textContent.startsWith('Очень длинное'));
		const label = longItem?.querySelector<HTMLElement>('[data-s-kit-menu-label]');
		check(
			'ContextMenu: длинный пункт обрезан многоточием, меню не шире максимума',
			label !== undefined && label !== null && label.scrollWidth > label.clientWidth && rect.width <= 321,
			`ширина меню ${rect.width.toFixed(0)} px, подпись ${label?.scrollWidth ?? 0} > ${label?.clientWidth ?? 0}`
		);
	}
	finally {
		closeWithEscape();
		await frames();
	}

	const edges: ReadonlyArray<readonly [string, number, number]> = [
		['левый верхний угол', 2, 2],
		['правый верхний угол', window.innerWidth - 2, 2],
		['левый нижний угол', 2, window.innerHeight - 2],
		['правый нижний угол', window.innerWidth - 2, window.innerHeight - 2]
	];
	for (const [name, x, y] of edges) {
		openAt(area, x, y);
		await frames();
		const edgeMenu = required(document, '[data-menu-content="basic"]');
		const box = edgeMenu.getBoundingClientRect();
		check(
			`ContextMenu: клик у края (${name}) не выводит меню за вьюпорт`,
			box.left >= 0 && box.top >= 0 && box.right <= window.innerWidth && box.bottom <= window.innerHeight,
			`меню (${box.left.toFixed(0)}, ${box.top.toFixed(0)}) – (${box.right.toFixed(0)}, ${box.bottom.toFixed(0)}), `
				+ `окно ${window.innerWidth}×${window.innerHeight}`
		);
		closeWithEscape();
		await frames();
	}

	openAt(area, 200, 200);
	await frames();
	document.dispatchEvent(new Event('scroll'));
	await frames();
	check('ContextMenu: прокрутка страницы закрывает меню', document.querySelector('[data-menu-content="basic"]') === null, 'меню удалено');

	return results;
}
