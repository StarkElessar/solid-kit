import type { MaskSpec } from './mask-spec';
import { maskText } from './mask-text';

/** Функция маски по описанию; `null` (маска выключена или для локали не поддерживается) даёт `undefined`: поле остаётся свободным. */
export function createMask(spec: MaskSpec | null): ((next: string, previous: string) => string) | undefined {
	return spec ? (next, previous) => maskText(next, previous, spec) : undefined;
}
