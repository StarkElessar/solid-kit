import styles from './multiselect.module.css';

import { createMemo, createSignal, For, type JSX, onCleanup, onMount, Show, splitProps } from 'solid-js';

import type { ListKey } from '../../internal/list-box/list-row';

import { fitChips } from './fit-chips';
import { MultiSelectChip } from './multiselect-chip';
import { useMultiSelectContext } from './multiselect-context';
import { countText } from './multiselect-value';

export interface MultiSelectTriggerProps<T>
	extends Omit<
		JSX.ButtonHTMLAttributes<HTMLButtonElement>,
		'class' | 'style' | 'disabled' | 'children' | 'type' | 'role' | 'value' | 'onClick' | 'onKeyDown' | 'onKeyUp'
	> {
	onClick?: JSX.EventHandler<HTMLButtonElement, MouseEvent> | undefined;
	onKeyDown?: JSX.EventHandler<HTMLButtonElement, KeyboardEvent> | undefined;
	onKeyUp?: JSX.EventHandler<HTMLButtonElement, KeyboardEvent> | undefined;
	/** Показывается приглушённым цветом, пока ничего не выбрано. */
	placeholder?: JSX.Element;
	/** По умолчанию подпись элемента. */
	renderChip?: ((item: T) => JSX.Element) | undefined;
	/** Доступное имя кнопки `×` чипа; по умолчанию «Убрать: подпись». */
	removeChipLabel?: ((label: string) => string) | undefined;
	/** Класс и стиль оболочки триггера (она задаёт ширину). */
	class?: string | undefined;
	style?: JSX.CSSProperties | undefined;
}

/** Чипов в DOM не больше этого числа: остальные идут в счётчик (спек, раздел 8). */
const MAX_CHIPS = 24;
const CHIP_GAP = 4;
/** Место под шеврон и внутренние отступы оболочки, px. */
const SHELL_RESERVE = 40;
/** Резерв под счётчик «+N» в основной кнопке, px. */
const COUNTER_WIDTH = 36;

export function MultiSelectTrigger<T>(props: MultiSelectTriggerProps<T>): JSX.Element {
	const context = useMultiSelectContext('MultiSelect.Trigger');
	const [local, rest] = splitProps(props, [
		'placeholder',
		'renderChip',
		'removeChipLabel',
		'class',
		'style',
		'ref',
		'onClick',
		'onKeyDown',
		'onKeyUp'
	]);

	let own: HTMLDivElement | undefined;
	onCleanup(() => {
		if (context.anchor() === own) {
			context.setAnchor(undefined);
		}
		context.setTrigger(undefined);
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

	const removeLabel = (label: string): string => (local.removeChipLabel ? local.removeChipLabel(label) : `Убрать: ${label}`);
	const afterRemove = (): void => {
		context.trigger()?.focus();
	};

	// пробел гасится и на keyup: иначе браузер активирует кнопку кликом после того, как мы уже обработали keydown
	let swallowSpaceUp = false;

	const handleKeyDown: JSX.EventHandler<HTMLButtonElement, KeyboardEvent> = (event) => {
		local.onKeyDown?.(event);
		if (event.defaultPrevented || context.disabled()) {
			return;
		}
		if (!context.open()) {
			if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter' || event.key === ' ') {
				event.preventDefault();
				swallowSpaceUp = event.key === ' ';
				context.setOpen(true, 'keyboard');
			}
			return;
		}
		if (event.key === 'Tab') {
			context.setOpen(false);
			return;
		}
		if (event.key === ' ') {
			swallowSpaceUp = true;
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
			aria-invalid={rest['aria-invalid']}
			class={local.class ? `${styles['shell']} ${local.class}` : styles['shell']}
			style={local.style}
			// клик по пустому месту оболочки открывает список; клики по кнопкам обрабатывают сами кнопки
			onClick={(event) => {
				if (event.target === event.currentTarget && !context.disabled()) {
					context.setOpen(!context.open(), 'pointer');
					context.trigger()?.focus();
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
			<button
				{...rest}
				ref={(element) => {
					context.setTrigger(element);
					if (typeof local.ref === 'function') {
						local.ref(element);
					}
				}}
				type='button'
				role='combobox'
				aria-haspopup='listbox'
				aria-expanded={context.open()}
				aria-controls={context.open() ? context.listId : undefined}
				aria-activedescendant={context.open() && !context.searchable() ? context.controller.activeId() : undefined}
				disabled={context.disabled()}
				class={styles['main']}
				onClick={(event) => {
					local.onClick?.(event);
					if (!event.defaultPrevented && !context.disabled()) {
						context.setOpen(!context.open(), 'pointer');
					}
				}}
				onKeyDown={handleKeyDown}
				onKeyUp={(event) => {
					local.onKeyUp?.(event);
					if (event.key === ' ' && swallowSpaceUp) {
						swallowSpaceUp = false;
						event.preventDefault();
					}
				}}
			>
				<span class={styles['value']}>
					<Show when={context.count() > 0} fallback={<span class={styles['placeholder']}>{local.placeholder}</span>}>
						<Show
							when={context.chipsOverflow() === 'summary'}
							fallback={hiddenCount() > 0 ? `+${hiddenCount()}` : ''}
						>
							{countText(context.count(), context.total())}
						</Show>
					</Show>
				</span>
				<svg class={styles['chevron']} viewBox='0 0 16 16' width='12' height='12' aria-hidden='true'>
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
