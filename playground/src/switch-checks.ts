import { blend, contrastRatio, type Rgb } from '../../src/utils/color-math';

import { type CheckResult, resolveColor, type Rgba } from './theme-checks';

function rgb([red, green, blue]: Rgba): Rgb {
	return [red, green, blue];
}

/** Цвет поверх поверхности страницы (дорожка выключенного переключателя полупрозрачна). */
function over(color: Rgba, surface: Rgba): Rgb {
	return blend(rgb(color), color[3] / 255, rgb(surface));
}

/**
 * Роль switch, связь подписи и переключателя, контраст дорожки к поверхности и ползунка к дорожке
 * у каждого переключателя с data-switch-demo.
 */
export function runSwitchChecks(page: HTMLElement): CheckResult[] {
	const results: CheckResult[] = [];
	const check = (name: string, ok: boolean, detail: string): void => {
		results.push({ name, ok, detail });
	};
	const surface = resolveColor(getComputedStyle(page).backgroundColor);

	for (const input of page.querySelectorAll<HTMLInputElement>('[data-switch-demo]')) {
		const id = input.dataset['switchDemo'] ?? '?';
		const root = input.closest('label');
		const thumb = input.parentElement?.querySelector('[data-switch-thumb]');
		if (!root || !thumb) {
			throw new Error(`Playground element is missing in Switch ${id}`);
		}
		check(`Switch ${id}: роль switch`, input.getAttribute('role') === 'switch', `role = ${input.getAttribute('role') ?? 'null'}`);
		check(
			`Switch ${id}: подпись связана с переключателем`,
			root.control === input,
			`label.control = ${root.control?.tagName ?? 'null'}`
		);

		const track = over(resolveColor(getComputedStyle(input).backgroundColor), surface);
		const trackRatio = contrastRatio(track, rgb(surface));
		check(`Switch ${id}: дорожка контрастна к поверхности (3:1)`, trackRatio >= 3, `контраст ${trackRatio.toFixed(2)}:1`);

		const thumbRatio = contrastRatio(rgb(resolveColor(getComputedStyle(thumb).backgroundColor)), track);
		check(`Switch ${id}: ползунок контрастен к дорожке (3:1)`, thumbRatio >= 3, `контраст ${thumbRatio.toFixed(2)}:1`);
	}
	return results;
}
