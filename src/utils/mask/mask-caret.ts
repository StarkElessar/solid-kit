const DIGIT = /\d/;
const SEPARATOR = /[\s.,/\\:;-]/;

/** Сколько цифр стоит левее позиции `caret`. */
export function digitsBefore(text: string, caret: number): number {
	let count = 0;
	for (let index = 0; index < Math.min(caret, text.length); index += 1) {
		if (DIGIT.test(text.charAt(index))) {
			count += 1;
		}
	}
	return count;
}

/** Позиция после `digits`-й цифры текста; следующие за ней разделители пропускаются, чтобы курсор встал у следующей части. */
export function caretAfterDigits(text: string, digits: number): number {
	if (digits <= 0) {
		return 0;
	}
	let seen = 0;
	let position = 0;
	for (let index = 0; index < text.length && seen < digits; index += 1) {
		if (DIGIT.test(text.charAt(index))) {
			seen += 1;
			position = index + 1;
		}
	}
	while (position < text.length && SEPARATOR.test(text.charAt(position))) {
		position += 1;
	}
	return position;
}
