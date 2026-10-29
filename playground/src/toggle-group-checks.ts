import { contrastRatio, type Rgb } from '../../src/utils/color-math';

import { type CheckResult, resolveColor, type Rgba } from './theme-checks';

function rgb([red, green, blue]: Rgba): Rgb {
	return [red, green, blue];
}

/**
 * Согласованность aria-pressed и data-selected, читаемость текста выбранного сегмента, отличие выбранного от невыбранного
 * (заливка и цвет текста) и неизменность высоты у каждой группы с data-toggle-demo. В группе должны быть выбранный и невыбранный сегменты.
 */
export function runToggleGroupChecks(page: HTMLElement): CheckResult[] {
	const results: CheckResult[] = [];
	const check = (name: string, ok: boolean, detail: string): void => {
		results.push({ name, ok, detail });
	};

	for (const group of page.querySelectorAll<HTMLElement>('[data-toggle-demo]')) {
		const id = group.dataset['toggleDemo'] ?? '?';
		const items = [...group.querySelectorAll<HTMLElement>('button')];
		const selected = items.filter((item) => item.getAttribute('aria-pressed') === 'true');
		const plain = items.filter((item) => item.getAttribute('aria-pressed') === 'false');
		const firstSelected = selected[0];
		const firstPlain = plain[0];
		if (!firstSelected || !firstPlain) {
			throw new Error(`Playground element is missing in ToggleGroup ${id}`);
		}

		check(
			`ToggleGroup ${id}: aria-pressed совпадает с data-selected`,
			items.every((item) => item.hasAttribute('data-selected') === (item.getAttribute('aria-pressed') === 'true')),
			`выбрано ${selected.length} из ${items.length}`
		);

		const ratios = selected.map((item) => {
			const style = getComputedStyle(item);
			return contrastRatio(rgb(resolveColor(style.color)), rgb(resolveColor(style.backgroundColor)));
		});
		const lowest = Math.min(...ratios);
		check(`ToggleGroup ${id}: текст выбранного сегмента читаем (4.5:1)`, lowest >= 4.5, `наименьший контраст ${lowest.toFixed(2)}:1`);

		const selectedStyle = getComputedStyle(firstSelected);
		const plainStyle = getComputedStyle(firstPlain);
		const trackFill = resolveColor(getComputedStyle(group).backgroundColor);
		const fillRatio = contrastRatio(rgb(resolveColor(selectedStyle.backgroundColor)), rgb(trackFill));
		check(
			`ToggleGroup ${id}: выбранный сегмент отличается от невыбранного заливкой и цветом текста`,
			selectedStyle.backgroundColor !== plainStyle.backgroundColor && selectedStyle.color !== plainStyle.color,
			`заливка к оболочке ${fillRatio.toFixed(2)}:1, текст ${selectedStyle.color} и ${plainStyle.color}`
		);

		const selectedHeight = firstSelected.getBoundingClientRect().height;
		const plainHeight = firstPlain.getBoundingClientRect().height;
		check(
			`ToggleGroup ${id}: выбор не меняет высоту сегмента`,
			Math.abs(selectedHeight - plainHeight) <= 0.01,
			`выбранный ${selectedHeight}px, невыбранный ${plainHeight}px`
		);
	}
	return results;
}
