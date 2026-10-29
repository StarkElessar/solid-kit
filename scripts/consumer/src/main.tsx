import '@stark/solid-kit/tokens.css';

import { Button } from '@stark/solid-kit/button';
import { ButtonGroup } from '@stark/solid-kit/button-group';
import { Field } from '@stark/solid-kit/field';
import { IconButton } from '@stark/solid-kit/icon-button';
import { Input } from '@stark/solid-kit/input';
import { Probe, ProbeScope } from '@stark/solid-kit/probe';
import { createContext, useContext } from 'solid-js';
import { render } from 'solid-js/web';

const AppContext = createContext('app-default');

function ScopeReader() {
	const scope = useContext(ProbeScope);
	const app = useContext(AppContext);
	return (
		<>
			<output id="scope">{scope.label}</output>
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
			<Probe defaultOpen>
				<ScopeReader />
			</Probe>
			<Button id="btn" variant="danger">Удалить</Button>
			<IconButton id="icon-btn" aria-label="Закрыть" variant="tinted">×</IconButton>
			<Input id="field" aria-label="Имя" defaultValue="Анна" aria-invalid="true" />
			<Field label="Почта" hint="Подсказка">{(control) => <input {...control} />}</Field>
			<ButtonGroup aria-label="Период">
				<Button variant="plain">День</Button>
				<Button variant="plain">Неделя</Button>
			</ButtonGroup>
		</AppContext.Provider>
	),
	root
);
