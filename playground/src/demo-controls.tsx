import { Button } from '@stark/solid-kit/button';
import { IconButton } from '@stark/solid-kit/icon-button';
import type { JSX } from 'solid-js';

import type { ControlSize } from './control-rows';
import { DemoIcon } from './demo-icon';

export interface DemoControl {
	readonly id: string;
	readonly render: (size: ControlSize | undefined) => JSX.Element;
}

type DemoVariant = 'primary' | 'tinted' | 'plain' | 'danger';

function iconButton(variant: DemoVariant): DemoControl {
	const id = `icon-button-${variant}`;
	return {
		id,
		render: (size) => (
			<IconButton data-row-control={id} data-row-square aria-label='Добавить' variant={variant} size={size}>
				<DemoIcon/>
			</IconButton>
		)
	};
}

/** Контролы, показанные в каждом из пяти рядов. Каждый план этапа 1 добавляет сюда свои компоненты. */
export const DEMO_CONTROLS: readonly DemoControl[] = [
	{ id: 'button-primary', render: (size) => <Button data-row-control='button-primary' size={size}>Основная</Button> },
	{ id: 'button-tinted', render: (size) => <Button data-row-control='button-tinted' variant='tinted' size={size}>Тонированная</Button> },
	{ id: 'button-plain', render: (size) => <Button data-row-control='button-plain' variant='plain' size={size}>Простая</Button> },
	{ id: 'button-danger', render: (size) => <Button data-row-control='button-danger' variant='danger' size={size}>Удалить</Button> },
	iconButton('primary'),
	iconButton('tinted'),
	iconButton('plain'),
	iconButton('danger')
];
