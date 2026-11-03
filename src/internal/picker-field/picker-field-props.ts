import type { JSX } from 'solid-js';

import type { PickerFieldPanelState } from './picker-field-panel-state';

export type PickerFieldSize = 'sm' | 'md' | 'lg';

export interface PickerFieldProps
	extends Omit<
		JSX.InputHTMLAttributes<HTMLInputElement>,
		'class' | 'style' | 'size' | 'value' | 'defaultValue' | 'onInput' | 'onChange' | 'onKeyDown' | 'onBlur' | 'onClick' | 'readOnly'
		| 'disabled' | 'role' | 'children' | 'ref' | 'name'
	> {
	/** Набираемый текст: оболочка им не управляет, пикер хранит его и формат. */
	text: string;
	onTextChange: (text: string) => void;
	/** Enter и уход из поля: принять набранный текст. */
	onCommit: (text: string) => void;
	/** Esc при закрытой панели: откатить набранное. */
	onRevert: () => void;

	open?: boolean | undefined;
	defaultOpen?: boolean | undefined;
	onOpenChange?: ((open: boolean) => void) | undefined;

	/** Значок справа в поле (клик открывает и закрывает панель). */
	icon: JSX.Element;
	openLabel: string;
	/** Имя диалога-панели для читалок. */
	panelLabel: string;

	/** Кнопка «Очистить» показывается, когда есть текст. */
	clearable?: boolean | undefined;
	clearLabel?: string | undefined;
	onClear?: (() => void) | undefined;

	/** Имя поля формы: скрытое поле несёт значение `hiddenValue`. */
	name?: string | undefined;
	hiddenValue?: string | undefined;

	disabled?: boolean | undefined;
	readOnly?: boolean | undefined;
	size?: PickerFieldSize | undefined;

	onKeyDown?: JSX.EventHandler<HTMLInputElement, KeyboardEvent> | undefined;
	onBlur?: JSX.EventHandler<HTMLInputElement, FocusEvent> | undefined;
	onClick?: JSX.EventHandler<HTMLInputElement, MouseEvent> | undefined;

	/** Класс и стиль оболочки поля (она задаёт ширину). */
	class?: string | undefined;
	style?: JSX.CSSProperties | undefined;
	/** Класс панели. */
	panelClass?: string | undefined;
	children: (panel: PickerFieldPanelState) => JSX.Element;
}
