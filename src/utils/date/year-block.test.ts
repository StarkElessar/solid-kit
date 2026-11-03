import { describe, expect, it } from 'vitest';

import { yearBlock } from './year-block';

describe('yearBlock', () => {
	it('2026: годы 2019…2030, свои только 2020–2029', () => {
		const block = yearBlock(2026);
		expect(block.cells.map((cell) => cell.year)).toEqual([2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030]);
		expect(block.cells.filter((cell) => cell.inBlock).map((cell) => cell.year)).toEqual([
			2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029
		]);
		expect(block.label).toBe('2020–2029');
	});

	it('границы десятилетия дают тот же блок', () => {
		expect(yearBlock(2020)).toEqual(yearBlock(2029));
		expect(yearBlock(2030).label).toBe('2030–2039');
	});

	it('начало эры: годы за пределами отдаются как есть', () => {
		const block = yearBlock(5);
		expect(block.cells[0]).toEqual({ year: -1, inBlock: false });
		expect(block.label).toBe('0–9');
	});
});
