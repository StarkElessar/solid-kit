import type { CheckResult } from './theme-checks';

/** Ожидаемые `aria-valuemin` и `aria-valuemax` каждого демо (`null`: атрибута нет). */
const EXPECTED_RANGE: Readonly<Record<string, { min: string | null; max: string | null }>> = {
	plain: { min: null, max: null },
	range: { min: '0', max: '10' },
	decimal: { min: null, max: null },
	invalid: { min: null, max: '10' }
};

/** Роль spinbutton, `aria-valuenow` по тексту и границы диапазона в ARIA у каждого поля с data-numeric-demo. */
export function runNumericInputChecks(page: HTMLElement): CheckResult[] {
	const results: CheckResult[] = [];
	const check = (name: string, ok: boolean, detail: string): void => {
		results.push({ name, ok, detail });
	};

	for (const input of page.querySelectorAll<HTMLInputElement>('[data-numeric-demo]')) {
		const id = input.dataset['numericDemo'] ?? '?';
		const expected = EXPECTED_RANGE[id];
		if (!expected) {
			throw new Error(`Unknown NumericInput demo: ${id}`);
		}
		check(
			`NumericInput ${id}: роль spinbutton`,
			input.getAttribute('role') === 'spinbutton',
			`role = ${input.getAttribute('role') ?? 'null'}`
		);

		const now = input.getAttribute('aria-valuenow');
		check(
			`NumericInput ${id}: aria-valuenow совпадает с текстом`,
			now === String(Number(input.value)),
			`aria-valuenow = ${now ?? 'null'}, текст = "${input.value}"`
		);

		const min = input.getAttribute('aria-valuemin');
		const max = input.getAttribute('aria-valuemax');
		check(
			`NumericInput ${id}: границы диапазона в ARIA`,
			min === expected.min && max === expected.max,
			`min = ${min ?? 'null'}, max = ${max ?? 'null'}`
		);
	}
	return results;
}
