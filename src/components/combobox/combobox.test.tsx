import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library';
import { createSignal, type JSX, untrack } from 'solid-js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { installListGeometry } from '../../internal/testing/list-geometry';
import { Field } from '../field';

import { Combobox, type ComboboxProps } from './index';

interface User {
	id: number;
	name: string;
	team: string;
	blocked?: boolean;
}

const users: User[] = [
	{ id: 1, name: 'Анна', team: 'Дизайн' },
	{ id: 2, name: 'Борис', team: 'Разработка' },
	{ id: 3, name: 'Вера', team: 'Дизайн', blocked: true },
	{ id: 4, name: 'Глеб', team: 'Разработка' }
];

const similar: User[] = [
	{ id: 1, name: 'Анна', team: 'a' },
	{ id: 2, name: 'Ангелина', team: 'a' },
	{ id: 3, name: 'Борис', team: 'b' }
];

function manyUsers(count: number): User[] {
	return Array.from({ length: count }, (_, index) => ({ id: index, name: `Сотрудник ${index}`, team: 'Все' }));
}

type Extra = Partial<ComboboxProps<User>>;

function Basic(props: Extra): JSX.Element {
	return (
		<Combobox<User>
			items={users}
			getKey={(user) => user.id}
			getLabel={(user) => user.name}
			isItemDisabled={(user) => user.blocked === true}
			placeholder='Сотрудник'
			virtualized={false}
			{...props}
		/>
	);
}

function field(): HTMLInputElement {
	return screen.getByRole('combobox');
}

function optionLabels(): (string | null)[] {
	return screen.getAllByRole('option').map((option) => option.textContent);
}

function activeLabel(): string | null | undefined {
	const id = field().getAttribute('aria-activedescendant');
	return id === null ? undefined : document.getElementById(id)?.textContent;
}

function type(text: string): void {
	fireEvent.input(field(), { target: { value: text } });
}

function press(key: string, init: KeyboardEventInit = {}): boolean {
	return fireEvent.keyDown(field(), { key, ...init });
}

const showPopover = vi.fn(function (this: HTMLElement) {
	this.removeAttribute('popover');
});

beforeEach(() => {
	// jsdom не реализует Popover API и считает содержимое закрытого [popover] нефокусируемым: «показ» снимает атрибут
	showPopover.mockClear();
	HTMLElement.prototype.showPopover = showPopover;
	HTMLElement.prototype.hidePopover = vi.fn();
	installListGeometry({ rowHeight: 20, viewportHeight: 100 });
	vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation(() => 0);
});

afterEach(cleanup);

describe('Combobox: поле', () => {
	it('закрытый: роли и атрибуты, шеврон вне табуляции с подписью', () => {
		render(() => <Basic/>);
		const input = field();
		expect(input.tagName).toBe('INPUT');
		expect(input.getAttribute('aria-autocomplete')).toBe('list');
		expect(input.getAttribute('aria-haspopup')).toBe('listbox');
		expect(input.getAttribute('aria-expanded')).toBe('false');
		expect(input.hasAttribute('aria-controls')).toBe(false);
		expect(input.hasAttribute('aria-activedescendant')).toBe(false);
		expect(input.getAttribute('autocomplete')).toBe('off');
		expect(input.getAttribute('placeholder')).toBe('Сотрудник');
		const toggle = screen.getByRole('button', { name: 'Показать список' });
		expect(toggle.getAttribute('tabindex')).toBe('-1');
		expect(screen.queryByRole('listbox')).toBeNull();
	});

	it('подпись шеврона задаётся пропсом', () => {
		render(() => <Basic toggleLabel='Открыть'/>);
		expect(screen.getByRole('button', { name: 'Открыть' })).toBeTruthy();
	});

	it('текст по умолчанию это подпись значения; defaultQuery важнее', () => {
		const { unmount } = render(() => <Basic defaultValue={users[1] ?? null}/>);
		expect(field().value).toBe('Борис');
		unmount();
		render(() => <Basic defaultValue={users[1] ?? null} defaultQuery='Бо'/>);
		expect(field().value).toBe('Бо');
	});

	it('атрибуты Field: id, aria-describedby, aria-invalid, метка указывает на поле', () => {
		render(() => (
			<Field label='Сотрудник' hint='Подсказка'>
				{(control) => <Basic {...control}/>}
			</Field>
		));
		const input = screen.getByLabelText('Сотрудник');
		expect(input).toBe(field());
		expect(input.getAttribute('aria-describedby')).toBe(`${input.id}-hint`);
	});

	it('disabled: поле и шеврон отключены, список не открывается', () => {
		render(() => <Basic disabled/>);
		expect(field().disabled).toBe(true);
		expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Показать список' }).disabled).toBe(true);
		press('ArrowDown');
		expect(screen.queryByRole('listbox')).toBeNull();
	});

	it('ошибка вне Combobox.Root', () => {
		expect(() => render(() => <Combobox.Input/>)).toThrow('Combobox.Input must be used inside Combobox.Root');
		expect(() => render(() => <Combobox.Content/>)).toThrow('Combobox.Content must be used inside Combobox.Root');
	});
});

