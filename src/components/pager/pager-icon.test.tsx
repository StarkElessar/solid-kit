import { cleanup, render } from '@solidjs/testing-library';
import { afterEach, describe, expect, it } from 'vitest';

import { PagerIcon } from './pager-icon';
import { PAGER_ICON_PATHS } from './pager-icon-paths';

afterEach(cleanup);

describe('PagerIcon', () => {
	it('рисует path из объекта по имени, скрыт от скринридера, цвет текущий', () => {
		const { container } = render(() => <PagerIcon name='next'/>);
		const svg = container.querySelector('svg');
		const path = container.querySelector('path');
		expect(svg?.getAttribute('aria-hidden')).toBe('true');
		expect(svg?.getAttribute('viewBox')).toBe('0 0 16 16');
		expect(path?.getAttribute('d')).toBe(PAGER_ICON_PATHS.next);
		expect(path?.getAttribute('stroke')).toBe('currentColor');
	});

	it('у каждого имени своя непустая геометрия', () => {
		const paths = Object.values(PAGER_ICON_PATHS);
		expect(paths).toHaveLength(5);
		expect(new Set(paths).size).toBe(5);
		expect(paths.every((path) => path.length > 0)).toBe(true);
	});

	it('передаёт класс', () => {
		const { container } = render(() => <PagerIcon name='refresh' class='x'/>);
		expect(container.querySelector('svg')?.getAttribute('class')).toBe('x');
	});
});
