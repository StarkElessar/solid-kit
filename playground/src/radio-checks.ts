import { blend, contrastRatio, type Rgb } from '../../src/utils/color-math';

import { type CheckResult, resolveColor, type Rgba } from './theme-checks';

function rgb([red, green, blue]: Rgba): Rgb {
	return [red, green, blue];
}

/** Цвет поверх поверхности страницы (граница control-edge полупрозрачна). */
function over(color: Rgba, surface: Rgba): Rgb {
	return blend(rgb(color), color[3] / 255, rgb(surface));
}

/**
 * Общий name радио одной группы (у каждой группы с data-radio-group), связь подписи и радио, контраст границы
 * (не выбран, с ошибкой), заливки и точки (выбран) у каждого радио с data-radio-demo.
 */
export function runRadioChecks(page: HTMLElement): CheckResult[] {
	const results: CheckResult[] = [];
	const check = (name: string, ok: boolean, detail: string): void => {
		results.push({ name, ok, detail });
	};
	const surface = resolveColor(getComputedStyle(page).backgroundColor);

	for (const group of page.querySelectorAll<HTMLElement>('[data-radio-group]')) {
		const label = group.getAttribute('aria-label') ?? '?';
		const names = new Set([...group.querySelectorAll('input[type="radio"]')].map((input) => input.getAttribute('name')));
		check(
			`RadioGroup «${label}»: радио группы делят один name`,
			names.size === 1 && !names.has(null) && !names.has(''),
			`имён ${names.size}`
		);
	}

	for (const input of page.querySelectorAll<HTMLInputElement>('[data-radio-demo]')) {
		const id = input.dataset['radioDemo'] ?? '?';
		const root = input.closest('label');
		if (!root) {
			throw new Error(`Playground element is missing in Radio ${id}`);
		}
		check(`Radio ${id}: подпись связана с радио`, root.control === input, `label.control = ${root.control?.tagName ?? 'null'}`);

		const style = getComputedStyle(input);
		if (id === 'checked') {
			const fill = resolveColor(style.backgroundColor);
			const fillRatio = contrastRatio(rgb(fill), rgb(surface));
			check(`Radio ${id}: заливка контрастна к поверхности (3:1)`, fillRatio >= 3, `контраст ${fillRatio.toFixed(2)}:1`);

			const mark = input.parentElement?.querySelector('svg');
			if (!mark) {
				throw new Error(`Playground element is missing in Radio ${id}: mark`);
			}
			const markStyle = getComputedStyle(mark);
			const markRatio = contrastRatio(rgb(resolveColor(markStyle.color)), rgb(fill));
			check(
				`Radio ${id}: точка видна и контрастна к заливке (3:1)`,
				markStyle.display !== 'none' && markRatio >= 3,
				`display ${markStyle.display}, контраст ${markRatio.toFixed(2)}:1`
			);
		}
		else {
			const edge = over(resolveColor(style.borderTopColor), surface);
			const ratio = contrastRatio(edge, rgb(surface));
			check(`Radio ${id}: граница контрастна к поверхности (3:1)`, ratio >= 3, `контраст ${ratio.toFixed(2)}:1`);
		}
	}
	return results;
}
