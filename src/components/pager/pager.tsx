import styles from './pager.module.css';

import { createEffect, createMemo, type JSX, on, Show } from 'solid-js';

import { createControllableSignal } from '../../utils/create-controllable-signal';
import { IconButton } from '../icon-button';
import { Select } from '../select';

import { clampPage } from './clamp-page';
import { DEFAULT_PAGE_SIZES } from './default-page-sizes';
import { DEFAULT_PAGER_LABELS } from './default-pager-labels';
import { defaultSummaryText } from './default-summary-text';
import { getPageItems } from './get-page-items';
import { mergePageSizes } from './merge-page-sizes';
import { pageCount } from './page-count';
import { pageForSizeChange } from './page-for-size-change';
import { pageRange } from './page-range';
import { PagerIcon } from './pager-icon';
import { PagerPageButtons } from './pager-page-buttons';
import type { PagerProps } from './pager-props';

const FALLBACK_PAGE_SIZE = 10;

function isDisabled(element: Element): boolean {
	return element instanceof HTMLButtonElement && element.disabled;
}

/**
 * Пейджер: навигация по страницам, размер страницы, сводка и «Обновить». Хранит только страницу и размер; строки не режет
 * (спек этапа 4б, пейджер). Страница с номером за границами показывается зажатой без вызова колбэка.
 */
export function Pager(props: PagerProps): JSX.Element {
	const sizes = (): readonly number[] => props.pageSizes ?? DEFAULT_PAGE_SIZES;
	const labels = createMemo(() => ({ ...DEFAULT_PAGER_LABELS, ...props.labels }));

	const [page, setPage] = createControllableSignal<number>({
		name: 'Pager',
		value: () => props.page,
		defaultValue: () => props.defaultPage ?? 1,
		onChange: (next) => props.onPageChange?.(next)
	});
	const [pageSize, setPageSize] = createControllableSignal<number>({
		name: 'Pager',
		value: () => props.pageSize,
		defaultValue: () => props.defaultPageSize ?? sizes()[0] ?? FALLBACK_PAGE_SIZE,
		onChange: (next) => props.onPageSizeChange?.(next)
	});

	const count = createMemo(() => pageCount(props.total, pageSize()));
	const shown = createMemo(() => clampPage(page(), count()));
	const items = createMemo(() => getPageItems(shown(), count()));
	const summary = createMemo(() => (props.summaryText ?? defaultSummaryText)(pageRange(shown(), pageSize(), props.total)));
	const sizeItems = createMemo(() => mergePageSizes(sizes(), pageSize()));
	const loading = (): boolean => props.loading === true;
	const atStart = (): boolean => shown() <= 1;
	const atEnd = (): boolean => shown() >= count();

	const goTo = (target: number): void => {
		const next = clampPage(target, count());
		if (next !== shown()) {
			setPage(next);
		}
	};
	const changeSize = (size: number): void => {
		if (size === pageSize()) {
			return;
		}
		const next = pageForSizeChange(shown(), pageSize(), size);
		setPageSize(size);
		if (next !== shown()) {
			setPage(next);
		}
	};

	// фокус: `hadFocus` переживает отключение сфокусированной кнопки (браузер сам снимает с неё фокус), но не уход пользователя
	let nav: HTMLElement | undefined;
	let lastFocused: HTMLElement | undefined;
	let hadFocus = false;

	const restoreFocus = (): void => {
		if (nav === undefined || !hadFocus) {
			return;
		}
		if (loading()) {
			nav.focus();
			return;
		}
		const active = document.activeElement;
		if (active instanceof HTMLElement && active !== nav && nav.contains(active) && !isDisabled(active)) {
			return;
		}
		const keep = lastFocused !== undefined && nav.contains(lastFocused) && !isDisabled(lastFocused);
		const target = keep ? lastFocused : nav.querySelector<HTMLElement>('[aria-current="page"]');
		target?.focus();
	};

	createEffect(on([atStart, atEnd, loading], restoreFocus, { defer: true }));

	return (
		<nav
			ref={nav}
			data-s-kit
			data-s-kit-focus-inset
			data-s-kit-size={props.size}
			tabindex='-1'
			aria-label={labels().navigation}
			class={props.class ? `${styles['root']} ${props.class}` : styles['root']}
			style={props.style}
			onFocusIn={(event) => {
				if (event.target !== nav) {
					lastFocused = event.target as HTMLElement;
				}
				hadFocus = true;
			}}
			onFocusOut={(event) => {
				if (!isDisabled(event.target)) {
					hadFocus = false;
				}
			}}
		>
			<div class={styles['start']}>
				<span class={styles['buttons']}>
					<IconButton
						variant='plain'
						size={props.size}
						aria-label={labels().first}
						disabled={loading() || atStart()}
						onClick={() => {
							goTo(1);
						}}
					><PagerIcon name='first'/></IconButton>
					<IconButton
						variant='plain'
						size={props.size}
						aria-label={labels().previous}
						disabled={loading() || atStart()}
						onClick={() => {
							goTo(shown() - 1);
						}}
					><PagerIcon name='previous'/></IconButton>
					<PagerPageButtons
						items={items()}
						current={shown()}
						pageLabel={labels().page}
						disabled={loading()}
						size={props.size}
						onSelect={goTo}
					/>
					<IconButton
						variant='plain'
						size={props.size}
						aria-label={labels().next}
						disabled={loading() || atEnd()}
						onClick={() => {
							goTo(shown() + 1);
						}}
					><PagerIcon name='next'/></IconButton>
					<IconButton
						variant='plain'
						size={props.size}
						aria-label={labels().last}
						disabled={loading() || atEnd()}
						onClick={() => {
							goTo(count());
						}}
					><PagerIcon name='last'/></IconButton>
				</span>
				<Select<number>
					items={sizeItems()}
					getKey={(size) => size}
					getLabel={(size) => String(size)}
					value={pageSize()}
					onValueChange={(size) => {
						if (size !== null) {
							changeSize(size);
						}
					}}
					disabled={loading()}
					size={props.size}
					aria-label={labels().pageSize}
				/>
			</div>
			<div class={styles['end']}>
				<span class={styles['summary']} data-pager-summary>{summary()}</span>
				<Show when={props.onRefresh !== undefined}>
					<IconButton
						variant='plain'
						size={props.size}
						data-pager-refresh
						aria-label={labels().refresh}
						disabled={loading()}
						onClick={() => {
							props.onRefresh?.();
						}}
					><PagerIcon name='refresh' class={loading() ? styles['spin'] : undefined}/></IconButton>
				</Show>
			</div>
		</nav>
	);
}
