import type { PagerLabels, PagerRange } from '../pager';

/** Пропсы нижней полосы Grid: те же значения и умолчания, что у `Pager`; полоса есть, только если передан `total`. */
export interface GridPagerProps {
	/** Всего записей в выборке (не длина `rows`): включает нижнюю полосу пейджера. */
	total?: number | undefined;
	page?: number | undefined;
	defaultPage?: number | undefined;
	onPageChange?: ((page: number) => void) | undefined;
	pageSize?: number | undefined;
	defaultPageSize?: number | undefined;
	onPageSizeChange?: ((size: number) => void) | undefined;
	/** По умолчанию 10, 20, 50, 200, 500, 1000, 2000. */
	pageSizes?: readonly number[] | undefined;
	/** Кнопка «Обновить» в полосе показывается только если колбэк передан. */
	onRefresh?: (() => void) | undefined;
	pagerLabels?: Partial<PagerLabels> | undefined;
	pagerSummaryText?: ((range: PagerRange) => string) | undefined;
}
