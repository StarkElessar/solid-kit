import type { CheckResult } from './theme-checks';

function tokenPixels(scope: Element, size: string): number {
	return Number.parseFloat(getComputedStyle(scope).getPropertyValue(`--s-kit-control-height-${size}`));
}

/**
 * Критерий 3 раздела 12: высота каждого контрола равна токену его эффективного размера,
 * а верх и низ контролов одного размера в ряду совпадают. Ряд не переносится (flex-wrap: nowrap).
 */
export function runRowChecks(root: ParentNode): CheckResult[] {
	const results: CheckResult[] = [];
	for (const row of root.querySelectorAll<HTMLElement>('[data-row]')) {
		const rowId = row.dataset['row'] ?? '?';
		const bySize = new Map<string, DOMRect[]>();
		for (const control of row.querySelectorAll<HTMLElement>('[data-row-control]')) {
			const size = control.closest('[data-s-kit-size]')?.getAttribute('data-s-kit-size') ?? 'md';
			const rect = control.getBoundingClientRect();
			const expected = tokenPixels(row, size);
			results.push({
				name: `${rowId}: ${control.dataset['rowControl'] ?? '?'} (${size}) имеет высоту токена`,
				ok: Math.abs(rect.height - expected) <= 0.01,
				detail: `высота ${rect.height}px, ожидалось ${expected}px`
			});
			if (control.hasAttribute('data-row-square')) {
				results.push({
					name: `${rowId}: ${control.dataset['rowControl'] ?? '?'} (${size}) квадратная`,
					ok: Math.abs(rect.width - rect.height) <= 0.01,
					detail: `ширина ${rect.width}px, высота ${rect.height}px`
				});
			}
			if (control.hasAttribute('data-row-group')) {
				const offsets = [...control.children].map((child) => {
					const childRect = child.getBoundingClientRect();
					return { height: childRect.height, inset: childRect.top - rect.top };
				});
				results.push({
					name: `${rowId}: ${control.dataset['rowControl'] ?? '?'} (${size}) сегменты на 4 px ниже оболочки и на 2 px от края`,
					ok: offsets.every((item) => Math.abs(item.height - (rect.height - 4)) <= 0.01 && Math.abs(item.inset - 2) <= 0.01),
					detail: offsets.map((item) => `${item.height}px, отступ ${item.inset}px`).join('; ')
				});
			}
			bySize.set(size, [...(bySize.get(size) ?? []), rect]);
		}
		for (const [size, rects] of bySize) {
			const tops = new Set(rects.map((rect) => Math.round(rect.top * 100)));
			const bottoms = new Set(rects.map((rect) => Math.round(rect.bottom * 100)));
			results.push({
				name: `${rowId}: контролы размера ${size} совпадают по верху и низу`,
				ok: rects.length < 2 || (tops.size === 1 && bottoms.size === 1),
				detail: `разных значений верха ${tops.size}, низа ${bottoms.size}`
			});
		}
	}
	return results;
}
