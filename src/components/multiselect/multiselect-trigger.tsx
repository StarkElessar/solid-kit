import styles from './multiselect.module.css';

import { createMemo, createSignal, For, type JSX, onCleanup, onMount, Show, splitProps } from 'solid-js';

import type { ListKey } from '../../internal/list-box/list-row';

import { fitChips } from './fit-chips';
import { MultiSelectChip } from './multiselect-chip';
import { useMultiSelectContext } from './multiselect-context';
import { countText } from './multiselect-value';

export interface MultiSelectTriggerProps<T>
	extends Omit<
		JSX.InputHTMLAttributes<HTMLInputElement>,
		'class' | 'style' | 'disabled' | 'children' | 'type' | 'role' | 'value' | 'defaultValue' | 'readOnly' | 'size'
		| 'placeholder' | 'onInput' | 'onClick' | 'onKeyDown'
	> {
	onClick?: JSX.EventHandler<HTMLInputElement, MouseEvent> | undefined;
	onKeyDown?: JSX.EventHandler<HTMLInputElement, KeyboardEvent> | undefined;
	/** Показывается в пустом поле, пока ничего не выбрано. */
	placeholder?: string | undefined;
	/** По умолчанию подпись элемента. */
	renderChip?: ((item: T) => JSX.Element) | undefined;
	/** Доступное имя кнопки `×` чипа; по умолчанию «Убрать: подпись». */
	removeChipLabel?: ((label: string) => string) | undefined;
	/** Доступное имя кнопки-шеврона; по умолчанию «Показать список». */
	toggleLabel?: string | undefined;
	/** Класс и стиль оболочки триггера (она задаёт ширину). */
	class?: string | undefined;
	style?: JSX.CSSProperties | undefined;
}

/** Чипов в DOM не больше этого числа: остальные идут в счётчик (спек, раздел 8). */
const MAX_CHIPS = 24;
const CHIP_GAP = 4;
/** Место под шеврон, внутренние отступы оболочки и минимальную ширину поля ввода, px. */
const SHELL_RESERVE = 80;
/** Резерв под счётчик «+N» в основной кнопке, px. */
const COUNTER_WIDTH = 36;

