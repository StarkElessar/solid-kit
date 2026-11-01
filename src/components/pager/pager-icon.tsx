import type { JSX } from 'solid-js';

import { PAGER_ICON_PATHS, type PagerIconName } from './pager-icon-paths';

export interface PagerIconProps {
	name: PagerIconName;
	class?: string | undefined;
}

/** Значок пейджера: один компонент на все значки, геометрия берётся из `PAGER_ICON_PATHS`. */
export function PagerIcon(props: PagerIconProps): JSX.Element {
	return (
		<svg class={props.class} viewBox='0 0 16 16' aria-hidden='true'>
			<path
				d={PAGER_ICON_PATHS[props.name]}
				fill='none'
				stroke='currentColor'
				stroke-width='1.6'
				stroke-linecap='round'
				stroke-linejoin='round'
			/>
		</svg>
	);
}
