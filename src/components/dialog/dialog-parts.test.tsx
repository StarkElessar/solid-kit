import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { stubDialogApi } from '../../internal/testing/stub-dialog-api';

import { Dialog } from './index';

let dialogApi = stubDialogApi();

beforeEach(() => {
	dialogApi = stubDialogApi();
});

afterEach(() => {
	cleanup();
	dialogApi.restore();
});

function getDialog(): HTMLDialogElement {
	const dialog = document.querySelector('dialog');
	if (!dialog) {
		throw new Error('dialog is not rendered');
	}
	return dialog;
}

describe('Dialog parts', () => {
	it('Title and Description are linked to the dialog through aria-labelledby and aria-describedby', () => {
		render(() => (
			<Dialog.Root defaultOpen>
				<Dialog.Content>
					<Dialog.Title>Удалить запись?</Dialog.Title>
					<Dialog.Description>Действие нельзя отменить.</Dialog.Description>
				</Dialog.Content>
			</Dialog.Root>
		));
		const dialog = getDialog();
		const title = screen.getByRole('heading', { name: 'Удалить запись?' });
		expect(title.tagName).toBe('H2');
		expect(dialog.getAttribute('aria-labelledby')).toBe(title.id);
		const description = screen.getByText('Действие нельзя отменить.');
		expect(description.tagName).toBe('P');
		expect(dialog.getAttribute('aria-describedby')).toBe(description.id);
	});

	it('without Title and Description the dialog has neither attribute, and an explicit id of the title is respected', () => {
		render(() => (
			<Dialog.Root defaultOpen>
				<Dialog.Content aria-label='Без заголовка'>content</Dialog.Content>
			</Dialog.Root>
		));
		expect(getDialog().hasAttribute('aria-labelledby')).toBe(false);
		expect(getDialog().hasAttribute('aria-describedby')).toBe(false);
		cleanup();
		render(() => (
			<Dialog.Root defaultOpen>
				<Dialog.Content>
					<Dialog.Title id='my-title'>Заголовок</Dialog.Title>
				</Dialog.Content>
			</Dialog.Root>
		));
		expect(getDialog().getAttribute('aria-labelledby')).toBe('my-title');
	});

	it('Body, Footer and Title pass class, style and attributes through', () => {
		render(() => (
			<Dialog.Root defaultOpen>
				<Dialog.Content>
					<Dialog.Title class='t' data-part='title'>T</Dialog.Title>
					<Dialog.Body class='b' style={{ color: 'red' }} data-part='body'>B</Dialog.Body>
					<Dialog.Footer class='f' data-part='footer'>F</Dialog.Footer>
				</Dialog.Content>
			</Dialog.Root>
		));
		const body = screen.getByText('B');
		expect(body.className).toContain('b');
		expect(body.style.color).toBe('red');
		expect(body.getAttribute('data-part')).toBe('body');
		expect(screen.getByText('F').className).toContain('f');
		expect(screen.getByText('T').className).toContain('t');
	});

	it('Close closes the dialog, runs a user onClick first and honours preventDefault', () => {
		const onClick = vi.fn((event: MouseEvent) => {
			event.preventDefault();
		});
		render(() => (
			<Dialog.Root defaultOpen>
				<Dialog.Content>
					<Dialog.Close onClick={onClick}>Stay</Dialog.Close>
					<Dialog.Close variant='plain'>Отмена</Dialog.Close>
				</Dialog.Content>
			</Dialog.Root>
		));
		fireEvent.click(screen.getByRole('button', { name: 'Stay' }));
		expect(onClick).toHaveBeenCalledOnce();
		expect(document.querySelector('dialog')).not.toBeNull();
		fireEvent.click(screen.getByRole('button', { name: 'Отмена' }));
		expect(document.querySelector('dialog')).toBeNull();
	});

	it('every part outside Dialog.Root throws a clear error', () => {
		const silence = vi.spyOn(console, 'error').mockImplementation(() => {});
		expect(() => render(() => <Dialog.Title>x</Dialog.Title>)).toThrow('Dialog.Title must be used inside Dialog.Root');
		expect(() => render(() => <Dialog.Description>x</Dialog.Description>))
			.toThrow('Dialog.Description must be used inside Dialog.Root');
		expect(() => render(() => <Dialog.Close>x</Dialog.Close>)).toThrow('Dialog.Close must be used inside Dialog.Root');
		silence.mockRestore();
	});
});
