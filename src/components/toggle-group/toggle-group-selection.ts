export type ToggleGroupMode = 'single' | 'multi';

/** Значение пропса в список выбранных. `undefined` остаётся `undefined` («не контролируется»), `null` это пустой выбор. */
export function toSelection(value: string | null | readonly string[] | undefined): readonly string[] | undefined {
	if (value === undefined) {
		return undefined;
	}
	if (value === null) {
		return [];
	}
	return typeof value === 'string' ? [value] : value;
}

/** Выбор после щелчка по сегменту; `undefined`, если выбор не меняется (повторный щелчок по выбранному в single). */
export function nextSelection(mode: ToggleGroupMode, current: readonly string[], value: string): readonly string[] | undefined {
	const selected = current.includes(value);
	if (mode === 'single') {
		return selected ? undefined : [value];
	}
	return selected ? current.filter((item) => item !== value) : [...current, value];
}
