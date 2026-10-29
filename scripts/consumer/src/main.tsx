import '@stark/solid-kit/tokens.css';

import { Button } from '@stark/solid-kit/button';
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
		</AppContext.Provider>
	),
	root
);
