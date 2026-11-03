/** Минуты колонки с шагом: `0, step, 2·step …` меньше 60. */
export function minuteOptions(step: number): number[] {
	const result: number[] = [];
	for (let minute = 0; minute < 60; minute += step) {
		result.push(minute);
	}
	return result;
}
