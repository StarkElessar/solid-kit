import { type JSX, splitProps } from 'solid-js';

import { createControllableSignal } from '../../utils/create-controllable-signal';
import { ButtonGroup, type ButtonGroupProps } from '../button-group';

import { ToggleGroupContext, type ToggleGroupContextValue } from './toggle-group-context';
import { nextSelection, type ToggleGroupMode, toSelection } from './toggle-group-selection';

export interface ToggleGroupBaseProps extends ButtonGroupProps {
	disabled?: boolean | undefined;
}

export interface ToggleGroupSingleProps extends ToggleGroupBaseProps {
	mode?: 'single' | undefined;
	value?: string | null | undefined;
	defaultValue?: string | null | undefined;
	onValueChange?: ((value: string) => void) | undefined;
}

export interface ToggleGroupMultiProps extends ToggleGroupBaseProps {
	mode: 'multi';
	value?: readonly string[] | undefined;
	defaultValue?: readonly string[] | undefined;
	onValueChange?: ((value: string[]) => void) | undefined;
}

export type ToggleGroupRootProps = ToggleGroupSingleProps | ToggleGroupMultiProps;

export function ToggleGroupRoot(props: ToggleGroupRootProps): JSX.Element {
	const [, rest] = splitProps(props, ['mode', 'value', 'defaultValue', 'onValueChange', 'disabled']);
	const mode = (): ToggleGroupMode => props.mode ?? 'single';

	// в обоих режимах состояние это список выбранных; наружу он уходит значением режима
	const [selection, setSelection] = createControllableSignal<readonly string[]>({
		name: 'ToggleGroup',
		value: () => toSelection(props.value),
		defaultValue: () => toSelection(props.defaultValue) ?? [],
		onChange: (next) => {
			if (props.mode === 'multi') {
				props.onValueChange?.([...next]);
			}
			else if (next[0] !== undefined) {
				props.onValueChange?.(next[0]);
			}
		}
	});

	const context: ToggleGroupContextValue = {
		isSelected: (value) => selection().includes(value),
		toggle: (value) => {
			const next = nextSelection(mode(), selection(), value);
			if (next) {
				setSelection(next);
			}
		},
		disabled: () => props.disabled === true
	};

	return (
		<ToggleGroupContext.Provider value={context}>
			<ButtonGroup {...rest}/>
		</ToggleGroupContext.Provider>
	);
}
