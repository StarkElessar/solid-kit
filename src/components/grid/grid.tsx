import type { JSX } from 'solid-js';

import { GridBase } from './grid-base';
import type { GridProps } from './grid-props';

/** Грид: «глупая» таблица с закреплённой шапкой, колонками, ресайзом, выбором, группировкой и виртуализацией. Движок в `GridBase`. */
export function Grid<T>(props: GridProps<T>): JSX.Element {
	return <GridBase {...props}/>;
}
