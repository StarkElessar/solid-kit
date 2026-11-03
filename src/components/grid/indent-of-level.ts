const INDENT_STEP = 16;

/** Отступ строки глубины `level`, px: заголовок группы, строка под группой и узел дерева сдвигаются одинаково. */
export function indentOf(level: number): number {
	return level * INDENT_STEP;
}
