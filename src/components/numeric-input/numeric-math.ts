export interface SanitizeOptions {
	/** Знаков после запятой; при 0 разделитель и дробная часть отбрасываются. */
	precision: number;
	allowNegative: boolean;
}

/** Число знаков после точки в записи числа (шаг 0.25 даёт 2). Экспоненциальная запись (1e-7) не поддерживается и даёт 0. */
export function countDecimals(value: number): number {
	const text = String(value);
	const dot = text.indexOf('.');
	return dot === -1 ? 0 : text.length - dot - 1;
}

/** Округление до `precision` знаков; убирает шум чисел с плавающей точкой и отрицательный ноль. */
export function roundTo(value: number, precision: number): number {
	return Number(value.toFixed(precision)) + 0;
}

export function clamp(value: number, min: number | undefined, max: number | undefined): number {
	let result = value;
	if (max !== undefined && result > max) {
		result = max;
	}
	if (min !== undefined && result < min) {
		result = min;
	}
	return result;
}

/**
 * Оставляет в тексте только записанное число: цифры, первый разделитель (запятая превращается в точку)
 * и минус первым знаком. Промежуточные записи (`-`, `1.`) сохраняются.
 */
export function sanitizeNumericText(text: string, options: SanitizeOptions): string {
	const normalized = text.trim().replace(/,/g, '.');
	const sign = options.allowNegative && normalized.startsWith('-') ? '-' : '';
	const [integerPart = '', ...fractionParts] = normalized.replace(/[^\d.]/g, '').split('.');
	if (fractionParts.length === 0 || options.precision <= 0) {
		return `${sign}${integerPart}`;
	}
	return `${sign}${integerPart}.${fractionParts.join('').slice(0, options.precision)}`;
}

/** Число из текста; `null`, если в тексте нет ни одной цифры (`''`, `-`, `.`). */
export function parseNumericText(text: string): number | null {
	if (!/\d/.test(text)) {
		return null;
	}
	const value = Number(text);
	return Number.isFinite(value) ? value : null;
}

export function formatNumeric(value: number | null): string {
	return value === null ? '' : String(value);
}