describe('Combobox: печать и фильтр', () => {
	it('печать открывает список и фильтрует по подписи без учёта регистра', () => {
		render(() => <Basic/>);
		type('Е');
		expect(field().getAttribute('aria-expanded')).toBe('true');
		expect(optionLabels()).toEqual(['Вера', 'Глеб']);
		expect(field().getAttribute('aria-controls')).toBe(screen.getByRole('listbox').id);
	});

	it('своя функция фильтра', () => {
		render(() => <Basic filter={(user, query) => user.team === query}/>);
		type('Дизайн');
		expect(optionLabels()).toEqual(['Анна', 'Вера']);
	});

	it('filter={false}: items показываются как пришли', () => {
		render(() => <Basic filter={false}/>);
		type('яяя');
		expect(optionLabels()).toEqual(['Анна', 'Борис', 'Вера', 'Глеб']);
	});

	it('onQueryChange получает текст и причину input на каждое изменение', () => {
		const onQueryChange = vi.fn();
		render(() => <Basic onQueryChange={onQueryChange}/>);
		type('а');
		type('ан');
		expect(onQueryChange.mock.calls).toEqual([['а', 'input'], ['ан', 'input']]);
	});

	it('открытие без печати показывает все опции даже при выбранном значении', () => {
		render(() => <Basic defaultValue={users[1] ?? null}/>);
		press('ArrowDown');
		expect(optionLabels()).toEqual(['Анна', 'Борис', 'Вера', 'Глеб']);
		expect(activeLabel()).toBe('Борис');
	});

	it('печать подсвечивает первую доступную опцию, а не выбранную', () => {
		render(() => <Basic items={similar} defaultValue={similar[1] ?? null}/>);
		type('ан');
		expect(optionLabels()).toEqual(['Анна', 'Ангелина']);
		expect(activeLabel()).toBe('Анна');
	});

	it('следующая печать снова переносит подсветку на первую доступную', () => {
		render(() => <Basic items={similar}/>);
		type('а');
		press('ArrowDown');
		expect(activeLabel()).toBe('Ангелина');
		type('ан');
		expect(activeLabel()).toBe('Анна');
	});

	it('пустой результат показывает emptyText, loading показывает текст загрузки', () => {
		const { unmount } = render(() => <Basic/>);
		type('яяя');
		expect(screen.getByText('Нет элементов для отображения')).toBeTruthy();
		unmount();
		render(() => <Basic loading loadingText='Ищем…'/>);
		press('ArrowDown');
		expect(screen.getByText('Ищем…')).toBeTruthy();
	});

	it('группы с заголовками сохраняются при фильтре', () => {
		render(() => <Basic groupBy={(user) => user.team}/>);
		type('е');
		expect(screen.getByText('Дизайн')).toBeTruthy();
		expect(screen.getByText('Разработка')).toBeTruthy();
		expect(optionLabels()).toEqual(['Вера', 'Глеб']);
	});
});

