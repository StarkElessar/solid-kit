import type { JSX } from 'solid-js';

import type { ButtonSize } from '../button';

import type { PagerLabels } from './pager-labels';
import type { PagerRange } from './pager-range';

export interface PagerProps {
	/** Всего записей. */
	total: number;
	/** Страница с 1. Страница за границами показывается зажатой, колбэк при этом не вызывается. */
	page?: number | undefined;
	defaultPage?: number | undefined;
	onPageChange?: ((page: number) => void) | undefined;
	pageSize?: number | undefined;
	/** По умолчанию первый из `pageSizes`. */
	defaultPageSize?: number | undefined;
	/** При смене вызывается `onPageSizeChange`, затем `onPageChange`, если первая запись страницы переехала на другую страницу. */
	onPageSizeChange?: ((size: number) => void) | undefined;
	/** Размеры страницы в выборе (10, 20, 50, 200, 500, 1000, 2000); текущий размер вне списка добавляется к нему. */
	pageSizes?: readonly number[] | undefined;
	/** Кнопка «Обновить» показывается только если колбэк передан. */
	onRefresh?: (() => void) | undefined;
	/** Идёт загрузка: всё недоступно, значок обновления вращается. */
	loading?: boolean | undefined;
	labels?: Partial<PagerLabels> | undefined;
	/** По умолчанию «Записей 21–40 из 1 250». */
	summaryText?: ((range: PagerRange) => string) | undefined;
	size?: ButtonSize | undefined;
	class?: string | undefined;
	style?: JSX.CSSProperties | undefined;
}
