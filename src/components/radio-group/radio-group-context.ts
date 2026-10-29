import { createContext, useContext } from 'solid-js';

export interface RadioGroupContextValue {
	name: string;
	isSelected: (value: string) => boolean;
	select: (value: string) => void;
	disabled: () => boolean;
}

export const RadioGroupContext = createContext<RadioGroupContextValue>();

export function useRadioGroupContext(): RadioGroupContextValue {
	const context = useContext(RadioGroupContext);
	if (!context) {
		throw new Error('RadioGroup.Item must be used inside RadioGroup.Root');
	}
	return context;
}