describe('Combobox: клавиши', () => {
	it('ArrowDown и ArrowUp на закрытом списке открывают его', () => {
		const { unmount } = render(() => <Basic/>);
		expect(press('ArrowDown')).toBe(false);
		expect(field().getAttribute('aria-expanded')).toBe('true');
		unmount();
		render(() => <Basic/>);
		expect(press('ArrowUp')).toBe(false);
		expect(field().getAttribute('aria-expanded')).toBe('true');
	});

	it('стрелки двигают подсветку мимо отключённой опции, aria-activedescendant совпадает с [data-active]', () => {
		render(() => <Basic/>);
		press('ArrowDown');
		expect(activeLabel()).toBe('Анна');
		press('ArrowDown');
		expect(activeLabel()).toBe('Борис');
		press('ArrowDown');
		expect(activeLabel()).toBe('Глеб');
		expect(document.querySelector('[data-active]')?.id).toBe(field().getAttribute('aria-activedescendant'));
		press('ArrowUp');
		expect(activeLabel()).toBe('Борис');
	});

	it('PageDown двигает подсветку на страницу', () => {
		render(() => <Basic items={manyUsers(50)}/>);
		press('ArrowDown');
		expect(activeLabel()).toBe('Сотрудник 0');
		press('PageDown');
		expect(activeLabel()).toBe('Сотрудник 3');
	});

	it('Home, End, Space и обычные буквы остаются полю', () => {
		render(() => <Basic/>);
		press('ArrowDown');
		expect(press('Home')).toBe(true);
		expect(press('End')).toBe(true);
		expect(press(' ')).toBe(true);
		expect(press('a')).toBe(true);
		expect(activeLabel()).toBe('Анна');
	});

	it('Enter с активной опцией выбирает её, закрывает список и отменяет действие по умолчанию', () => {
		const onValueChange = vi.fn();
		render(() => <Basic onValueChange={onValueChange}/>);
		press('ArrowDown');
		press('ArrowDown');
		expect(press('Enter')).toBe(false);
		expect(onValueChange).toHaveBeenCalledWith(users[1]);
		expect(field().value).toBe('Борис');
		expect(field().getAttribute('aria-expanded')).toBe('false');
	});

	it('Enter без активной опции и при закрытом списке ничего не перехватывает', () => {
		render(() => <Basic/>);
		expect(press('Enter')).toBe(true);
		type('яяя');
		expect(press('Enter')).toBe(true);
		expect(field().getAttribute('aria-expanded')).toBe('true');
	});

	it('Enter во время композиции ввода не выбирает', () => {
		const onValueChange = vi.fn();
		render(() => <Basic onValueChange={onValueChange}/>);
		press('ArrowDown');
		press('Enter', { isComposing: true });
		expect(onValueChange).not.toHaveBeenCalled();
	});

	it('Esc закрывает список, фокус и текст остаются', () => {
		render(() => <Basic/>);
		field().focus();
		type('ан');
		fireEvent.keyDown(document.body, { key: 'Escape' });
		expect(field().getAttribute('aria-expanded')).toBe('false');
		expect(document.activeElement).toBe(field());
		expect(field().value).toBe('ан');
	});

	it('Tab закрывает список без отмены клавиши', () => {
		render(() => <Basic/>);
		press('ArrowDown');
		expect(press('Tab')).toBe(true);
		expect(field().getAttribute('aria-expanded')).toBe('false');
	});
});

