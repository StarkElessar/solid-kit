/** Новый набор с добавленным или убранным id; исходный не меняется. */
export function toggleId(ids: ReadonlySet<string>, id: string): ReadonlySet<string> {
	const next = new Set(ids);

	if (!next.delete(id)) {
		next.add(id);
	}

	return next;
}
