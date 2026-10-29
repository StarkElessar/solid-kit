import styles from './switch.module.css';

import { children, type JSX, Show, splitProps } from 'solid-js';

import { createControllableSignal } from '../../utils/create-controllable-signal';

export type SwitchSize = 'sm' | 'md' | 'lg';

export interface SwitchProps
	extends Omit<
		JSX.InputHTMLAttributes<HTMLInputElement>,
		'class' | 'style' | 'size' | 'type' | 'role' | 'checked' | 'defaultChecked' | 'onChange' | 'onInput' | 'children'
	> {
	checked?: boolean | undefined;
	defaultChecked?: boolean | undefined;
	onCheckedChange?: ((checked: boolean) => void) | undefined;
	size?: SwitchSize | undefined;
	class?: string | undefined;
	style?: JSX.CSSProperties | undefined;
	/** Подпись. */
	children?: JSX.Element;
}

export function Switch(props: SwitchProps): JSX.Element {
	const [local, rest] = splitProps(props, [
		'checked',
		'defaultChecked',
		'onCheckedChange',
		'size',
		'class',
		'style',
		'children'
	]);
	const label = children(() => local.children);

	const [checked, setChecked] = createControllableSignal<boolean>({
		name: 'Switch',
		value: () => local.checked,
		defaultValue: () => local.defaultChecked ?? false,
		onChange: (next) => local.onCheckedChange?.(next)
	});

	const handleChange: JSX.EventHandler<HTMLInputElement, Event> = (event) => {
		setChecked(event.currentTarget.checked);
		// контролируемый режим: родитель мог не принять значение, тогда переключатель возвращается к нему
		if (event.currentTarget.checked !== checked()) {
			event.currentTarget.checked = checked();
		}
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
					role='switch'
					class={styles['input']}
					checked={checked()}
					onChange={handleChange}
				/>
				<span class={styles['thumb']} data-switch-thumb aria-hidden='true'/>
			</span>
			<Show when={label.toArray().length > 0}>
				<span class={styles['label']} data-switch-label>{label()}</span>
			</Show>
		</label>
	);
}
