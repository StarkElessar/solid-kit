/** Выбирает значение из списка допустимых по строке из DOM; иначе запасное. */
export function pick<T extends string>(options: readonly T[], value: string, fallback: T): T {
	return options.find((option) => option === value) ?? fallback;
}
