import styles from './probe-unused.module.css';

import type { JSX } from 'solid-js';

export function ProbeUnused(): JSX.Element {
	return <span data-probe='marker-unused' class={styles['root']}>unused</span>;
}
