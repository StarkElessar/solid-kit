import '@stark/solid-kit/tokens.css';
import './playground.css';

import { render } from 'solid-js/web';

import { App } from './app';

const root = document.getElementById('root');
if (!root) {
	throw new Error('#root is missing');
}
render(() => <App/>, root);
