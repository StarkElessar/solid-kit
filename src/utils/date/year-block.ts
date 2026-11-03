export interface YearBlockCell {
	readonly year: number;
	/** `false` у соседних лет по краям (последний год предыдущего десятилетия и первый следующего). */
	readonly inBlock: boolean;
}

export interface YearBlock {
	readonly cells: readonly YearBlockCell[];
	/** Подпись десятилетия, например «2020–2029». */
	readonly label: string;
}

/** Блок из 12 лет для выбора года: десятилетие, в которое входит `year`, и по одному соседнему году с каждой стороны. */
export function yearBlock(year: number): YearBlock {
	const start = Math.floor(year / 10) * 10;
	const cells = Array.from({ length: 12 }, (_, index) => {
		const cellYear = start - 1 + index;
		return { year: cellYear, inBlock: cellYear >= start && cellYear <= start + 9 };
	});
	return { cells, label: `${start}–${start + 9}` };
}
