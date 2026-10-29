import { createContext, useContext } from 'solid-js';

export interface ToggleGroupContextValue {
	isSelected: (value: string) => boolean;
	toggle: (value: string) => void;
	disabled: () => boolean;
}

export const ToggleGroupContext = createContext<ToggleGroupContextValue>();

export function useToggleGroupContext(): ToggleGroupContextValue {
	const context = useContext(ToggleGroupContext);
	if (!context) {
		throw new Error('ToggleGroup.Item must be used inside ToggleGroup.Root');
	}
	return context;
}
