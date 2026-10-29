import tokens from './tokens.css?raw';

import { describe, expect, it } from 'vitest';

import { blend, contrastRatio, parseHex } from '../utils/color-math';

const THEMES = ['light', 'dark'] as const;

const BASE_COLORS = ['primary', 'primary-contrast', 'surface', 'text', 'border', 'danger', 'success', 'warning'] as const;

const DERIVED_COLORS = [
	'primary-hover',
	'primary-active',
	'primary-subtle',
	'focus-ring',
	'muted',
	'hover',
	'tint',
	'tint-hover',
	'tint-active',
	'row-selected',
	'surface-2',
	'group',
	'hairline',
	'border-strong',
	'control-edge',
	'danger-subtle',
	'danger-hover',
	'success-subtle',
	'success-hover',
	'warning-subtle',
	'warning-hover',
	'panel'
] as const;

const OTHER_TOKENS = [
	'radius',
	'font',
	'font-size',
	'line-height',
	'control-height-sm',
	'control-height-md',
	'control-height-lg',
	'control-padding-x-sm',
	'control-padding-x-md',
	'control-padding-x-lg',
	'control-font-size-sm',
	'control-font-size-md',
	'control-font-size-lg',
	'focus-width',
	'focus-offset',
	'focus-space',
	'panel-blur',
	'panel-opacity',
	'shadow-color',
	'shadow-popover',
	'z-sticky',
	'z-loader'
] as const;

function lightDark(name: string): Record<(typeof THEMES)[number], string> {
	const match = new RegExp(`--s-kit-color-${name}:\\s*light-dark\\((#[0-9a-f]{3,6}),\\s*(#[0-9a-f]{3,6})\\)`, 'i').exec(tokens);
	if (!match?.[1] || !match[2]) {
		throw new Error(`Base token --s-kit-color-${name} must be declared as light-dark(#x, #y)`);
	}
	return { light: match[1], dark: match[2] };
}

describe('token contract', () => {
	it.each(BASE_COLORS)('declares base colour %s as light-dark()', (name) => {
		expect(() => lightDark(name)).not.toThrow();
	});

	it.each(DERIVED_COLORS)('declares derived colour %s', (name) => {
		expect(tokens).toMatch(new RegExp(`--s-kit-color-${name}:`));
	});

	it.each(OTHER_TOKENS)('declares --s-kit-%s', (name) => {
		expect(tokens).toMatch(new RegExp(`--s-kit-${name}:`));
	});

	it('follows the system theme and lets a wrapper force a theme by color-scheme only', () => {
		expect(tokens).toMatch(/:root\s*{[^}]*color-scheme:\s*light dark/);
		expect(tokens).toMatch(/\[data-s-kit-theme="light"\]\s*{\s*color-scheme:\s*light;\s*}/);
		expect(tokens).toMatch(/\[data-s-kit-theme="dark"\]\s*{\s*color-scheme:\s*dark;\s*}/);
	});

	it('resolves control size through data-s-kit-size and the inset focus ring through data-s-kit-focus-inset', () => {
		for (const size of ['sm', 'md', 'lg']) {
			expect(tokens).toMatch(new RegExp(`\\[data-s-kit-size="${size}"\\]`));
		}
		expect(tokens).toMatch(/\[data-s-kit-focus-inset\]/);
	});

	it('recomputes derived tokens on every component root', () => {
		expect(tokens).toMatch(/:root,\s*\[data-s-kit\]\s*{/);
	});

	it('never registers colour tokens with @property (a wrapper override would stop working)', () => {
		expect(tokens).not.toContain('@property');
	});

	it('uses only the --s-kit- prefix', () => {
		expect(tokens).not.toMatch(/--sk-/);
	});
});

describe('contrast of base token pairs (WCAG 2.x, 4.5:1)', () => {
	const pairs = [
		['text', 'surface'],
		['primary-contrast', 'primary'],
		['primary', 'surface'],
		['danger', 'surface'],
		['success', 'surface'],
		['warning', 'surface']
	] as const;

	for (const theme of THEMES) {
		for (const [foreground, background] of pairs) {
			it(`${theme}: ${foreground} on ${background}`, () => {
				const ratio = contrastRatio(parseHex(lightDark(foreground)[theme]), parseHex(lightDark(background)[theme]));
				expect(ratio).toBeGreaterThanOrEqual(4.5);
			});
		}
	}
});

describe('contrast of the control edge (WCAG 1.4.11, 3:1)', () => {
	const edgePattern = /--s-kit-color-control-edge:\s*color-mix\(in oklch,\s*var\(--s-kit-color-text\)\s*(\d+)%,\s*transparent\)/;
	const share = edgePattern.exec(tokens)?.[1];

	for (const theme of THEMES) {
		it(`${theme}: text at ${share ?? '?'}% over surface against surface`, () => {
			expect(share).toBeDefined();
			const text = parseHex(lightDark('text')[theme]);
			const surface = parseHex(lightDark('surface')[theme]);
			const edge = blend(text, Number(share) / 100, surface);
			expect(contrastRatio(edge, surface)).toBeGreaterThanOrEqual(3);
		});
	}
});