describe('Combobox: выбор и значение', () => {
	it('клик по опции выбирает её; отключённая опция не выбирается', () => {
		const onValueChange = vi.fn();
		render(() => <Basic onValueChange={onValueChange}/>);
		press('ArrowDown');
		fireEvent.click(screen.getByRole('option', { name: 'Вера' }));
		expect(onValueChange).not.toHaveBeenCalled();
		fireEvent.click(screen.getByRole('option', { name: 'Глеб' }));
		expect(onValueChange).toHaveBeenCalledWith(users[3]);
		expect(field().value).toBe('Глеб');
	});

	it('после выбора текст равен подписи, причина reset', () => {
		const onQueryChange = vi.fn();
		render(() => <Basic onQueryChange={onQueryChange}/>);
		type('бо');
		press('Enter');
		expect(field().value).toBe('Борис');
		expect(onQueryChange.mock.calls).toEqual([['бо', 'input'], ['Борис', 'reset']]);
	});

	it('повторный выбор того же значения не вызывает onValueChange, но возвращает текст', () => {
		const onValueChange = vi.fn();
		render(() => <Basic defaultValue={users[1] ?? null} onValueChange={onValueChange}/>);
		type('бор');
		press('Enter');
		expect(onValueChange).not.toHaveBeenCalled();
		expect(field().value).toBe('Борис');
	});

	it('после выбора список открывается целиком', () => {
		render(() => <Basic/>);
		type('бо');
		press('Enter');
		press('ArrowDown');
		expect(optionLabels()).toEqual(['Анна', 'Борис', 'Вера', 'Глеб']);
	});

	it('уход из поля с напечатанным текстом возвращает подпись значения и закрывает список', () => {
		render(() => <Basic defaultValue={users[1] ?? null}/>);
		field().focus();
		type('ан');
		fireEvent.blur(field());
		expect(field().value).toBe('Борис');
		expect(field().getAttribute('aria-expanded')).toBe('false');
	});

	it('уход из поля с пустым текстом сбрасывает значение в null', () => {
		const onValueChange = vi.fn();
		render(() => <Basic defaultValue={users[1] ?? null} onValueChange={onValueChange}/>);
		type('');
		fireEvent.blur(field());
		expect(onValueChange).toHaveBeenCalledWith(null);
		expect(field().value).toBe('');
	});

	it('пустой текст без значения onValueChange не вызывает', () => {
		const onValueChange = vi.fn();
		render(() => <Basic onValueChange={onValueChange}/>);
		type('а');
		type('');
		fireEvent.blur(field());
		expect(onValueChange).not.toHaveBeenCalled();
	});

	it('внешняя смена значения меняет текст', () => {
		const [value, setValue] = createSignal<User | null>(users[0] ?? null);
		render(() => <Basic value={value()} onValueChange={setValue}/>);
		expect(field().value).toBe('Анна');
		setValue(users[3] ?? null);
		expect(field().value).toBe('Глеб');
		setValue(null);
		expect(field().value).toBe('');
	});
});

describe('Combobox: controlled и uncontrolled', () => {
	it('open: список следует за пропсом и сообщает о закрытии', () => {
		const onOpenChange = vi.fn();
		const [open, setOpen] = createSignal(false);
		render(() => <Basic open={open()} onOpenChange={onOpenChange}/>);
		expect(screen.queryByRole('listbox')).toBeNull();
		setOpen(true);
		expect(screen.getByRole('listbox')).toBeTruthy();
		fireEvent.keyDown(document.body, { key: 'Escape' });
		expect(onOpenChange).toHaveBeenCalledWith(false);
	});

	it('defaultOpen открывает список сразу', () => {
		render(() => <Basic defaultOpen/>);
		expect(screen.getByRole('listbox')).toBeTruthy();
	});

	it('query: текст в поле следует за пропсом', () => {
		const [query, setQuery] = createSignal('');
		render(() => <Basic query={query()} onQueryChange={setQuery}/>);
		type('ан');
		expect(untrack(query)).toBe('ан');
		expect(field().value).toBe('ан');
		setQuery('бор');
		expect(field().value).toBe('бор');
		expect(optionLabels()).toEqual(['Борис']);
	});

	it('value: контролируемое значение не меняется без ответа родителя', () => {
		const onValueChange = vi.fn();
		render(() => <Basic value={users[0] ?? null} onValueChange={onValueChange}/>);
		type('бо');
		press('Enter');
		expect(onValueChange).toHaveBeenCalledWith(users[1]);
		expect(field().value).toBe('Анна');
	});
});

describe('Combobox: шеврон', () => {
	it('клик открывает и закрывает список, фокус остаётся в поле, mousedown отменяется', () => {
		render(() => <Basic/>);
		const toggle = screen.getByRole('button', { name: 'Показать список' });
		expect(fireEvent.mouseDown(toggle)).toBe(false);
		fireEvent.click(toggle);
		expect(field().getAttribute('aria-expanded')).toBe('true');
		expect(document.activeElement).toBe(field());
		fireEvent.click(toggle);
		expect(field().getAttribute('aria-expanded')).toBe('false');
	});
});
