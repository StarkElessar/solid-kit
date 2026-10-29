import styles from './checkbox.module.css';

import { children, createEffect, type JSX, Show, splitProps } from 'solid-js';

import { createControllableSignal } from '../../utils/create-controllable-signal';

export type CheckboxSize = 'sm' | 'md' | 'lg';

export interface CheckboxProps
	extends Omit<
		JSX.InputHTMLAttributes<HTMLInputElement>,
		'class' | 'style' | 'size' | 'type' | 'checked' | 'defaultChecked' | 'onChange' | 'onInput' | 'children'
	> {
	checked?: boolean | undefined;
	defaultChecked?: boolean | undefined;
	onCheckedChange?: ((checked: boolean) => void) | undefined;
	/** Только вид: состоянием владеет вызывающий (после щелчка значение пропа возвращается). */
	indeterminate?: boolean | undefined;
	size?: CheckboxSize | undefined;
	class?: string | undefined;
	style?: JSX.CSSProperties | undefined;
	/** Подпись. */
	children?: JSX.Element;
}

export function Checkbox(props: CheckboxProps): JSX.Element {
	const [local, rest] = splitProps(props, [
		'checked',
		'defaultChecked',
		'onCheckedChange',
		'indeterminate',
		'size',
		'class',
		'style',
		'children'
	]);
	const label = children(() => local.children);

	const [checked, setChecked] = createControllableSignal<boolean>({
		name: 'Checkbox',
		value: () => local.checked,
		defaultValue: () => local.defaultChecked ?? false,
		onChange: (next) => local.onCheckedChange?.(next)
	});

	// indeterminate существует только как DOM-свойство, атрибута у него нет
	let input: HTMLInputElement | undefined;
	createEffect(() => {
		if (input) {
			input.indeterminate = local.indeterminate === true;
		}
	});

	const handleChange: JSX.EventHandler<HTMLInputElement, Event> = (event) => {
		setChecked(event.currentTarget.checked);
		// контролируемый режим: родитель мог не принять значение, тогда флажок возвращается к нему;
		// браузер сам снимает indeterminate после щелчка, возвращаем значение пропа
		if (event.currentTarget.checked !== checked()) {
			event.currentTarget.checked = checked();
		}
		event.currentTarget.indeterminate = local.indeterminate === true;
	};

	return (
		<label
			data-s-kit
			data-s-kit-size={local.size}
			data-disabled={rest.disabled ? '' : undefined}
			class={local.class ? `${styles['root']} ${local.class}` : styles['root']}
			style={local.style}
		>
			<span class={styles['box']}>
				<input
					{...rest}
					type='checkbox'
					class={styles['input']}
					checked={checked()}
					ref={input}
					onChange={handleChange}
				/>
				<svg class={styles['mark']} data-mark='check' viewBox='0 0 16 16' aria-hidden='true'>
					<path
						d='M4 8.5l2.5 2.5L12 5.5'
						fill='none'
						stroke='currentColor'
						stroke-width='2'
						stroke-linecap='round'
						stroke-linejoin='round'
					/>
				</svg>
				<svg class={styles['mark']} data-mark='dash' viewBox='0 0 16 16' aria-hidden='true'>
					<path d='M4.5 8h7' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round'/>
				</svg>
			</span>
			<Show when={label.toArray().length > 0}>
				<span class={styles['label']} data-checkbox-label>{label()}</span>
			</Show>
		</label>
	);
}
