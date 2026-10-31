import { afterEach, describe, expect, it } from 'vitest';

import { isInteractiveTarget } from './is-interactive-target';

// строка с одной ячейкой, в ячейку подставляется произвольная разметка
function makeRow(cellHtml: string): { row: HTMLTableRowElement; cell: HTMLTableCellElement } {
	document.body.innerHTML = `<table><tbody><tr><td>${cellHtml}</td></tr></tbody></table>`;
	const row = document.querySelector('tr');
	const cell = document.querySelector('td');
	if (!row || !cell) {
		throw new Error('row is missing');
	}
	return { row, cell };
}

describe('isInteractiveTarget', () => {
	afterEach(() => {
		document.body.replaceChildren();
	});

	it('ячейка с обычным текстом не интерактивна', () => {
		const { row, cell } = makeRow('<span>текст</span>');
		expect(isInteractiveTarget(cell, row)).toBe(false);
		expect(isInteractiveTarget(cell.firstElementChild, row)).toBe(false);
	});

	it('сама строка не считается интерактивной целью', () => {
		const { row } = makeRow('текст');
		expect(isInteractiveTarget(row, row)).toBe(false);
	});

	it('button и вложенный в него элемент интерактивны', () => {
		const { row } = makeRow('<button><span id="inner">ок</span></button>');
		expect(isInteractiveTarget(document.getElementById('inner'), row)).toBe(true);
	});

	it('a с href интерактивна, без href нет', () => {
		const withHref = makeRow('<a href="#x" id="link">ссылка</a>');
		expect(isInteractiveTarget(document.getElementById('link'), withHref.row)).toBe(true);
		const without = makeRow('<a id="link">ссылка</a>');
		expect(isInteractiveTarget(document.getElementById('link'), without.row)).toBe(false);
	});

	it('поля ввода, select, textarea, label, summary интерактивны', () => {
		for (const html of ['<input id="x">', '<select id="x"></select>', '<textarea id="x"></textarea>', '<label id="x">а</label>']) {
			const { row } = makeRow(html);
			expect(isInteractiveTarget(document.getElementById('x'), row), html).toBe(true);
		}
	});

	it('роли button, combobox, menuitem, option и contenteditable интерактивны', () => {
		for (const html of [
			'<div role="button" id="x"></div>',
			'<div role="combobox" id="x"></div>',
			'<div role="menuitem" id="x"></div>',
			'<div role="option" id="x"></div>',
			'<div contenteditable="true" id="x"></div>'
		]) {
			const { row } = makeRow(html);
			expect(isInteractiveTarget(document.getElementById('x'), row), html).toBe(true);
		}
	});

	it('предок с data-grid-no-select делает вложенное интерактивным', () => {
		const { row } = makeRow('<div data-grid-no-select><span id="x">внутри</span></div>');
		expect(isInteractiveTarget(document.getElementById('x'), row)).toBe(true);
	});

	it('цель вне строки (панель в корне грида) считается интерактивной', () => {
		const { row } = makeRow('текст');
		const outside = document.createElement('div');
		document.body.append(outside);
		expect(isInteractiveTarget(outside, row)).toBe(true);
	});

	it('null и текстовый узел обрабатываются без ошибки', () => {
		const { row, cell } = makeRow('<span>текст</span>');
		expect(isInteractiveTarget(null, row)).toBe(true);
		const text = document.createTextNode('привет');
		cell.append(text);
		expect(isInteractiveTarget(text, row)).toBe(false);
	});
});
