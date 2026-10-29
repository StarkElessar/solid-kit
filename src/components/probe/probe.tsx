import styles from './probe.module.css';

import { createSignal, type JSX, Show } from 'solid-js';

import { createAnchoredPosition } from '../../utils/create-anchored-position';
import { createControllableSignal } from '../../utils/create-controllable-signal';
import { createPanelLayer } from '../../utils/create-panel-layer';

import { ProbeScope } from './probe-scope';

export interface ProbeProps {
	open?: boolean | undefined;
	defaultOpen?: boolean | undefined;
	onOpenChange?: ((open: boolean) => void) | undefined;
	size?: 'sm' | 'md' | 'lg' | undefined;
	class?: string | undefined;
	style?: JSX.CSSProperties | undefined;
	children?: JSX.Element;
}

/** Тестовый стенд этапа 0: кнопка и панель в top layer на хелперах кита. */
export function Probe(props: ProbeProps): JSX.Element {
	const [open, setOpen] = createControllableSignal<boolean>({
		name: 'Probe',
		value: () => props.open,
		defaultValue: () => props.defaultOpen ?? false,
		onChange: (next) => props.onOpenChange?.(next)
	});
	const [trigger, setTrigger] = createSignal<HTMLButtonElement>();
	const [panel, setPanel] = createSignal<HTMLDivElement>();

	createAnchoredPosition({ anchor: trigger, floating: panel, open });
	createPanelLayer({
		panel, anchor: trigger, open, onDismiss: () => {
			setOpen(false);
		}
	});

	return (
		<>
			<button
				ref={setTrigger}
				type='button'
				data-s-kit
				data-probe='marker-used'
				data-s-kit-size={props.size}
				class={props.class ? `${styles['root']} ${props.class}` : styles['root']}
				style={props.style}
				aria-expanded={open()}
				onClick={() => {
					setOpen(!open());
				}}
			>
				Probe
			</button>
			<Show when={open()}>
				<div ref={setPanel} data-s-kit data-probe-panel class={styles['panel']}>
					<ProbeScope.Provider value={{ label: 'probe-scope' }}>{props.children}</ProbeScope.Provider>
				</div>
			</Show>
		</>
	);
}
