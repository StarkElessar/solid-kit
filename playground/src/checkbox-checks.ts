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
 * Связь подписи и флажка, контраст границы (не выбран, с ошибкой), заливки и отметки (выбран, частично) у каждого флажка
 * с data-checkbox-demo. Видимость галочки и тире определяется по display соседнего SVG.
 */
export function runCheckboxChecks(page: HTMLElement): CheckResult[] {
	const results: CheckResult[] = [];
	const check = (name: string, ok: boolean, detail: string): void => {
		results.push({ name, ok, detail });
	};
	const surface = resolveColor(getComputedStyle(page).backgroundColor);

	for (const input of page.querySelectorAll<HTMLInputElement>('[data-checkbox-demo]')) {
		const id = input.dataset['checkboxDemo'] ?? '?';
		const root = input.closest('label');
		if (!root) {
			throw new Error(`Playground element is missing in Checkbox ${id}`);
		}
		check(`Checkbox ${id}: подпись связана с флажком`, root.control === input, `label.control = ${root.control?.tagName ?? 'null'}`);

		const style = getComputedStyle(input);
		if (id === 'unchecked' || id === 'invalid') {
			const edge = over(resolveColor(style.borderTopColor), surface);
			const ratio = contrastRatio(edge, rgb(surface));
			check(`Checkbox ${id}: граница контрастна к поверхности (3:1)`, ratio >= 3, `контраст ${ratio.toFixed(2)}:1`);
		}
		else {
			const fill = resolveColor(style.backgroundColor);
			const fillRatio = contrastRatio(rgb(fill), rgb(surface));
			check(`Checkbox ${id}: заливка контрастна к поверхности (3:1)`, fillRatio >= 3, `контраст ${fillRatio.toFixed(2)}:1`);

			const mark = input.parentElement?.querySelector<SVGElement>(`[data-mark="${id === 'checked' ? 'check' : 'dash'}"]`);
			if (!mark) {
				throw new Error(`Playground element is missing in Checkbox ${id}: mark`);
			}
			const markStyle = getComputedStyle(mark);
			const markRatio = contrastRatio(rgb(resolveColor(markStyle.color)), rgb(fill));
			check(
				`Checkbox ${id}: отметка видна и контрастна к заливке (3:1)`,
				markStyle.display !== 'none' && markRatio >= 3,
				`display ${markStyle.display}, контраст ${markRatio.toFixed(2)}:1`
			);
		}
	}
	return results;
}
