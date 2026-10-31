import { afterEach, describe, expect, it } from 'vitest';

import { rescueFocus } from './rescue-focus';

afterEach(() => {
	document.body.replaceChildren();
});

function setup() {
	const fallback = document.createElement('div');
	fallback.tabIndex = -1;
	const container = document.createElement('div');
	const inner = document.createElement('button');
	const other = document.createElement('button');
	container.append(inner);
	document.body.append(fallback, container, other);
	return { fallback, container, inner, other };
}

describe('rescueFocus', () => {
	it('фокус был внутри контейнера, контейнер удалён: после микрозадачи фокус на запасном', async () => {
		const { fallback, container, inner } = setup();
		inner.focus();
		rescueFocus(container, () => fallback);
		container.remove();
		await Promise.resolve();
		expect(document.activeElement).toBe(fallback);
	});

	it('фокус вне контейнера не трогается', async () => {
		const { fallback, container, other } = setup();
		other.focus();
		rescueFocus(container, () => fallback);
		container.remove();
		await Promise.resolve();
		expect(document.activeElement).toBe(other);
	});

	it('фокус успел уйти на другой элемент до микрозадачи: не перехватывается', async () => {
		const { fallback, container, inner, other } = setup();
		inner.focus();
		rescueFocus(container, () => fallback);
		container.remove();
		other.focus();
		await Promise.resolve();
		expect(document.activeElement).toBe(other);
	});

	it('запасной элемент вне документа: ничего не происходит', async () => {
		const { container, inner } = setup();
		const detached = document.createElement('div');
		detached.tabIndex = -1;
		inner.focus();
		rescueFocus(container, () => detached);
		container.remove();
		await Promise.resolve();
		expect(document.activeElement).toBe(document.body);
	});
});
