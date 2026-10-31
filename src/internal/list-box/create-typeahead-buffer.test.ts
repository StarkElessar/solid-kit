import { createRoot } from 'solid-js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createTypeaheadBuffer } from './create-typeahead-buffer';

describe('createTypeaheadBuffer', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('накапливает символы', () => {
		const buffer = createTypeaheadBuffer();
		expect(buffer.push('a')).toBe('a');
		expect(buffer.push('b')).toBe('ab');
		expect(buffer.value()).toBe('ab');
	});

	it('сбрасывается после 500 мс без нажатий', () => {
		const buffer = createTypeaheadBuffer();
		buffer.push('a');
		vi.advanceTimersByTime(499);
		expect(buffer.value()).toBe('a');
		vi.advanceTimersByTime(1);
		expect(buffer.value()).toBe('');
		expect(buffer.push('c')).toBe('c');
	});

	it('каждое нажатие продлевает таймер', () => {
		const buffer = createTypeaheadBuffer();
		buffer.push('a');
		vi.advanceTimersByTime(400);
		buffer.push('b');
		vi.advanceTimersByTime(400);
		expect(buffer.value()).toBe('ab');
	});

	it('clear обнуляет буфер', () => {
		const buffer = createTypeaheadBuffer();
		buffer.push('a');
		buffer.clear();
		expect(buffer.value()).toBe('');
	});

	it('таймаут задаётся параметром', () => {
		const buffer = createTypeaheadBuffer(100);
		buffer.push('a');
		vi.advanceTimersByTime(100);
		expect(buffer.value()).toBe('');
	});

	it('после уничтожения владельца таймер снят', () => {
		const clear = vi.spyOn(globalThis, 'clearTimeout');
		createRoot((dispose) => {
			const buffer = createTypeaheadBuffer();
			buffer.push('a');
			dispose();
			expect(buffer.value()).toBe('');
		});
		expect(clear).toHaveBeenCalled();
	});
});
