/** Строка колонки: `id` это значение (час 0–23 или час на циферблате 0–11 для 12 часов, минута, 0 или 1 для периода). */
export interface TimeRow {
	readonly id: number;
	readonly label: string;
}
