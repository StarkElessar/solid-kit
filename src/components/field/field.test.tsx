import { cleanup, render, screen } from '@solidjs/testing-library';
import { createSignal } from 'solid-js';
import { afterEach, describe, expect, it } from 'vitest';

import { Field } from './field';

afterEach(cleanup);

function describedText(control: HTMLElement): string {
	const ids = control.getAttribute('aria-describedby')?.split(' ') ?? [];
	return ids.map((id) => document.getElementById(id)?.textContent ?? '').join(' ');
}

describe('Field', () => {
	it('links the label to the control', () => {
		render(() => <Field label='Имя'>{(control) => <input {...control}/>}</Field>);
		const input = screen.getByLabelText('Имя');
		expect(input.tagName).toBe('INPUT');
		expect(input.id).not.toBe('');
	});

	it('uses the given id for the control and the label', () => {
		render(() => <Field label='Имя' id='name-field'>{(control) => <input {...control}/>}</Field>);
		expect(screen.getByLabelText('Имя').id).toBe('name-field');
	});

	it('gives two fields different ids', () => {
		render(() => (
			<>
				<Field label='Первое'>{(control) => <input {...control}/>}</Field>
				<Field label='Второе'>{(control) => <input {...control}/>}</Field>
			</>
		));
		expect(screen.getByLabelText('Первое').id).not.toBe(screen.getByLabelText('Второе').id);
	});

	it('shows the hint and describes the control with it', () => {
		render(() => <Field label='Имя' hint='Как в паспорте'>{(control) => <input {...control}/>}</Field>);
		const input = screen.getByLabelText('Имя');
		expect(describedText(input)).toBe('Как в паспорте');
		expect(input.hasAttribute('aria-invalid')).toBe(false);
	});

	it('shows the error instead of the hint and marks the control invalid', () => {
		render(() => (
			<Field label='Имя' hint='Как в паспорте' error='Обязательное поле'>
				{(control) => <input {...control}/>}
			</Field>
		));
		const input = screen.getByLabelText('Имя');
		expect(describedText(input)).toBe('Обязательное поле');
		expect(input.getAttribute('aria-invalid')).toBe('true');
		expect(screen.queryByText('Как в паспорте')).toBeNull();
	});

	it('has no description and no invalid mark without a hint or an error', () => {
		render(() => <Field label='Имя'>{(control) => <input {...control}/>}</Field>);
		const input = screen.getByLabelText('Имя');
		expect(input.hasAttribute('aria-describedby')).toBe(false);
		expect(input.hasAttribute('aria-invalid')).toBe(false);
	});

	it('follows the error appearing and disappearing', () => {
		const [error, setError] = createSignal<string | undefined>();
		render(() => (
			<Field label='Имя' hint='Подсказка' error={error()}>
				{(control) => <input {...control}/>}
			</Field>
		));
		const input = screen.getByLabelText('Имя');
		expect(describedText(input)).toBe('Подсказка');
		setError('Обязательно');
		expect(describedText(input)).toBe('Обязательно');
		expect(input.getAttribute('aria-invalid')).toBe('true');
		setError(undefined);
		expect(describedText(input)).toBe('Подсказка');
		expect(input.hasAttribute('aria-invalid')).toBe(false);
	});

	it.each([undefined, null, false, ''] as const)('treats %j as no error', (empty) => {
		render(() => <Field label='Имя' error={empty}>{(control) => <input {...control}/>}</Field>);
		expect(screen.getByLabelText('Имя').hasAttribute('aria-invalid')).toBe(false);
	});

	it('sets the root attributes: size only when passed, invalid only with an error', () => {
		render(() => (
			<>
				<Field label='Один' data-testid='plain'>{(control) => <input {...control}/>}</Field>
				<Field label='Два' size='sm' error='Ошибка' data-testid='sized'>{(control) => <input {...control}/>}</Field>
			</>
		));
		const plain = screen.getByTestId('plain');
		const sized = screen.getByTestId('sized');
		expect(plain.hasAttribute('data-s-kit')).toBe(true);
		expect(plain.hasAttribute('data-s-kit-size')).toBe(false);
		expect(plain.hasAttribute('data-invalid')).toBe(false);
		expect(sized.getAttribute('data-s-kit-size')).toBe('sm');
		expect(sized.hasAttribute('data-invalid')).toBe(true);
	});

	it('forwards class and style to the root', () => {
		render(() => (
			<Field label='Имя' class='extra' style={{ 'margin-inline-start': '4px' }} data-testid='root'>
				{(control) => <input {...control}/>}
			</Field>
		));
		const root = screen.getByTestId('root');
		expect(root.classList.contains('extra')).toBe(true);
		expect(root.style.marginInlineStart).toBe('4px');
	});
});
