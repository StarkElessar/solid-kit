import styles from './toggle-group.module.css';

import { type JSX, splitProps } from 'solid-js';

import { Button, type ButtonProps } from '../button';

import { useToggleGroupContext } from './toggle-group-context';

export interface ToggleGroupItemProps extends Omit<ButtonProps, 'variant' | 'size' | 'onClick' | 'aria-pressed'> {
	value: string;
}

export function ToggleGroupItem(props: ToggleGroupItemProps): JSX.Element {
	const group = useToggleGroupContext();
	const [local, rest] = splitProps(props, ['value', 'disabled', 'class']);
	const selected = (): boolean => group.isSelected(local.value);

	return (
		<Button
			{...rest}
			variant='plain'
			aria-pressed={selected()}
			data-selected={selected() ? '' : undefined}
			disabled={group.disabled() || local.disabled === true}
			class={local.class ? `${styles['item']} ${local.class}` : styles['item']}
			onClick={() => {
				group.toggle(local.value);
			}}
		/>
	);
}
