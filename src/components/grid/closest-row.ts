/** Строка тела, в которую попало событие: `undefined` для spacer-строк, шапки и целей вне строки. Интерактивность цели не проверяется. */
export function closestRow(target: EventTarget | null): { tr: HTMLTableRowElement; index: number } | undefined {
	const tr = target instanceof Element ? target.closest<HTMLTableRowElement>('tr[data-index]') : null;
	return tr === null ? undefined : { tr, index: Number(tr.dataset['index']) };
}
