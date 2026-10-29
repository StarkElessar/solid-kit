/** Значение кодируется: пробел в id ломает aria-controls и aria-labelledby (это списки через пробел). */
export function tabId(baseId: string, value: string): string {
	return `${baseId}-tab-${encodeURIComponent(value)}`;
}

export function panelId(baseId: string, value: string): string {
	return `${baseId}-panel-${encodeURIComponent(value)}`;
}
