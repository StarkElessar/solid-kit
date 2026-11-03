import styles from './picker-field.module.css';

import { createSignal, createUniqueId, type JSX, Show, splitProps } from 'solid-js';

import { Input } from '../../components/input';
import { createControllableSignal } from '../../utils/create-controllable-signal';
import { FloatingPanel } from '../floating-panel/floating-panel';
import { focusInitial } from '../floating-panel/focus-initial';

import { PickerClearIcon } from './picker-clear-icon';
import type { PickerFieldProps } from './picker-field-props';

const OWN_PROPS = [
	'text', 'onTextChange', 'onCommit', 'onRevert', 'open', 'defaultOpen', 'onOpenChange', 'icon', 'openLabel', 'panelLabel',
	'clearable', 'clearLabel', 'onClear', 'name', 'hiddenValue', 'disabled', 'readOnly', 'size', 'onKeyDown', 'onBlur', 'onClick',
	'class', 'style', 'panelClass', 'children'
] as const;

/**
 * Общая оболочка полей даты и времени (спек DatePicker, раздел 3): текстовое поле со значком и панелью. Открытие: клик по полю,
 * клик по значку, ArrowDown (с переносом фокуса внутрь). Знает про поле, фокус и панель, но не про даты и время.
 */
export function PickerField(props: PickerFieldProps): JSX.Element {
	const [local, rest] = splitProps(props, OWN_PROPS);
	const panelId = `${createUniqueId()}-picker`;

	const [open, setOpen] = createControllableSignal<boolean>({
		name: 'PickerField',
		value: () => local.open,
		defaultValue: () => local.defaultOpen ?? false,
		onChange: (next) => local.onOpenChange?.(next)
	});
	const [anchor, setAnchor] = createSignal<HTMLElement>();
	const [input, setInput] = createSignal<HTMLInputElement>();
	let panel: HTMLDivElement | undefined;

	const inactive = (): boolean => local.disabled === true || local.readOnly === true;
	const hasClear = (): boolean => local.clearable === true && !inactive() && local.text !== '';

	const closeAndFocus = (): void => {
		setOpen(false);
		input()?.focus();
	};
	const focusIntoPanel = (): void => {
		queueMicrotask(() => {
			if (!panel) {
				return;
			}
			const entry = panel.querySelector<HTMLElement>('[data-focus-target]');
			if (entry) {
				entry.focus();
			}
			else {
				focusInitial(panel, 'first');
			}
		});
	};

	const handleKeyDown: JSX.EventHandler<HTMLInputElement, KeyboardEvent> = (event) => {
		local.onKeyDown?.(event);
		if (event.defaultPrevented || local.disabled === true) {
			return;
		}
		if (event.key === 'ArrowDown' && !event.ctrlKey && !event.metaKey && !local.readOnly) {
			event.preventDefault();
			if (!open()) {
				setOpen(true);
			}
			focusIntoPanel();
			return;
		}
		if (event.key === 'Enter') {
			local.onCommit(event.currentTarget.value);
			if (open()) {
				event.preventDefault();
				setOpen(false);
			}
			return;
		}
		if (event.key === 'Escape' && !open()) {
			local.onRevert();
			return;
		}
		if (event.key === 'Tab' && open()) {
			setOpen(false);
		}
	};

	const handleBlur: JSX.EventHandler<HTMLInputElement, FocusEvent> = (event) => {
		local.onBlur?.(event);
		if (event.defaultPrevented) {
			return;
		}
		// фокус ушёл внутрь панели (клавиатурная навигация по календарю): поле остаётся «в работе»
		if (event.relatedTarget instanceof Node && panel?.contains(event.relatedTarget)) {
			return;
		}
		local.onCommit(event.currentTarget.value);
		setOpen(false);
	};

	// клик по полю открывает закрытую панель; при открытой клик только ставит курсор
	const handleClick: JSX.EventHandler<HTMLInputElement, MouseEvent> = (event) => {
		local.onClick?.(event);
		if (!event.defaultPrevented && !inactive() && !open()) {
			setOpen(true);
		}
	};

	return (
		<span
			ref={setAnchor}
			data-s-kit
			data-s-kit-size={local.size}
			data-clearable={local.clearable === true ? '' : undefined}
			class={local.class ? `${styles['field']} ${local.class}` : styles['field']}
			style={local.style}
		>
			<Input
				{...rest}
				ref={setInput}
				class={styles['input']}
				size={local.size}
				role='combobox'
				autocomplete='off'
				aria-haspopup='dialog'
				aria-expanded={open()}
				aria-controls={open() ? panelId : undefined}
				disabled={local.disabled}
				readOnly={local.readOnly}
				value={local.text}
				onValueChange={local.onTextChange}
				onKeyDown={handleKeyDown}
				onBlur={handleBlur}
				onClick={handleClick}
			/>
			<Show when={hasClear()}>
				<button
					type='button'
					tabindex='-1'
					aria-label={local.clearLabel}
					class={styles['clear']}
					// фокус остаётся в поле: иначе клик считался бы уходом из поля
					onMouseDown={(event) => {
						event.preventDefault();
					}}
					onClick={() => {
						local.onClear?.();
						input()?.focus();
					}}
				>
					<PickerClearIcon/>
				</button>
			</Show>
			<button
				type='button'
				tabindex='-1'
				aria-label={local.openLabel}
				aria-expanded={open()}
				disabled={local.disabled}
				class={styles['toggle']}
				onMouseDown={(event) => {
					event.preventDefault();
				}}
				onClick={() => {
					if (inactive()) {
						return;
					}
					if (open()) {
						setOpen(false);
					}
					else {
						setOpen(true);
					}
					input()?.focus();
				}}
			>
				{local.icon}
			</button>
			<Show when={local.name}>
				<input type='hidden' name={local.name} value={local.hiddenValue ?? ''} disabled={local.disabled}/>
			</Show>
			<FloatingPanel
				open={open}
				onDismiss={() => {
					setOpen(false);
				}}
				anchor={anchor}
				restoreFocusTo={input}
				initialFocus='none'
				size={local.size}
				id={panelId}
				role='dialog'
				aria-label={local.panelLabel}
				panelRef={(element) => {
					panel = element;
				}}
				class={local.panelClass ? `${styles['panel']} ${local.panelClass}` : styles['panel']}
				onKeyDown={(event) => {
					if (event.key === 'Tab') {
						event.preventDefault();
						closeAndFocus();
					}
				}}
			>
				{/* фокус остаётся в поле при щелчке по пустому месту панели: иначе поле считало бы это уходом */}
				<div
					class={styles['body']}
					onMouseDown={(event) => {
						event.preventDefault();
					}}
				>
					{local.children({ close: closeAndFocus })}
				</div>
			</FloatingPanel>
		</span>
	);
}
