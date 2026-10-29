import { describe, expect, it } from 'vitest';

import { nextSelection, toSelection } from './toggle-group-selection';

describe('toSelection', () => {
	it('keeps undefined so that the group stays uncontrolled', () => {
		expect(toSelection(undefined)).toBeUndefined();
	});

	it('turns null into an empty selection', () => {
		expect(toSelection(null)).toEqual([]);
	});

	it('turns a single value into a one-item list', () => {
		expect(toSelection('week')).toEqual(['week']);
	});

	it('keeps a list as it is', () => {
		const list = ['day', 'month'];
		expect(toSelection(list)).toBe(list);
	});
});

describe('nextSelection in single mode', () => {
	it('selects the clicked item', () => {
		expect(nextSelection('single', [], 'day')).toEqual(['day']);
	});

	it('replaces the previous selection', () => {
		expect(nextSelection('single', ['day'], 'week')).toEqual(['week']);
	});

	it('does not change anything when the selected item is clicked again', () => {
		expect(nextSelection('single', ['day'], 'day')).toBeUndefined();
	});
});

describe('nextSelection in multi mode', () => {
	it('adds the clicked item at the end', () => {
		expect(nextSelection('multi', ['day'], 'month')).toEqual(['day', 'month']);
	});

	it('removes the clicked item when it is selected', () => {
		expect(nextSelection('multi', ['day', 'month'], 'day')).toEqual(['month']);
	});

	it('does not mutate the current list', () => {
		const current = ['day'];
		nextSelection('multi', current, 'month');
		nextSelection('multi', current, 'day');
		expect(current).toEqual(['day']);
	});
});
