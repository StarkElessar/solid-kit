import '@stark/solid-kit/tokens.css';
import './playground.css';

import { render } from 'solid-js/web';

import { ThemesPage } from './themes-page';

const root = document.getElementById('root');
if (!root) {
	throw new Error('#root is missing');
}
render(() => <ThemesPage/>, root);
