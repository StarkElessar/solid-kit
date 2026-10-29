import { blend, contrastRatio, type Rgb } from '../../src/utils/color-math';

import { type CheckResult, resolveColor, type Rgba } from './theme-checks';

function rgb([red, green, blue]: Rgba): Rgb {
	return [red, green, blue];
}

/** Связь подписи и поля, описание сообщением, размер вложенного поля и контраст сообщения у каждого Field с data-field-demo. */
export function runFieldChecks(page: HTMLElement): CheckResult[] {
	const results: CheckResult[] = [];
	const check = (name: string, ok: boolean, detail: string): void => {
		results.push({ name, ok, detail });
	};
	const surface = resolveColor(getComputedStyle(page).backgroundColor);

	for (const field of page.querySelectorAll<HTMLElement>('[data-field-demo]')) {
		const id = field.dataset['fieldDemo'] ?? '?';
		const label = field.querySelector('label');
		const input = field.querySelector('input');
		if (!label || !input) {
			throw new Error(`Playground element is missing in Field ${id}`);
		}

		check(`Field ${id}: подпись связана с полем`, label.control === input, `label.control = ${label.control?.tagName ?? 'null'}`);

		const describedBy = input.getAttribute('aria-describedby') ?? '';
		const message = describedBy ? document.getElementById(describedBy) : null;
		const text = message?.textContent.trim() ?? '';
		check(
			`Field ${id}: aria-describedby указывает на непустой текст`,
			text !== '',
			`aria-describedby = "${describedBy}", текст "${text}"`
		);

		const contrastName = `Field ${id}: текст сообщения читаем (4.5:1)`;
		if (message) {
			const color = resolveColor(getComputedStyle(message).color);
			const ratio = contrastRatio(blend(rgb(color), color[3] / 255, rgb(surface)), rgb(surface));
			check(contrastName, ratio >= 4.5, `контраст ${ratio.toFixed(2)}:1`);
		}
		else {
			check(contrastName, false, 'сообщение не найдено');
		}

		const size = field.closest('[data-s-kit-size]')?.getAttribute('data-s-kit-size') ?? 'md';
		const expected = Number.parseFloat(getComputedStyle(field).getPropertyValue(`--s-kit-control-height-${size}`));
		const height = input.getBoundingClientRect().height;
		check(
			`Field ${id}: поле внутри (${size}) имеет высоту токена`,
			Math.abs(height - expected) <= 0.01,
			`высота ${height}px, ожидалось ${expected}px`
		);
	}
	return results;
}
