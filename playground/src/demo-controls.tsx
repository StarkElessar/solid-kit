import { Button } from '@stark/solid-kit/button';
import type { JSX } from 'solid-js';

import type { ControlSize } from './control-rows';

export interface DemoControl {
	readonly id: string;
	readonly render: (size: ControlSize | undefined) => JSX.Element;
}

/** Контролы, показанные в каждом из пяти рядов. Каждый план этапа 1 добавляет сюда свои компоненты. */
export const DEMO_CONTROLS: readonly DemoControl[] = [
	{ id: 'button-primary', render: (size) => <Button data-row-control='button-primary' size={size}>Основная</Button> },
	{ id: 'button-tinted', render: (size) => <Button data-row-control='button-tinted' variant='tinted' size={size}>Тонированная</Button> },
	{ id: 'button-plain', render: (size) => <Button data-row-control='button-plain' variant='plain' size={size}>Простая</Button> },
	{ id: 'button-danger', render: (size) => <Button data-row-control='button-danger' variant='danger' size={size}>Удалить</Button> }
];