export function MultiSelectTrigger<T>(props: MultiSelectTriggerProps<T>): JSX.Element {
	const context = useMultiSelectContext('MultiSelect.Trigger');
	const [local, rest] = splitProps(props, [
		'placeholder',
		'renderChip',
		'removeChipLabel',
		'toggleLabel',
		'class',
		'style',
		'ref',
		'onClick',
		'onKeyDown'
	]);

	let own: HTMLDivElement | undefined;
	onCleanup(() => {
		if (context.anchor() === own) {
			context.setAnchor(undefined);
		}
		context.setInput(undefined);
	});

	const [shellWidth, setShellWidth] = createSignal(0);
	const [widths, setWidths] = createSignal<ReadonlyMap<ListKey, number>>(new Map());
	onMount(() => {
		if (!own || typeof ResizeObserver === 'undefined') {
			return;
		}
		const shell = own;
		setShellWidth(shell.clientWidth);
		const observer = new ResizeObserver(() => {
			setShellWidth(shell.clientWidth);
		});
		observer.observe(shell);
		onCleanup(() => {
			observer.disconnect();
		});
	});

	const chipItems = createMemo(() => context.selectedItems().slice(0, MAX_CHIPS));
	const measureChip = (key: ListKey, element: HTMLElement): void => {
		const width = element.getBoundingClientRect().width;
		if (width > 0 && widths().get(key) !== width) {
			setWidths(new Map(widths()).set(key, width));
		}
	};

	// пока ширины не измерены (или оболочка не показана), показываются все чипы
	const visibleCount = createMemo(() => {
		const items = chipItems();
		if (context.chipsOverflow() !== 'collapse' || context.isAll() || shellWidth() === 0) {
			return items.length;
		}
		const measured = items.map((item) => widths().get(context.getKey(item)) ?? 0);
		if (measured.some((width) => width === 0)) {
			return items.length;
		}
		return fitChips(measured, shellWidth() - SHELL_RESERVE, COUNTER_WIDTH, CHIP_GAP);
	});
	const hiddenCount = (): number => (context.isAll() ? 0 : context.selectedItems().length - visibleCount());
	const showChips = (): boolean => context.chipsOverflow() !== 'summary' && context.count() > 0;
	// «+N» в collapse и «N из M» в summary; в wrap счётчик нужен, только если чипов больше предела
	const counterText = (): string => {
		if (context.count() === 0) {
			return '';
		}
		if (context.chipsOverflow() === 'summary') {
			return countText(context.count(), context.total());
		}
		return hiddenCount() > 0 ? `+${hiddenCount()}` : '';
	};

	const removeLabel = (label: string): string => (local.removeChipLabel ? local.removeChipLabel(label) : `Убрать: ${label}`);
	const afterRemove = (): void => {
		context.input()?.focus();
	};

	const handleKeyDown: JSX.EventHandler<HTMLInputElement, KeyboardEvent> = (event) => {
		local.onKeyDown?.(event);
		if (event.defaultPrevented || context.disabled()) {
			return;
		}
		// Backspace в пустом поле убирает последний выбранный чип (в состоянии «Все» снимает «Все»)
		if (event.key === 'Backspace' && context.query() === '' && context.count() > 0 && !event.isComposing) {
			event.preventDefault();
			const last = context.selectedItems().at(-1);
			if (last === undefined) {
				context.clearAll();
			}
			else {
				context.removeItem(last);
			}
			return;
		}
		if (!context.open()) {
			const arrow = event.key === 'ArrowDown' || event.key === 'ArrowUp';
			const press = !context.searchable() && (event.key === 'Enter' || event.key === ' ');
			if (arrow || press) {
				event.preventDefault();
				context.setOpen(true, 'keyboard');
			}
			return;
		}
		if (event.key === 'Tab') {
			context.setOpen(false);
			return;
		}
		if (context.controller.handleKeyDown(event)) {
			event.preventDefault();
		}
	};

	return (
		<div
			ref={(element) => {
				own = element;
				context.setAnchor(element);
			}}
			data-s-kit
			data-s-kit-size={context.size()}
			data-multiselect-overflow={context.chipsOverflow()}
			data-disabled={context.disabled() ? '' : undefined}
			data-multiselect-readonly={context.searchable() ? undefined : ''}
			aria-invalid={rest['aria-invalid']}
			class={local.class ? `${styles['shell']} ${local.class}` : styles['shell']}
			style={local.style}
			// клик по пустому месту оболочки открывает список; клики по кнопкам обрабатывают сами кнопки
			onClick={(event) => {
				if (event.target === event.currentTarget && !context.disabled()) {
					context.setOpen(!context.open(), 'pointer');
					context.input()?.focus();
				}
			}}
		>
			<Show when={showChips()}>
				<div class={styles['chips']}>
					<Show
						when={!context.isAll()}
						fallback={(
							<MultiSelectChip
								label='Все'
								content={context.allLabel()}
								removeLabel={removeLabel('Все')}
								disabled={context.disabled()}
								hidden={false}
								onRemove={() => {
									context.clearAll();
									afterRemove();
								}}
								onMeasure={() => undefined}
							/>
						)}
					>
						<For each={chipItems()}>
							{(item, index) => {
								const label = context.getLabel(item);
								return (
									<MultiSelectChip
										label={label}
										content={local.renderChip ? local.renderChip(item as T) : label}
										removeLabel={removeLabel(label)}
										disabled={context.disabled()}
										hidden={index() >= visibleCount()}
										onRemove={() => {
											context.removeItem(item);
											afterRemove();
										}}
										onMeasure={(element) => {
											measureChip(context.getKey(item), element);
										}}
									/>
								);
							}}
						</For>
					</Show>
				</div>
			</Show>
			<Show when={counterText() !== ''}>
				<span class={styles['counter']} data-multiselect-counter>{counterText()}</span>
			</Show>
			<input
				{...rest}
				ref={(element) => {
					context.setInput(element);
					if (typeof local.ref === 'function') {
						local.ref(element);
					}
				}}
				type='text'
				role='combobox'
				autocomplete='off'
				aria-autocomplete={context.searchable() ? 'list' : undefined}
				aria-haspopup='listbox'
				aria-expanded={context.open()}
				aria-controls={context.open() ? context.listId : undefined}
				aria-activedescendant={context.open() ? context.controller.activeId() : undefined}
				readOnly={!context.searchable()}
				disabled={context.disabled()}
				placeholder={context.count() === 0 ? local.placeholder : undefined}
				value={context.query()}
				class={styles['input']}
				onInput={(event) => {
					context.handleInput(event.currentTarget.value);
				}}
				onClick={(event) => {
					local.onClick?.(event);
					if (event.defaultPrevented || context.disabled()) {
						return;
					}
					// поле для чтения ведёт себя как кнопка, печатаемое только открывает список (повторный клик ставит курсор)
					if (!context.searchable()) {
						context.setOpen(!context.open(), 'pointer');
					}
					else if (!context.open()) {
						context.setOpen(true, 'pointer');
					}
				}}
				onKeyDown={handleKeyDown}
			/>
			<button
				type='button'
				tabindex='-1'
				aria-label={local.toggleLabel ?? 'Показать список'}
				aria-expanded={context.open()}
				disabled={context.disabled()}
				class={styles['toggle']}
				// фокус остаётся в поле: иначе клик по шеврону считался бы уходом из поля
				onMouseDown={(event) => {
					event.preventDefault();
				}}
				onClick={() => {
					context.setOpen(!context.open(), 'pointer');
					context.input()?.focus();
				}}
			>
				<svg viewBox='0 0 16 16' width='12' height='12' aria-hidden='true'>
					<path
						d='M3 6 8 11 13 6'
						fill='none'
						stroke='currentColor'
						stroke-width='1.75'
						stroke-linecap='round'
						stroke-linejoin='round'
					/>
				</svg>
			</button>
		</div>
	);
}
