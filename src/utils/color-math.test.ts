import { describe, expect, it } from 'vitest';

import { blend, contrastRatio, parseHex, relativeLuminance } from './color-math';

describe('color-math', () => {
	it('parses long and short hex', () => {
		expect(parseHex('#0071e3')).toEqual([0, 113, 227]);
		expect(parseHex('#fff')).toEqual([255, 255, 255]);
	});

	it('rejects non-hex input', () => {
		expect(() => parseHex('red')).toThrow('Not a hex colour');
	});

	it('gives luminance 1 for white and 0 for black', () => {
		expect(relativeLuminance([255, 255, 255])).toBeCloseTo(1, 10);
		expect(relativeLuminance([0, 0, 0])).toBe(0);
	});

	it('gives 21:1 for black on white and 1:1 for equal colours', () => {
		expect(contrastRatio([0, 0, 0], [255, 255, 255])).toBeCloseTo(21, 10);
		expect(contrastRatio([10, 20, 30], [10, 20, 30])).toBe(1);
	});

	it('is symmetric', () => {
		expect(contrastRatio([0, 113, 227], [255, 255, 255])).toBe(contrastRatio([255, 255, 255], [0, 113, 227]));
	});

	it('blends with alpha in sRGB', () => {
		expect(blend([0, 0, 0], 0.5, [255, 255, 255])).toEqual([127.5, 127.5, 127.5]);
		expect(blend([10, 20, 30], 1, [255, 255, 255])).toEqual([10, 20, 30]);
	});
});
