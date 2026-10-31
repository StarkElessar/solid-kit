import type { ListKey } from './list-row';

/** `id` опции для `aria-activedescendant`: число и строка с одним значением получают разные `id`, символы ключа кодируются. */
export function optionId(listId: string, key: ListKey): string {
	return `${listId}-opt-${typeof key === 'number' ? 'n' : 's'}${encodeURIComponent(String(key))}`;
}
