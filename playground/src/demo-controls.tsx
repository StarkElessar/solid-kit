import { Button } from '@stark/solid-kit/button';
import { ButtonGroup } from '@stark/solid-kit/button-group';
import { Checkbox } from '@stark/solid-kit/checkbox';
import { IconButton } from '@stark/solid-kit/icon-button';
import { Input } from '@stark/solid-kit/input';
import { NumericInput } from '@stark/solid-kit/numeric-input';
import { RadioGroup } from '@stark/solid-kit/radio-group';
import { Switch } from '@stark/solid-kit/switch';
import { ToggleGroup } from '@stark/solid-kit/toggle-group';
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
	iconButton('danger'),
	{ id: 'input', render: (size) => <Input data-row-control='input' aria-label='Поле' placeholder='Текст' size={size}/> },
	{
		id: 'input-invalid',
		render: (size) => (
			<Input data-row-control='input-invalid' aria-label='Поле с ошибкой' aria-invalid='true' defaultValue='Ошибка' size={size}/>
		)
	},
	{
		id: 'button-group',
		render: (size) => (
			<ButtonGroup data-row-control='button-group' data-row-group aria-label='Период' size={size}>
				<Button variant='plain'>День</Button>
				<Button variant='plain'>Неделя</Button>
				<Button variant='plain'>Месяц</Button>
			</ButtonGroup>
		)
	},
	{
		id: 'toggle-group',
		render: (size) => (
			<ToggleGroup.Root data-row-control='toggle-group' data-row-group aria-label='Режим' defaultValue='week' size={size}>
				<ToggleGroup.Item value='day'>День</ToggleGroup.Item>
				<ToggleGroup.Item value='week'>Неделя</ToggleGroup.Item>
				<ToggleGroup.Item value='month'>Месяц</ToggleGroup.Item>
			</ToggleGroup.Root>
		)
	},
	{
		id: 'checkbox',
		render: (size) => <Checkbox data-row-control='checkbox' defaultChecked size={size}>Флажок</Checkbox>
	},
	{
		id: 'checkbox-bare',
		render: (size) => <Checkbox data-row-control='checkbox-bare' aria-label='Без подписи' size={size}/>
	},
	{
		id: 'radio-group',
		render: (size) => (
			<RadioGroup.Root aria-label='Режим радио' orientation='horizontal' defaultValue='a' size={size}>
				<RadioGroup.Item value='a' data-row-control='radio-a'>Один</RadioGroup.Item>
				<RadioGroup.Item value='b' data-row-control='radio-b'>Два</RadioGroup.Item>
			</RadioGroup.Root>
		)
	},
	{
		id: 'switch',
		render: (size) => <Switch data-row-control='switch' defaultChecked size={size}>Переключатель</Switch>
	},
	{
		id: 'switch-bare',
		render: (size) => <Switch data-row-control='switch-bare' aria-label='Без подписи' size={size}/>
	},
	{
		id: 'numeric-input',
		render: (size) => <NumericInput data-row-control='numeric-input' aria-label='Число' defaultValue={42} size={size}/>
	}
];
