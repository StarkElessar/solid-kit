import { blend, contrastRatio, type Rgb } from '../../src/utils/color-math';

import { type CheckResult, resolveColor, type Rgba } from './theme-checks';

function rgb([red, green, blue]: Rgba): Rgb {
	return [red, green, blue];
}

/** Цвет поверх фона: полупрозрачные цвета (граница, кольцо) смешиваются с заливкой под ними. */
function over(color: Rgba, under: Rgba): Rgb {
	return blend(rgb(color), color[3] / 255, rgb(under));
}

/** Граница поля: ширина больше нуля, контраст 3:1 (WCAG 1.4.11) и у поля с ошибкой; текст и плейсхолдер 4.5:1 на обычном поле. */
export function runInputChecks(page: HTMLElement): CheckResult[] {
	const results: CheckResult[] = [];
	const check = (name: string, ok: boolean, detail: string): void => {
		results.push({ name, ok, detail });
	};
	const input = page.querySelector<HTMLInputElement>('[data-row="row-1"] [data-row-control="input"]');
	const invalid = page.querySelector<HTMLInputElement>('[data-row="row-1"] [data-row-control="input-invalid"]');
	if (!input || !invalid) {
		throw new Error('Playground element is missing: input in row-1');
	}
	const surface = resolveColor(getComputedStyle(input).backgroundColor);
	const ratio = (foreground: Rgb): number => contrastRatio(foreground, rgb(surface));

	const border = ratio(over(resolveColor(getComputedStyle(input).borderTopColor), surface));
	check('Input: граница отличима от фона (3:1)', border >= 3, `контраст ${border.toFixed(2)}:1`);

	const borderWidth = Number.parseFloat(getComputedStyle(input).borderTopWidth);
	check('Input: граница имеет ширину (основа контролов её не обнуляет)', borderWidth > 0, `ширина ${borderWidth}px`);

	const invalidBorder = ratio(over(resolveColor(getComputedStyle(invalid).borderTopColor), surface));
	check('Input с ошибкой: граница отличима от фона (3:1)', invalidBorder >= 3, `контраст ${invalidBorder.toFixed(2)}:1`);

	const text = ratio(over(resolveColor(getComputedStyle(input).color), surface));
	check('Input: текст читаем (4.5:1)', text >= 4.5, `контраст ${text.toFixed(2)}:1`);

	const placeholder = ratio(over(resolveColor(getComputedStyle(input, '::placeholder').color), surface));
	check('Input: плейсхолдер читаем (4.5:1)', placeholder >= 4.5, `контраст ${placeholder.toFixed(2)}:1`);
	return results;
}
