import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library';
import { createSignal } from 'solid-js';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { NumericInput } from './numeric-input';

afterEach(cleanup);

function field(name = 'Число'): HTMLInputElement {
	return screen.getByRole<HTMLInputElement>('spinbutton', { name });
}

function typeInto(input: HTMLElement, text: string): void {
	(input as HTMLInputElement).value = text;
	fireEvent.input(input);
}

/** Возвращает false, если обработчик вызвал preventDefault. */
function press(input: HTMLElement, key: string, init: KeyboardEventInit = {}): boolean {
	return fireEvent.keyDown(input, { key, ...init });
}

describe('NumericInput', () => {
	it('renders a text input with the spinbutton role and the kit root attribute', () => {
		render(() => <NumericInput aria-label='Число'/>);
		const input = field();
		expect(input.type).toBe('text');
		expect(input.hasAttribute('data-s-kit')).toBe(true);
		expect(input.getAttribute('inputmode')).toBe('decimal');
		expect(input.value).toBe('');
		expect(input.hasAttribute('aria-valuenow')).toBe(false);
	});

	it('asks for the numeric keypad when only non-negative integers are possible', () => {
		render(() => <NumericInput aria-label='Число' min={0}/>);
		expect(field().getAttribute('inputmode')).toBe('numeric');
	});

	it('mirrors the value and the range in the aria attributes', () => {
		render(() => <NumericInput aria-label='Число' min={0} max={10} defaultValue={5}/>);
		const input = field();
		expect(input.value).toBe('5');
		expect(input.getAttribute('aria-valuenow')).toBe('5');
		expect(input.getAttribute('aria-valuemin')).toBe('0');
		expect(input.getAttribute('aria-valuemax')).toBe('10');
	});

	it('reports a typed number', () => {
		const onValueChange = vi.fn();
		render(() => <NumericInput aria-label='Число' defaultValue={3} onValueChange={onValueChange}/>);
		const input = field();
		expect(input.value).toBe('3');
		typeInto(input, '12');
		expect(input.value).toBe('12');
		expect(onValueChange).toHaveBeenLastCalledWith(12);
	});

	it('drops the characters that are not part of a number', () => {
		const onValueChange = vi.fn();
		render(() => <NumericInput aria-label='Число' onValueChange={onValueChange}/>);
		const input = field();
		typeInto(input, 'a1b2');
		expect(input.value).toBe('12');
		expect(onValueChange).toHaveBeenLastCalledWith(12);
	});

	it('accepts a comma and keeps the fraction within the precision taken from the step', () => {
		const onValueChange = vi.fn();
		render(() => <NumericInput aria-label='Число' step={0.1} onValueChange={onValueChange}/>);
		const input = field();
		typeInto(input, '1,5');
		expect(input.value).toBe('1.5');
		expect(onValueChange).toHaveBeenLastCalledWith(1.5);
		typeInto(input, '1.55');
		expect(input.value).toBe('1.5');
		expect(onValueChange).toHaveBeenCalledTimes(1);
	});

	it('takes the precision from the precision prop over the step', () => {
		render(() => <NumericInput aria-label='Число' step={1} precision={2}/>);
		const input = field();
		typeInto(input, '1.999');
		expect(input.value).toBe('1.99');
	});

	it('cuts the fraction when the step is an integer', () => {
		render(() => <NumericInput aria-label='Число'/>);
		const input = field();
		typeInto(input, '1.99');
		expect(input.value).toBe('1');
	});

	it('keeps partial text while typing and reports null for a bare sign', () => {
		const onValueChange = vi.fn();
		render(() => <NumericInput aria-label='Число' step={0.1} defaultValue={5} onValueChange={onValueChange}/>);
		const input = field();
		typeInto(input, '-');
		expect(input.value).toBe('-');
		expect(onValueChange).toHaveBeenLastCalledWith(null);
		typeInto(input, '1.');
		expect(input.value).toBe('1.');
		expect(onValueChange).toHaveBeenLastCalledWith(1);
	});

	it('ignores the minus sign when min is not negative', () => {
		render(() => <NumericInput aria-label='Число' min={0}/>);
		const input = field();
		typeInto(input, '-5');
		expect(input.value).toBe('5');
	});

	it('clamps and rounds the number when the field loses focus', () => {
		const onValueChange = vi.fn();
		render(() => <NumericInput aria-label='Число' min={0} max={10} onValueChange={onValueChange}/>);
		const input = field();
		typeInto(input, '50');
		expect(onValueChange).toHaveBeenLastCalledWith(50);
		fireEvent.blur(input);
		expect(input.value).toBe('10');
		expect(onValueChange).toHaveBeenLastCalledWith(10);
		expect(input.getAttribute('aria-valuenow')).toBe('10');
	});

	it('commits on Enter without preventing the default action', () => {
		render(() => <NumericInput aria-label='Число' max={10}/>);
		const input = field();
		typeInto(input, '99');
		expect(press(input, 'Enter')).toBe(true);
		expect(input.value).toBe('10');
	});

	it('clears a dangling sign on blur', () => {
		const onValueChange = vi.fn();
		render(() => <NumericInput aria-label='Число' defaultValue={5} onValueChange={onValueChange}/>);
		const input = field();
		typeInto(input, '-');
		fireEvent.blur(input);
		expect(input.value).toBe('');
		expect(onValueChange).toHaveBeenLastCalledWith(null);
	});

	it('steps by the step on ArrowUp and ArrowDown and by ten steps with Shift', () => {
		const onValueChange = vi.fn();
		render(() => <NumericInput aria-label='Число' step={2} defaultValue={5} onValueChange={onValueChange}/>);
		const input = field();
		expect(press(input, 'ArrowUp')).toBe(false);
		expect(input.value).toBe('7');
		press(input, 'ArrowDown');
		expect(input.value).toBe('5');
		press(input, 'ArrowUp', { shiftKey: true });
		expect(input.value).toBe('25');
		expect(onValueChange).toHaveBeenLastCalledWith(25);
	});

	it('stops at min and max and does not report an unchanged value', () => {
		const onValueChange = vi.fn();
		render(() => <NumericInput aria-label='Число' min={0} max={3} defaultValue={2} onValueChange={onValueChange}/>);
		const input = field();
		press(input, 'ArrowUp');
		press(input, 'ArrowUp');
		expect(input.value).toBe('3');
		expect(onValueChange).toHaveBeenCalledTimes(1);
	});

	it('starts from zero when the field is empty', () => {
		render(() => (
			<>
				<NumericInput aria-label='Вверх' step={5}/>
				<NumericInput aria-label='Вниз' step={5}/>
				<NumericInput aria-label='От нуля' step={5} min={0}/>
			</>
		));
		press(field('Вверх'), 'ArrowUp');
		press(field('Вниз'), 'ArrowDown');
		press(field('От нуля'), 'ArrowDown');
		expect(field('Вверх').value).toBe('5');
		expect(field('Вниз').value).toBe('-5');
		expect(field('От нуля').value).toBe('0');
	});

	it('rounds the float noise of a fractional step', () => {
		render(() => <NumericInput aria-label='Число' step={0.1} defaultValue={0.2}/>);
		const input = field();
		press(input, 'ArrowUp');
		expect(input.value).toBe('0.3');
	});

	it('ignores the arrows when readOnly', () => {
		render(() => <NumericInput aria-label='Число' readOnly defaultValue={5}/>);
		const input = field();
		expect(press(input, 'ArrowUp')).toBe(true);
		expect(input.value).toBe('5');
	});

	it('follows the parent value and writes typed numbers back', () => {
		let setExternal: (next: number | null) => void = () => undefined;
		render(() => {
			const [value, setValue] = createSignal<number | null>(1);
			setExternal = setValue;
			return <NumericInput aria-label='Число' value={value()} onValueChange={(next) => setValue(next)}/>;
		});
		const input = field();
		expect(input.value).toBe('1');
		typeInto(input, '7');
		expect(input.value).toBe('7');
		setExternal(9);
		expect(input.value).toBe('9');
		setExternal(null);
		expect(input.value).toBe('');
	});

	it('returns the text to the parent value when the parent refuses the number', () => {
		const onValueChange = vi.fn();
		render(() => <NumericInput aria-label='Число' value={3} onValueChange={onValueChange}/>);
		const input = field();
		typeInto(input, '8');
		expect(onValueChange).toHaveBeenLastCalledWith(8);
		expect(input.value).toBe('3');
	});

	it('treats null as a controlled empty value', () => {
		const onValueChange = vi.fn();
		render(() => <NumericInput aria-label='Число' value={null} onValueChange={onValueChange}/>);
		const input = field();
		expect(input.value).toBe('');
		typeInto(input, '4');
		expect(onValueChange).toHaveBeenLastCalledWith(4);
		expect(input.value).toBe('');
	});

	it('calls the own key and blur handlers and lets the key handler cancel the step', () => {
		const onKeyDown = vi.fn((event: KeyboardEvent) => {
			event.preventDefault();
		});
		const onBlur = vi.fn();
		render(() => <NumericInput aria-label='Число' defaultValue={5} onKeyDown={onKeyDown} onBlur={onBlur}/>);
		const input = field();
		press(input, 'ArrowUp');
		expect(onKeyDown).toHaveBeenCalledTimes(1);
		expect(input.value).toBe('5');
		fireEvent.blur(input);
		expect(onBlur).toHaveBeenCalledTimes(1);
	});

	it('passes size, class, style and aria-invalid to the field', () => {
		render(() => (
			<NumericInput aria-label='Число' size='lg' class='extra' style={{ 'inline-size': '8rem' }} aria-invalid='true'/>
		));
		const input = field();
		expect(input.getAttribute('data-s-kit-size')).toBe('lg');
		expect(input.classList.contains('extra')).toBe(true);
		expect(input.style.inlineSize).toBe('8rem');
		expect(input.getAttribute('aria-invalid')).toBe('true');
	});
});
