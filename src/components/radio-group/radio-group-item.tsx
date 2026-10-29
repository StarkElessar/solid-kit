import styles from './radio-group.module.css';

import { children, type JSX, Show, splitProps } from 'solid-js';

import { useRadioGroupContext } from './radio-group-context';

export interface RadioGroupItemProps
	extends Omit<
		JSX.InputHTMLAttributes<HTMLInputElement>,
		'class' | 'style' | 'size' | 'type' | 'name' | 'value' | 'checked' | 'defaultChecked' | 'onChange' | 'onInput' | 'children'
	> {
	value: string;
	class?: string | undefined;
	style?: JSX.CSSProperties | undefined;
	/** Подпись. */
	children?: JSX.Element;
}

export function RadioGroupItem(props: RadioGroupItemProps): JSX.Element {
	const group = useRadioGroupContext();
	const [local, rest] = splitProps(props, ['value', 'disabled', 'class', 'style', 'children']);
	const label = children(() => local.children);
	const disabled = (): boolean => group.disabled() || local.disabled === true;

	return (
		<label
			data-s-kit
			data-disabled={disabled() ? '' : undefined}
			class={local.class ? `${styles['item']} ${local.class}` : styles['item']}
			style={local.style}
		>
			<span class={styles['box']}>
				<input
					{...rest}
					type='radio'
					name={group.name}
					value={local.value}
					class={styles['input']}
					checked={group.isSelected(local.value)}
					disabled={disabled()}
					onChange={() => {
						group.select(local.value);
					}}
				/>
				<svg class={styles['mark']} viewBox='0 0 16 16' aria-hidden='true'>
					<circle cx='8' cy='8' r='3' fill='currentColor'/>
				</svg>
			</span>
			<Show when={label.toArray().length > 0}>
				<span class={styles['label']} data-radio-label>{label()}</span>
			</Show>
		</label>
	);
}
