import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library';
import { createSignal, type JSX } from 'solid-js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { installListGeometry } from '../../internal/testing/list-geometry';
import { Field } from '../field';

import { Select, type SelectProps } from './index';

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

function manyUsers(count: number): User[] {
	return Array.from({ length: count }, (_, index) => ({ id: index, name: `Сотрудник ${index}`, team: 'Все' }));
}

type Extra = Partial<SelectProps<User>>;

function Basic(props: Extra): JSX.Element {
	return (
		<Select<User>
			items={users}
			getKey={(user) => user.id}
			getLabel={(user) => user.name}
			placeholder='Выберите'
			{...props}
		/>
	);
}

function combobox(): HTMLElement {
	return screen.getByRole('combobox');
}

function optionLabels(): (string | null)[] {
	return screen.getAllByRole('option').map((option) => option.textContent);
}

function activeOptionLabel(): string | null | undefined {
	const id = combobox().getAttribute('aria-activedescendant');
	return id === null ? undefined : document.getElementById(id)?.textContent;
}

function press(key: string, init: KeyboardEventInit = {}): boolean {
	return fireEvent.keyDown(combobox(), { key, ...init });
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

describe('Select: триггер', () => {
	it('закрытый: роли и атрибуты, плейсхолдер', () => {
		render(() => <Basic/>);
		const trigger = combobox();
		expect(trigger.tagName).toBe('BUTTON');
		expect(trigger.getAttribute('type')).toBe('button');
		expect(trigger.getAttribute('aria-haspopup')).toBe('listbox');
		expect(trigger.getAttribute('aria-expanded')).toBe('false');
		expect(trigger.hasAttribute('aria-controls')).toBe(false);
		expect(trigger.hasAttribute('aria-activedescendant')).toBe(false);
		expect(trigger.textContent).toBe('Выберите');
		expect(screen.queryByRole('listbox')).toBeNull();
	});

	it('показывает подпись выбранного, renderValue и значение вне items', () => {
		const { unmount } = render(() => <Basic defaultValue={users[1] ?? null}/>);
		expect(combobox().textContent).toBe('Борис');
		unmount();
		render(() => <Basic value={{ id: 99, name: 'Внешний', team: 'x' }} renderValue={(user) => <i>{user.name}!</i>}/>);
		expect(combobox().textContent).toBe('Внешний!');
	});

	it('атрибуты Field: id, aria-describedby, aria-invalid, метка указывает на кнопку', () => {
		render(() => (
			<Field label='Сотрудник' hint='Подсказка'>
				{(control) => <Basic {...control}/>}
			</Field>
		));
		const trigger = screen.getByLabelText('Сотрудник');
		expect(trigger).toBe(combobox());
		expect(trigger.getAttribute('aria-describedby')).toBe(`${trigger.id}-hint`);
		cleanup();
		render(() => <Basic aria-invalid={true}/>);
		expect(combobox().getAttribute('aria-invalid')).toBe('true');
	});

	it('disabled: кнопка отключена, клик и клавиши не открывают', () => {
		render(() => <Basic disabled/>);
		const trigger = combobox();
		expect((trigger as HTMLButtonElement).disabled).toBe(true);
		fireEvent.click(trigger);
		press('ArrowDown');
		expect(screen.queryByRole('listbox')).toBeNull();
	});

	it('Trigger и Content вне Select.Root бросают понятную ошибку', () => {
		vi.spyOn(console, 'error').mockImplementation(() => undefined);
		expect(() => render(() => <Select.Trigger/>)).toThrow('Select.Trigger must be used inside Select.Root');
		expect(() => render(() => <Select.Content/>)).toThrow('Select.Content must be used inside Select.Root');
	});
});

describe('Select: открытие и закрытие', () => {
	it('клик открывает и закрывает, aria-expanded и aria-controls', () => {
		render(() => <Basic/>);
		fireEvent.click(combobox());
		expect(combobox().getAttribute('aria-expanded')).toBe('true');
		const listbox = screen.getByRole('listbox');
		expect(combobox().getAttribute('aria-controls')).toBe(listbox.id);
		fireEvent.click(combobox());
		expect(screen.queryByRole('listbox')).toBeNull();
		expect(combobox().getAttribute('aria-expanded')).toBe('false');
	});

	it.each(['ArrowDown', 'ArrowUp', 'Enter', ' '])('клавиша %j на закрытой кнопке открывает список', (key) => {
		render(() => <Basic/>);
		expect(press(key)).toBe(false);
		expect(screen.getByRole('listbox')).toBeDefined();
	});

	it('пробел на keyup не активирует кнопку повторно', () => {
		render(() => <Basic/>);
		press(' ');
		expect(fireEvent.keyUp(combobox(), { key: ' ' })).toBe(false);
	});

	it('Esc закрывает список, фокус остаётся на кнопке', () => {
		render(() => <Basic/>);
		combobox().focus();
		fireEvent.click(combobox());
		fireEvent.keyDown(document.body, { key: 'Escape' });
		expect(screen.queryByRole('listbox')).toBeNull();
		expect(document.activeElement).toBe(combobox());
	});

	it('клик снаружи закрывает', () => {
		render(() => <Basic/>);
		fireEvent.click(combobox());
		fireEvent.pointerDown(document.body);
		expect(screen.queryByRole('listbox')).toBeNull();
	});

	it('Tab закрывает без выбора и без отмены перехода фокуса', () => {
		const onValueChange = vi.fn();
		render(() => <Basic onValueChange={onValueChange}/>);
		press('ArrowDown');
		press('ArrowDown');
		expect(press('Tab')).toBe(true);
		expect(screen.queryByRole('listbox')).toBeNull();
		expect(onValueChange).not.toHaveBeenCalled();
	});

	it('controlled open: клик только сообщает о смене, решает проп', () => {
		const onOpenChange = vi.fn();
		render(() => <Basic open={false} onOpenChange={onOpenChange}/>);
		fireEvent.click(combobox());
		expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(true);
		expect(screen.queryByRole('listbox')).toBeNull();
	});

	it('controlled open: проп открывает список', () => {
		const [open, setOpen] = createSignal(false);
		render(() => <Basic open={open()}/>);
		expect(screen.queryByRole('listbox')).toBeNull();
		setOpen(true);
		expect(screen.getByRole('listbox')).toBeDefined();
	});

	it('defaultOpen открывает список сразу', () => {
		render(() => <Basic defaultOpen/>);
		expect(screen.getByRole('listbox')).toBeDefined();
	});
});

describe('Select: подсветка и навигация', () => {
	it('при открытии подсвечена выбранная опция, иначе первая доступная', () => {
		const { unmount } = render(() => <Basic defaultValue={users[3] ?? null}/>);
		fireEvent.click(combobox());
		expect(activeOptionLabel()).toBe('Глеб');
		unmount();
		render(() => <Basic/>);
		fireEvent.click(combobox());
		expect(activeOptionLabel()).toBe('Анна');
	});

	it('стрелки, Home и End идут по доступным опциям без зацикливания', () => {
		render(() => <Basic isItemDisabled={(user) => user.blocked === true}/>);
		press('ArrowDown');
		expect(activeOptionLabel()).toBe('Анна');
		press('ArrowDown');
		expect(activeOptionLabel()).toBe('Борис');
		press('ArrowDown');
		expect(activeOptionLabel()).toBe('Глеб');
		press('ArrowDown');
		expect(activeOptionLabel()).toBe('Глеб');
		press('Home');
		expect(activeOptionLabel()).toBe('Анна');
		press('End');
		expect(activeOptionLabel()).toBe('Глеб');
		press('ArrowUp');
		press('ArrowUp');
		expect(activeOptionLabel()).toBe('Анна');
	});

	it('typeahead: буква переводит подсветку на опцию', () => {
		render(() => <Basic/>);
		press('ArrowDown');
		press('г');
		expect(activeOptionLabel()).toBe('Глеб');
	});

	it('наведение мыши подсвечивает опцию с источником pointer', () => {
		render(() => <Basic/>);
		fireEvent.click(combobox());
		fireEvent.mouseMove(screen.getAllByRole('option')[1] as HTMLElement);
		expect(activeOptionLabel()).toBe('Борис');
		expect(screen.getByRole('listbox').getAttribute('data-active-source')).toBe('pointer');
	});

	it('закрытие сбрасывает aria-activedescendant', () => {
		render(() => <Basic/>);
		press('ArrowDown');
		expect(combobox().hasAttribute('aria-activedescendant')).toBe(true);
		press('Escape');
		expect(combobox().hasAttribute('aria-activedescendant')).toBe(false);
	});

	it('1000 элементов: выбранный вне окна попадает в окно, стрелка и PageDown двигают подсветку', () => {
		const list = manyUsers(1000);
		render(() => <Basic items={list} defaultValue={list[500] ?? null}/>);
		fireEvent.click(combobox());
		expect(activeOptionLabel()).toBe('Сотрудник 500');
		expect(screen.getAllByRole('option').length).toBeLessThan(20);
		press('ArrowDown');
		expect(activeOptionLabel()).toBe('Сотрудник 501');
		// страница это число полностью помещающихся строк: окно 100 px при оценке строки 32 px даёт 3
		press('PageDown');
		expect(activeOptionLabel()).toBe('Сотрудник 504');
		press('End');
		expect(activeOptionLabel()).toBe('Сотрудник 999');
		expect(document.getElementById(combobox().getAttribute('aria-activedescendant') ?? '')).not.toBeNull();
	});

	it('смена items при открытом списке: подсветка сохраняется или уходит на первую доступную', () => {
		const [items, setItems] = createSignal(users);
		render(() => <Basic items={items()}/>);
		press('ArrowDown');
		press('ArrowDown');
		expect(activeOptionLabel()).toBe('Борис');
		setItems(users.filter((user) => user.id !== 1));
		expect(activeOptionLabel()).toBe('Борис');
		setItems(users.filter((user) => user.id === 4));
		expect(activeOptionLabel()).toBe('Глеб');
	});
});

describe('Select: выбор', () => {
	it('Enter выбирает активную опцию: onValueChange один раз, список закрыт, фокус на кнопке', () => {
		const onValueChange = vi.fn();
		render(() => <Basic onValueChange={onValueChange}/>);
		combobox().focus();
		press('ArrowDown');
		press('ArrowDown');
		expect(press('Enter')).toBe(false);
		expect(onValueChange).toHaveBeenCalledExactlyOnceWith(users[1]);
		expect(screen.queryByRole('listbox')).toBeNull();
		expect(combobox().textContent).toBe('Борис');
		expect(document.activeElement).toBe(combobox());
	});

	it('Space и клик тоже выбирают', () => {
		const onValueChange = vi.fn();
		const { unmount } = render(() => <Basic onValueChange={onValueChange}/>);
		press('ArrowDown');
		press(' ');
		expect(onValueChange).toHaveBeenLastCalledWith(users[0]);
		unmount();
		render(() => <Basic onValueChange={onValueChange}/>);
		fireEvent.click(combobox());
		fireEvent.click(screen.getAllByRole('option')[3] as HTMLElement);
		expect(onValueChange).toHaveBeenLastCalledWith(users[3]);
	});

	it('повторный выбор того же значения не вызывает onValueChange и не снимает выбор', () => {
		const onValueChange = vi.fn();
		render(() => <Basic defaultValue={users[1] ?? null} onValueChange={onValueChange}/>);
		fireEvent.click(combobox());
		fireEvent.click(screen.getAllByRole('option')[1] as HTMLElement);
		expect(onValueChange).not.toHaveBeenCalled();
		expect(combobox().textContent).toBe('Борис');
		expect(screen.queryByRole('listbox')).toBeNull();
	});

	it('отключённая опция не выбирается', () => {
		const onValueChange = vi.fn();
		render(() => <Basic isItemDisabled={(user) => user.blocked === true} onValueChange={onValueChange}/>);
		fireEvent.click(combobox());
		fireEvent.click(screen.getAllByRole('option')[2] as HTMLElement);
		expect(onValueChange).not.toHaveBeenCalled();
		expect(screen.getByRole('listbox')).toBeDefined();
	});

	it('controlled value: выбор только сообщается, подпись следует за пропом', () => {
		const [value, setValue] = createSignal<User | null>(null);
		const onValueChange = vi.fn();
		render(() => <Basic value={value()} onValueChange={onValueChange}/>);
		fireEvent.click(combobox());
		fireEvent.click(screen.getAllByRole('option')[1] as HTMLElement);
		expect(onValueChange).toHaveBeenCalledExactlyOnceWith(users[1]);
		expect(combobox().textContent).toBe('Выберите');
		setValue(users[1] ?? null);
		expect(combobox().textContent).toBe('Борис');
	});

	it('выбранная опция отмечена aria-selected', () => {
		render(() => <Basic defaultValue={users[1] ?? null}/>);
		fireEvent.click(combobox());
		const selected = screen.getAllByRole('option').filter((option) => option.getAttribute('aria-selected') === 'true');
		expect(selected.map((option) => option.textContent)).toEqual(['Борис']);
	});
});

describe('Select: содержимое списка', () => {
	it('группы: заголовки и сквозная нумерация опций', () => {
		render(() => <Basic groupBy={(user) => user.team}/>);
		fireEvent.click(combobox());
		expect(optionLabels()).toEqual(['Анна', 'Вера', 'Борис', 'Глеб']);
		const posinset = screen.getAllByRole('option').map((option) => option.getAttribute('aria-posinset'));
		expect(posinset).toEqual(['1', '2', '3', '4']);
		const headers = screen.getAllByRole('presentation').filter((element) => element.hasAttribute('data-index'));
		expect(headers.map((header) => header.textContent)).toEqual(['Дизайн', 'Разработка']);
	});

	it('renderOption и renderGroupHeader', () => {
		render(() => (
			<Basic
				groupBy={(user) => user.team}
				renderOption={(user) => <em>{user.name.toUpperCase()}</em>}
				renderGroupHeader={(label) => <b>группа {label}</b>}
			/>
		));
		fireEvent.click(combobox());
		expect(screen.getByText('АННА')).toBeDefined();
		expect(screen.getByText('группа Дизайн')).toBeDefined();
	});

	it('loading и пустой список показывают тексты', () => {
		const { unmount } = render(() => <Basic loading/>);
		fireEvent.click(combobox());
		expect(screen.getByRole('status').textContent).toBe('Загрузка…');
		unmount();
		const second = render(() => <Basic items={[]} emptyText='Ничего нет'/>);
		fireEvent.click(combobox());
		expect(screen.getByText('Ничего нет')).toBeDefined();
		second.unmount();
		render(() => <Basic items={[]} loadingText='Ждём'/>);
		fireEvent.click(combobox());
		expect(screen.getByText('Нет элементов для отображения')).toBeDefined();
	});

	it('virtualized: в DOM только окно; virtualized=false рендерит все строки', () => {
		const list = manyUsers(300);
		const { unmount } = render(() => <Basic items={list}/>);
		fireEvent.click(combobox());
		expect(screen.getAllByRole('option').length).toBeLessThan(20);
		unmount();
		render(() => <Basic items={list} virtualized={false}/>);
		fireEvent.click(combobox());
		expect(screen.getAllByRole('option')).toHaveLength(300);
	});

	it('опции в top layer-панели: панель показана через Popover API, список внутри неё', () => {
		render(() => <Basic/>);
		fireEvent.click(combobox());
		expect(showPopover).toHaveBeenCalled();
		expect(screen.getByRole('listbox').closest('[data-s-kit]')).not.toBeNull();
	});
});

describe('Select: части и изоляция', () => {
	it('составная форма: Root, Trigger, Content собираются вручную', () => {
		render(() => (
			<Select.Root items={users} getKey={(user) => user.id} getLabel={(user) => user.name} defaultValue={users[0] ?? null}>
				<Select.Trigger<User> renderValue={(user) => <span>[{user.name}]</span>}/>
				<Select.Content<User> renderOption={(user) => <span>{user.name}</span>}/>
			</Select.Root>
		));
		expect(combobox().textContent).toBe('[Анна]');
		fireEvent.click(combobox());
		expect(optionLabels()).toEqual(['Анна', 'Борис', 'Вера', 'Глеб']);
	});

	it('клик по опции не доходит до обработчиков предков триггера', () => {
		const onCardClick = vi.fn();
		render(() => (
			<div onClick={onCardClick}>
				<Basic/>
			</div>
		));
		fireEvent.click(combobox());
		onCardClick.mockClear();
		fireEvent.click(screen.getAllByRole('option')[0] as HTMLElement);
		expect(onCardClick).not.toHaveBeenCalled();
	});
});
