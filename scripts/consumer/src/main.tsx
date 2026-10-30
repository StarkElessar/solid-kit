import '@stark/solid-kit/tokens.css';

import { Button } from '@stark/solid-kit/button';
import { ButtonGroup } from '@stark/solid-kit/button-group';
import { Checkbox } from '@stark/solid-kit/checkbox';
import { Field } from '@stark/solid-kit/field';
import { IconButton } from '@stark/solid-kit/icon-button';
import { Input } from '@stark/solid-kit/input';
import { NumericInput } from '@stark/solid-kit/numeric-input';
import { Popover, usePopover } from '@stark/solid-kit/popover';
import { RadioGroup } from '@stark/solid-kit/radio-group';
import { Switch } from '@stark/solid-kit/switch';
import { Tabs } from '@stark/solid-kit/tabs';
import { ToggleGroup } from '@stark/solid-kit/toggle-group';
import { createContext, useContext } from 'solid-js';
import { render } from 'solid-js/web';

const AppContext = createContext('app-default');

function ScopeReader() {
	const popover = usePopover();
	const app = useContext(AppContext);
	return (
		<>
			<output id="scope">{popover.open() ? 'popover-open' : 'popover-closed'}</output>
			<output id="app">{app}</output>
		</>
	);
}

const root = document.getElementById('root');
if (!root) {
	throw new Error('#root is missing');
}

render(
	() => (
		<AppContext.Provider value="app">
			<Popover.Root defaultOpen>
				<Popover.Trigger>Popover</Popover.Trigger>
				<Popover.Content>
					<ScopeReader />
				</Popover.Content>
			</Popover.Root>
			<Button id="btn" variant="danger">Удалить</Button>
			<IconButton id="icon-btn" aria-label="Закрыть" variant="tinted">×</IconButton>
			<Input id="field" aria-label="Имя" defaultValue="Анна" aria-invalid="true" />
			<NumericInput aria-label="Количество" min={0} defaultValue={1} />
			<Field label="Почта" hint="Подсказка">{(control) => <input {...control} />}</Field>
			<ButtonGroup aria-label="Период">
				<Button variant="plain">День</Button>
				<Button variant="plain">Неделя</Button>
			</ButtonGroup>
			<Checkbox defaultChecked>Согласен</Checkbox>
			<Switch defaultChecked>Уведомления</Switch>
			<Tabs.Root defaultValue="a">
				<Tabs.List aria-label="Разделы">
					<Tabs.Tab value="a">Раздел</Tabs.Tab>
				</Tabs.List>
				<Tabs.Panel value="a">Содержимое</Tabs.Panel>
			</Tabs.Root>
			<RadioGroup.Root aria-label="Тариф" defaultValue="basic">
				<RadioGroup.Item value="basic">Базовый</RadioGroup.Item>
				<RadioGroup.Item value="pro">Расширенный</RadioGroup.Item>
			</RadioGroup.Root>
			<ToggleGroup.Root aria-label="Вид" defaultValue="list">
				<ToggleGroup.Item value="list">Список</ToggleGroup.Item>
				<ToggleGroup.Item value="grid">Сетка</ToggleGroup.Item>
			</ToggleGroup.Root>
			<ToggleGroup.Root aria-label="Дни" mode="multi" defaultValue={['mon']}>
				<ToggleGroup.Item value="mon">Пн</ToggleGroup.Item>
				<ToggleGroup.Item value="tue">Вт</ToggleGroup.Item>
			</ToggleGroup.Root>
		</AppContext.Provider>
	),
	root
);
