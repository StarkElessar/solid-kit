import type { MaskField } from './mask-field';

/** Описание маскируемого текста: части по порядку, разделители между ними и буквы суффикса (период AM и PM). */
export interface MaskSpec {
	readonly fields: readonly MaskField[];
	/** Разделители между частями, на один меньше, чем частей. */
	readonly separators: readonly string[];
	/** Допустимые буквы суффикса после последней части (нижний регистр); пусто, если суффикса нет. */
	readonly suffixLetters: string;
}
