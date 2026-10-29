import { createRoot, createSignal } from 'solid-js';
import { describe, expect, it, vi } from 'vitest';

import { createControllableSignal } from './create-controllable-signal';

function silentWarn() {
	return vi.spyOn(console, 'warn').mockImplementation(() => undefined);
}

describe('createControllableSignal', () => {
	it('uncontrolled: starts from defaultValue, set updates the value and calls onChange', () => {
		createRoot((dispose) => {
			const onChange = vi.fn();
			const [get, set] = createControllableSignal<number>({ name: 'Test', value: () => undefined, defaultValue: () => 1, onChange });
			expect(get()).toBe(1);
			set(2);
			expect(get()).toBe(2);
			expect(onChange).toHaveBeenCalledExactlyOnceWith(2);
			dispose();
		});
	});

	it('controlled: set only calls onChange, the value follows the prop', () => {
		createRoot((dispose) => {
			const [prop, setProp] = createSignal<number | undefined>(5);
			const onChange = vi.fn();
			const [get, set] = createControllableSignal<number>({ name: 'Test', value: prop, defaultValue: () => 0, onChange });
			expect(get()).toBe(5);
			set(6);
			expect(get()).toBe(5);
			expect(onChange).toHaveBeenCalledExactlyOnceWith(6);
			setProp(6);
			expect(get()).toBe(6);
			dispose();
		});
	});

	it('null is a controlled value, not "uncontrolled"', () => {
		createRoot((dispose) => {
			const [get, set] = createControllableSignal<string | null>({ name: 'Test', value: () => null, defaultValue: () => 'x' });
			expect(get()).toBeNull();
			set('y');
			expect(get()).toBeNull();
			dispose();
		});
	});

	it('stores function values as values, not as updaters', () => {
		createRoot((dispose) => {
			const first = (): number => 1;
			const second = (): number => 2;
			const [get, set] = createControllableSignal<() => number>({ name: 'Test', value: () => undefined, defaultValue: () => first });
			set(second);
			expect(get()).toBe(second);
			dispose();
		});
	});

	it('controlled to uncontrolled: keeps the last controlled value and warns once', () => {
		const warn = silentWarn();
		createRoot((dispose) => {
			const [prop, setProp] = createSignal<number | undefined>(5);
			const [get] = createControllableSignal<number>({ name: 'Counter', value: prop, defaultValue: () => 0 });
			expect(get()).toBe(5);
			setProp(undefined);
			expect(get()).toBe(5);
			expect(get()).toBe(5);
			expect(warn).toHaveBeenCalledOnce();
			expect(String(warn.mock.calls[0]?.[0])).toContain('Counter');
			dispose();
		});
	});

	it('uncontrolled to controlled: ignores the new prop and warns once', () => {
		const warn = silentWarn();
		createRoot((dispose) => {
			const [prop, setProp] = createSignal<number | undefined>(undefined);
			const [get] = createControllableSignal<number>({ name: 'Counter', value: prop, defaultValue: () => 1 });
			expect(get()).toBe(1);
			setProp(9);
			expect(get()).toBe(1);
			expect(get()).toBe(1);
			expect(warn).toHaveBeenCalledOnce();
			dispose();
		});
	});

	it('works without onChange', () => {
		createRoot((dispose) => {
			const [get, set] = createControllableSignal<boolean>({ name: 'Test', value: () => undefined, defaultValue: () => false });
			set(true);
			expect(get()).toBe(true);
			dispose();
		});
	});
});
