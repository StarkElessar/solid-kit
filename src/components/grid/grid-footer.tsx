import styles from './grid.module.css';

import type { JSX } from 'solid-js';

import { Pager } from '../pager';

import type { GridPagerProps } from './grid-pager-props';

export interface GridFooterProps {
	pager: GridPagerProps;
	loading: boolean;
}

/** Нижняя полоса корпуса: пейджер под скроллером. Грид строки не режет, страница сама отвечает на колбэки. */
export function GridFooter(props: GridFooterProps): JSX.Element {
	return (
		<div class={styles['footer']}>
			<Pager
				total={props.pager.total ?? 0}
				page={props.pager.page}
				defaultPage={props.pager.defaultPage}
				onPageChange={props.pager.onPageChange}
				pageSize={props.pager.pageSize}
				defaultPageSize={props.pager.defaultPageSize}
				onPageSizeChange={props.pager.onPageSizeChange}
				pageSizes={props.pager.pageSizes}
				onRefresh={props.pager.onRefresh}
				labels={props.pager.pagerLabels}
				summaryText={props.pager.pagerSummaryText}
				loading={props.loading}
			/>
		</div>
	);
}
