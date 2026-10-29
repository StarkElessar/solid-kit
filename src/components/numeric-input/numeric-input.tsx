import { batch, createEffect, createSignal, type JSX, on, splitProps, untrack } from 'solid-js';

import { createControllableSignal } from '../../utils/create-controllable-signal';
import { Input, type InputProps } from '../input';

import { clamp, countDecimals, formatNumeric, parseNumericText, roundTo, sanitizeNumericText } from './numeric-math';

const SHIFT_STEP_FACTOR = 10;

export interface NumericInputProps
	extends Omit<InputProps, 'value' | 'defaultValue' | 'onValueChange' | 'type' | 'role' | 'inputmode' | 'onKeyDown' | 'onBlur'> {
	value?: number | null | undefined;
	defaultValue?: number | null | undefined;
	onValueChange?: ((value: number | null) => void) | undefined;
	min?: number | undefined;
	max?: number | undefined;
	step?: number | undefined;
	precision?: number | undefined;
	onKeyDown?: JSX.EventHandler<HTMLInputElement, KeyboardEvent> | undefined;
	onBlur?: JSX.EventHandler<HTMLInputElement, FocusEvent> | undefined;
}

export function NumericInput(props: NumericInputProps): JSX.Element {
	const [local, rest] = splitProps(props, [
		'value', 'defaultValue', 'onValueChange', 'min', 'max', 'step', 'precision', 'readOnly', 'onKeyDown', 'onBlur'
	]);

	const step = (): number => local.step ?? 1;
	const precision = (): number => local.precision ?? countDecimals(step());
	const allowNegative = (): boolean => local.min === undefined || local.min < 0;

	const [value, setValue] = createControllableSignal<number | null>({
		name: 'NumericInput',
		value: () => local.value,
		defaultValue: () => local.defaultValue ?? null,
		onChange: (next) => local.onValueChange?.(next)
	});
	// текст хранится отдельно от числа, чтобы промежуточные записи (`-`, `1.`) не терялись
	const [text, setText] = createSignal(formatNumeric(untrack(value)));

	// родитель сменил значение: текст перезаписывается, только если он уже не означает это число
	createEffect(on(value, (next) => {
		if (parseNumericText(text()) !== next) {
			setText(formatNumeric(next));
		}
	}, { defer: true }));

	/** Принять число; в контролируемом режиме родитель может его не принять, тогда текст возвращается к его значению. */
	const accept = (next: number | null, nextText: string): void => {
		batch(() => {
			setText(nextText);
			if (next !== value()) {
				setValue(next);
			}
		});
		if (parseNumericText(text()) !== value()) {
			setText(formatNumeric(value()));
		}
	};

	const handleTextChange = (raw: string): void => {
		const clean = sanitizeNumericText(raw, { precision: precision(), allowNegative: allowNegative() });
		accept(parseNumericText(clean), clean);
	};

	const settle = (next: number): number => roundTo(clamp(next, local.min, local.max), precision());

	/** Фиксация: число приводится к границам и точности, висящий знак очищается. */
	const commit = (): void => {
		const parsed = parseNumericText(text());
		const next = parsed === null ? null : settle(parsed);
		accept(next, formatNumeric(next));
	};

	const handleKeyDown: JSX.EventHandler<HTMLInputElement, KeyboardEvent> = (event) => {
		local.onKeyDown?.(event);
		if (event.defaultPrevented) {
			return;
		}
		if (event.key === 'Enter') {
			commit();
			return;
		}
		if (local.readOnly || (event.key !== 'ArrowUp' && event.key !== 'ArrowDown')) {
			return;
		}
		event.preventDefault();
		const direction = event.key === 'ArrowUp' ? 1 : -1;
		const delta = step() * (event.shiftKey ? SHIFT_STEP_FACTOR : 1) * direction;
		const next = settle((value() ?? 0) + delta);
		accept(next, formatNumeric(next));
	};

	const handleBlur: JSX.EventHandler<HTMLInputElement, FocusEvent> = (event) => {
		local.onBlur?.(event);
		commit();
	};

	return (
		<Input
			{...rest}
			role='spinbutton'
			inputmode={precision() > 0 || allowNegative() ? 'decimal' : 'numeric'}
			readOnly={local.readOnly}
			value={text()}
			onValueChange={handleTextChange}
			onKeyDown={handleKeyDown}
			onBlur={handleBlur}
			aria-valuenow={value() ?? undefined}
			aria-valuemin={local.min}
			aria-valuemax={local.max}
		/>
	);
}
