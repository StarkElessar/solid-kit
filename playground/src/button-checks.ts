import { blend, contrastRatio, type Rgb } from '../../src/utils/color-math';

import { type CheckResult, resolveColor, type Rgba } from './theme-checks';

interface VariantTokens {
	readonly fills: readonly [rest: string, hover: string, active: string];
	readonly text: string;
}

/** Таблица вариантов из спека этапа 1, раздел 3. */
const VARIANTS: Record<string, VariantTokens> = {
	primary: {
		fills: ['--s-kit-color-primary', '--s-kit-color-primary-hover', '--s-kit-color-primary-active'],
		text: '--s-kit-color-primary-contrast'
	},
	tinted: {
		fills: ['--s-kit-color-tint', '--s-kit-color-tint-hover', '--s-kit-color-tint-active'],
		text: '--s-kit-color-text'
	},
	plain: {
		fills: ['--s-kit-color-surface', '--s-kit-color-hover', '--s-kit-color-tint'],
		text: '--s-kit-color-text'
	},
	danger: {
		fills: ['--s-kit-color-danger', '--s-kit-color-danger-hover', '--s-kit-color-danger-active'],
		text: '--s-kit-color-primary-contrast'
	}
};

const STATES = ['покой', 'hover', 'active'] as const;

function rgb([red, green, blue]: Rgba): Rgb {
	return [red, green, blue];
}

/** Значение токена в области страницы: временный элемент с data-s-kit пересчитывает производные токены. */
function tokenColor(scope: Element, name: string): Rgba {
	const probe = document.createElement('span');
	probe.setAttribute('data-s-kit', '');
	probe.style.color = `var(${name})`;
	scope.append(probe);
	const color = resolveColor(getComputedStyle(probe).color);
	probe.remove();
	return color;
}

/**
 * Цвет под элементом: заливка самого элемента или ближайшего предка; полупрозрачная заливка смешивается с тем, что под ней,
 * без заливок остаётся поверхность страницы.
 */
function underlying(element: Element | null, surface: Rgba): Rgba {
	if (!element) {
		return surface;
	}
	const fill = resolveColor(getComputedStyle(element).backgroundColor);
	if (fill[3] === 0) {
		return underlying(element.parentElement, surface);
	}
	if (fill[3] === 255) {
		return fill;
	}
	const [red, green, blue] = blend(rgb(fill), fill[3] / 255, rgb(underlying(element.parentElement, surface)));
	return [red, green, blue, 255];
}

/**
 * Контраст текста вариантов Button в трёх состояниях и кольцо фокуса у кнопок и полей Input
 * снаружи и внутри контейнера (спек этапа 1, раздел 5).
 */
export function runButtonChecks(page: HTMLElement): CheckResult[] {
	const results: CheckResult[] = [];
	const check = (name: string, ok: boolean, detail: string): void => {
		results.push({ name, ok, detail });
	};
	const surface = resolveColor(getComputedStyle(page).backgroundColor);

	for (const [variant, tokens] of Object.entries(VARIANTS)) {
		const text = rgb(tokenColor(page, tokens.text));
		tokens.fills.forEach((name, index) => {
			const ratio = contrastRatio(text, rgb(tokenColor(page, name)));
			const state = STATES[index] ?? '?';
			check(`Button ${variant}: текст в состоянии «${state}» читаем (4.5:1)`, ratio >= 4.5, `контраст ${ratio.toFixed(2)}:1`);
		});
	}

	for (const block of page.querySelectorAll<HTMLElement>('[data-focus-block]')) {
		const mode = block.dataset['focusBlock'] ?? '?';
		for (const control of block.querySelectorAll<HTMLElement>('button, input')) {
			const inset = control.closest('[data-s-kit-focus-inset]') !== null;
			const label = control.dataset['focusName'] ?? control.dataset['variant'] ?? '?';
			const options: FocusOptions & { focusVisible: boolean } = { focusVisible: true };
			control.focus(options);
			const style = getComputedStyle(control);
			const offset = Number.parseFloat(style.outlineOffset);
			check(`${mode}/${label}: кольцо фокуса показано`, style.outlineStyle === 'solid', `outline-style = ${style.outlineStyle}`);
			check(
				`${mode}/${label}: кольцо ${inset ? 'внутри' : 'снаружи'}`,
				inset ? offset < 0 : offset > 0,
				`outline-offset = ${style.outlineOffset}`
			);
			const ring = resolveColor(style.outlineColor);
			const under = inset ? underlying(control, surface) : surface;
			const ratio = contrastRatio(blend(rgb(ring), ring[3] / 255, rgb(under)), rgb(under));
			check(`${mode}/${label}: кольцо контрастно к фону (3:1)`, ratio >= 3, `контраст ${ratio.toFixed(2)}:1`);
			control.blur();
		}
	}
	return results;
}
