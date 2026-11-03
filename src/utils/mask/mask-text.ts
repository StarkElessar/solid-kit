import type { MaskSpec } from './mask-spec';

const DIGIT = /\d/;
const SEPARATOR = /[\s.,/\\:;-]/;
const MAX_SUFFIX = 4;

/**
 * Приводит набранный текст к допустимому: оставляет цифры, ставит разделители и дополняет части нулями (спек маски, раздел 2).
 * Значения не проверяются. Удаление (новый текст это начало прежнего) не добавляет разделители обратно.
 */
export function maskText(raw: string, previous: string, spec: MaskSpec): string {
	const last = spec.fields.length - 1;
	const deleting = raw.length < previous.length && previous.startsWith(raw);
	const buffers = spec.fields.map(() => '');
	let index = 0;
	let suffix = '';

	const closePart = (): void => {
		const field = spec.fields[index];
		if (field?.pad) {
			buffers[index] = (buffers[index] ?? '').padStart(field.width, '0');
		}
		index += 1;
	};
	const advanceIfDone = (): void => {
		const field = spec.fields[index];
		const text = buffers[index] ?? '';
		if (!field || index >= last) {
			return;
		}
		if (text.length === field.width) {
			index += 1;
		}
		else if (text.length === 1 && field.maxFirstDigit !== undefined && Number(text) > field.maxFirstDigit) {
			closePart();
		}
	};
	const isSuffixLetter = (char: string): boolean => spec.suffixLetters.includes(char.toLowerCase()) && !SEPARATOR.test(char);

	for (const char of raw) {
		if (suffix !== '' || (isSuffixLetter(char) && !DIGIT.test(char) && buffers[0] !== '')) {
			if ((isSuffixLetter(char) || (char === '.' && suffix !== '')) && suffix.length < MAX_SUFFIX) {
				suffix += char;
			}
		}
		else if (DIGIT.test(char)) {
			if ((buffers[index] ?? '').length === spec.fields[index]?.width) {
				if (index === last) {
					continue;
				}
				index += 1;
			}
			buffers[index] = `${buffers[index] ?? ''}${char}`;
			if (!deleting) {
				advanceIfDone();
			}
		}
		else if (SEPARATOR.test(char) && (buffers[index] ?? '') !== '' && index < last) {
			closePart();
		}
	}

	// с суффиксом незавершённый разделитель в конце лишний (`11pm` даёт `11 pm`)
	const lastFilled = suffix === '' ? index : buffers.findLastIndex((buffer) => buffer !== '');
	const text = buffers
		.slice(0, lastFilled + 1)
		.map((buffer, position) => (position === 0 ? buffer : `${spec.separators[position - 1] ?? ''}${buffer}`))
		.join('');
	return suffix === '' ? text : `${text} ${suffix}`;
}
