export type Rgb = readonly [red: number, green: number, blue: number];

/** `#rgb` или `#rrggbb` в байты sRGB. */
export function parseHex(hex: string): Rgb {
	const digits = hex.replace('#', '');
	const full = digits.length === 3 ? Array.from(digits, (digit) => digit + digit).join('') : digits;
	if (!/^[0-9a-f]{6}$/i.test(full)) {
		throw new Error(`Not a hex colour: ${hex}`);
	}
	return [parseInt(full.slice(0, 2), 16), parseInt(full.slice(2, 4), 16), parseInt(full.slice(4, 6), 16)];
}

function linearize(channel: number): number {
	const value = channel / 255;
	return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

/** Относительная яркость по WCAG 2.x. */
export function relativeLuminance([red, green, blue]: Rgb): number {
	return 0.2126 * linearize(red) + 0.7152 * linearize(green) + 0.0722 * linearize(blue);
}

/** Контраст по WCAG 2.x: от 1 до 21. */
export function contrastRatio(first: Rgb, second: Rgb): number {
	const a = relativeLuminance(first);
	const b = relativeLuminance(second);
	return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

/** Цвет с прозрачностью `alpha` поверх непрозрачного фона (наложение в sRGB, как у браузера). */
export function blend(foreground: Rgb, alpha: number, background: Rgb): Rgb {
	const mix = (front: number, back: number): number => front * alpha + back * (1 - alpha);
	return [mix(foreground[0], background[0]), mix(foreground[1], background[1]), mix(foreground[2], background[2])];
}
