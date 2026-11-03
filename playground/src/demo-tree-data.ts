export interface TreeDoc {
	readonly id: number;
	readonly parentId: number | null;
	readonly title: string;
	readonly type: string;
	readonly owner: string;
	readonly time: string;
	readonly comment: string;
	/** Есть ли у документа вложенные (для ленивого режима: дети в данных могут быть ещё не загружены). */
	readonly hasKids: boolean;
}

/** Число корневых разделов в наборе. */
export const TREE_ROOTS = 20;
const BRANCHING = 6;
const TYPES = ['Регламент', 'Инструкция', 'Политика', 'Шаблон', 'Протокол'] as const;
const OWNERS = ['Отдел продаж', 'Поддержка', 'Бухгалтерия', 'Логистика'] as const;
const COMMENTS = ['Актуален', 'На согласовании', 'Нужна проверка юриста', 'Черновик'] as const;

/**
 * Детерминированное дерево вымышленных документов без сети и без Math.random. Первые `TREE_ROOTS` узлов это корни, у узла `i` дети
 * `6i + TREE_ROOTS … 6i + TREE_ROOTS + 5`: родитель всегда идёт раньше детей, глубина до пяти уровней на двадцати тысячах узлов.
 */
export function makeTreeDocs(count: number): readonly TreeDoc[] {
	return Array.from({ length: count }, (_, index) => {
		const type = TYPES[index % TYPES.length] ?? 'Регламент';
		const minutes = (index * 37) % (24 * 60);
		return {
			id: index + 1,
			parentId: index < TREE_ROOTS ? null : Math.floor((index - TREE_ROOTS) / BRANCHING) + 1,
			title: index < TREE_ROOTS ? `Раздел ${index + 1}` : `${type} ${index + 1}`,
			type: index < TREE_ROOTS ? 'Раздел' : type,
			owner: OWNERS[index % OWNERS.length] ?? 'Отдел продаж',
			time: `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`,
			comment: COMMENTS[index % COMMENTS.length] ?? 'Актуален',
			hasKids: BRANCHING * index + TREE_ROOTS < count
		};
	});
}
