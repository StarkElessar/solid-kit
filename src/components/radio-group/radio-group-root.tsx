import styles from './radio-group.module.css';

import { createUniqueId, type JSX, mergeProps, splitProps } from 'solid-js';

import { createControllableSignal } from '../../utils/create-controllable-signal';

import { RadioGroupContext, type RadioGroupContextValue } from './radio-group-context';

export type RadioGroupSize = 'sm' | 'md' | 'lg';
export type RadioGroupOrientation = 'vertical' | 'horizontal';

export interface RadioGroupRootProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'class' | 'style'> {
	value?: string | null | undefined;
	defaultValue?: string | null | undefined;
	onValueChange?: ((value: string) => void) | undefined;
	name?: string | undefined;
	disabled?: boolean | undefined;
	orientation?: RadioGroupOrientation | undefined;
	size?: RadioGroupSize | undefined;
	class?: string | undefined;
	style?: JSX.CSSProperties | undefined;
}

export function RadioGroupRoot(props: RadioGroupRootProps): JSX.Element {
	const merged = mergeProps({ orientation: 'vertical' } as const, props);
	const [local, rest] = splitProps(merged, [
		'value',
		'defaultValue',
		'onValueChange',
		'name',
		'disabled',
		'orientation',
		'size',
		'class',
		'style'
	]);
	const generatedName = createUniqueId();
	let root: HTMLDivElement | undefined;

	const [value, setValue] = createControllableSignal<string | null>({
		name: 'RadioGroup',
		value: () => local.value,
		defaultValue: () => local.defaultValue ?? null,
		onChange: (next) => {
			if (next !== null) {
				local.onValueChange?.(next);
			}
		}
	});

	// контролируемый режим: браузер уже перенёс выбор, а родитель мог его не принять, тогда радио возвращаются к значению родителя
	const syncDom = (): void => {
		for (const input of root?.querySelectorAll<HTMLInputElement>('input[type="radio"]') ?? []) {
			input.checked = input.value === value();
		}
	};

	const context: RadioGroupContextValue = {
		get name() {
			return local.name ?? generatedName;
		},
		isSelected: (itemValue) => value() === itemValue,
		select: (itemValue) => {
			setValue(itemValue);
			syncDom();
		},
		disabled: () => local.disabled === true
	};

	return (
		<RadioGroupContext.Provider value={context}>
			<div
				role='radiogroup'
				{...rest}
				ref={root}
				data-s-kit
				data-s-kit-size={local.size}
				data-orientation={local.orientation}
				class={local.class ? `${styles['root']} ${local.class}` : styles['root']}
				style={local.style}
			/>
		</RadioGroupContext.Provider>
	);
}
