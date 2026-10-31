import { afterEach, describe, expect, it } from 'vitest';

import { closestRow } from './closest-row';

afterEach(() => {
	document.body.replaceChildren();
});

function mount(html: string): HTMLElement {
	const host = document.createElement('table');
	host.innerHTML = html;
	document.body.append(host);
	return host;
}

describe('closestRow', () => {
	it('находит строку по цели внутри ячейки и по самой строке', () => {
		const host = mount('<tbody><tr data-index="4"><td><button>x</button></td></tr></tbody>');
		const tr = host.querySelector('tr') as HTMLTableRowElement;
		expect(closestRow(host.querySelector('button'))).toEqual({ tr, index: 4 });
		expect(closestRow(tr)).toEqual({ tr, index: 4 });
	});

	it('spacer-строка без data-index и шапка строкой не считаются', () => {
		const host = mount('<thead><tr><th>h</th></tr></thead><tbody><tr aria-hidden="true"><td>s</td></tr></tbody>');
		expect(closestRow(host.querySelector('th'))).toBeUndefined();
		expect(closestRow(host.querySelector('td'))).toBeUndefined();
	});

	it('null и не-элемент дают undefined', () => {
		expect(closestRow(null)).toBeUndefined();
		expect(closestRow(document)).toBeUndefined();
	});
});
