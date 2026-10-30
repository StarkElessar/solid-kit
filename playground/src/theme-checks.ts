import { blend, contrastRatio, type Rgb } from '../../src/utils/color-math';

export interface CheckResult {
	readonly name: string;
	readonly ok: boolean;
	readonly detail: string;
}

export type Rgba = readonly [red: number, green: number, blue: number, alpha: number];

let context: CanvasRenderingContext2D | undefined;

/** Приводит любой CSS-цвет (в том числе результат color-mix и light-dark) к байтам sRGB через канвас 1x1. */
export function resolveColor(cssColor: string): Rgba {
	if (!context) {
		const canvas = document.createElement('canvas');
		canvas.width = 1;
		canvas.height = 1;
		const created = canvas.getContext('2d', { willReadFrequently: true });
		if (!created) {
			throw new Error('2d canvas is not available');
		}
		context = created;
	}
	const canvasContext = context;
	const read = (sentinel: string): Rgba => {
		canvasContext.clearRect(0, 0, 1, 1);
		canvasContext.fillStyle = sentinel;
		canvasContext.fillStyle = cssColor;
		canvasContext.fillRect(0, 0, 1, 1);
		const [red = 0, green = 0, blue = 0, alpha = 0] = canvasContext.getImageData(0, 0, 1, 1).data;
		return [red, green, blue, alpha];
	};
	const onBlack = read('#000');
	const onWhite = read('#fff');
	// если строка не разобралась, fillStyle остаётся прежним и результаты расходятся
	if (onBlack.some((channel, index) => channel !== onWhite[index])) {
		throw new Error(`Cannot parse colour: ${cssColor}`);
	}
	return onBlack;
}

function required(root: ParentNode, selector: string): HTMLElement {
	const element = root.querySelector<HTMLElement>(selector);
	if (!element) {
		throw new Error(`Playground element is missing: ${selector}`);
	}
	return element;
}

function background(element: Element): Rgba {
	return resolveColor(getComputedStyle(element).backgroundColor);
}

function rgb([red, green, blue]: Rgba): Rgb {
	return [red, green, blue];
}

function distance(first: Rgba, second: Rgba): number {
	return Math.max(Math.abs(first[0] - second[0]), Math.abs(first[1] - second[1]), Math.abs(first[2] - second[2]));
}

/** Сценарии критерия 5 (раздел 12 спека), которые можно проверить кодом в браузере. */
export function runThemeChecks(root: ParentNode): CheckResult[] {
	const results: CheckResult[] = [];
	const check = (name: string, ok: boolean, detail: string): void => {
		results.push({ name, ok, detail });
	};

	// вложенные области: тёмная обёртка sm с переопределённым primary, форма с компонентным токеном, панель в top layer
	const nested = required(root, '[data-scenario="nested"]');
	const panel = required(nested, '[data-s-kit-popover-content]');
	const chip = required(panel, '[data-chip]');

	check('панель показана в top layer', panel.matches(':popover-open'), `:popover-open = ${String(panel.matches(':popover-open'))}`);

	const panelBackground = background(panel);
	check(
		'панель получила компонентный токен формы (--s-kit-popover-bg)',
		panelBackground[0] === 255 && panelBackground[1] === 232 && panelBackground[2] === 204,
		`фон панели rgb(${panelBackground[0]} ${panelBackground[1]} ${panelBackground[2]}), ожидался rgb(255 232 204)`
	);

	const height = getComputedStyle(panel).getPropertyValue('--s-kit-control-height').trim();
	check('размер обёртки (sm) дошёл до панели', height === '28px', `--s-kit-control-height = "${height}"`);

	const originalTheme = nested.getAttribute('data-s-kit-theme');
	for (const [theme, expected] of [
		['light', [124, 58, 237]],
		['dark', [167, 139, 250]]
	] as const) {
		nested.setAttribute('data-s-kit-theme', theme);
		const colorScheme = getComputedStyle(panel).colorScheme;
		const primary = background(chip);
		check(
			`смена темы обёртки на ${theme} при открытой панели отражается на панели и на primary`,
			colorScheme === theme && primary[0] === expected[0] && primary[1] === expected[1] && primary[2] === expected[2],
			`color-scheme = ${colorScheme}, primary = rgb(${primary[0]} ${primary[1]} ${primary[2]})`
		);
	}
	if (originalTheme) {
		nested.setAttribute('data-s-kit-theme', originalTheme);
	}

	const originalSize = nested.getAttribute('data-s-kit-size');
	nested.setAttribute('data-s-kit-size', 'lg');
	const largeHeight = getComputedStyle(panel).getPropertyValue('--s-kit-control-height').trim();
	check(
		'смена размера обёртки на lg при открытой панели отражается на панели',
		largeHeight === '40px',
		`--s-kit-control-height = "${largeHeight}"`
	);
	if (originalSize) {
		nested.setAttribute('data-s-kit-size', originalSize);
	}

	// hover и active заметно отличаются от покоя, а текст кнопки остаётся читаемым в каждом состоянии (раздел 4.1)
	for (const group of root.querySelectorAll<HTMLElement>('[data-swatch-group]')) {
		const label = group.dataset['swatchGroup'] ?? '?';
		const rest = background(required(group, '[data-swatch="primary"]'));
		const hover = background(required(group, '[data-swatch="hover"]'));
		const active = background(required(group, '[data-swatch="active"]'));
		const hoverShift = distance(rest, hover);
		const activeShift = distance(rest, active);
		check(
			`${label}: hover и active отличаются от покоя`,
			hoverShift >= 12 && activeShift > hoverShift,
			`сдвиг hover = ${hoverShift}, active = ${activeShift} (нужно hover >= 12 и active > hover)`
		);

		const text = rgb(resolveColor(getComputedStyle(required(group, '[data-swatch="primary"]')).color));
		for (const [state, fill] of [['покой', rest], ['hover', hover], ['active', active]] as const) {
			const ratio = contrastRatio(text, rgb(fill));
			check(`${label}: текст кнопки в состоянии «${state}» читаем (4.5:1)`, ratio >= 4.5, `контраст ${ratio.toFixed(2)}:1`);
		}
	}

	// материал панели: контраст текста не ниже 4.5:1 на самых неблагоприятных фонах под панелью (раздел 4.3)
	for (const theme of ['light', 'dark']) {
		const material = required(root, `[data-scenario="${theme}"] [data-s-kit-popover-content]`);
		const style = getComputedStyle(material);
		const fill = resolveColor(style.backgroundColor);
		const text = rgb(resolveColor(style.color));
		const worst = Math.min(
			...([
				[0, 0, 0],
				[255, 255, 255]
			] as const).map((backdrop) => contrastRatio(text, blend(rgb(fill), fill[3] / 255, backdrop)))
		);
		check(`${theme}: контраст текста панели на любом фоне под ней`, worst >= 4.5, `минимум ${worst.toFixed(2)}:1 (нужно 4.5:1)`);
	}

	return results;
}
