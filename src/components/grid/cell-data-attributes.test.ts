import { describe, expect, it } from 'vitest';

import { cellDataAttributes } from './cell-data-attributes';

describe('cellDataAttributes', () => {
	it('оставляет только data-*, class и style не попадают', () => {
		expect(cellDataAttributes({ 'class': 'x', 'style': { color: 'red' }, 'data-overdue': 'true', 'data-empty': undefined }))
			.toEqual({ 'data-overdue': 'true', 'data-empty': undefined });
	});

	it('служебные атрибуты грида отбрасываются', () => {
		const attributes = { 'data-sticky': '', 'data-sticky-last': '', 'data-align': 'end', 'data-indent': '', 'data-tone': 'danger' };
		expect(cellDataAttributes(attributes)).toEqual({ 'data-tone': 'danger' });
	});
});
