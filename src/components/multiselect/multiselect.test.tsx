import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library';
import { createSignal, type JSX } from 'solid-js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { installListGeometry } from '../../internal/testing/list-geometry';
import { Field } from '../field';

import { MultiSelect, type MultiSelectProps, type MultiSelectValue } from './index';

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

const [anna, boris, vera, gleb] = users as [User, User, User, User];

type Extra = Partial<MultiSelectProps<User>>;

function Basic(props: Extra): JSX.Element {
	return (
		<MultiSelect<User>
			items={users}
			getKey={(user) => user.id}
			getLabel={(user) => user.name}
			isItemDisabled={(user) => user.blocked === true}
			placeholder='Сотрудники'
			virtualized={false}
			{...props}
		/>
	);
}

function trigger(): HTMLButtonElement {
	const element = document.querySelector<HTMLButtonElement>('button[role="combobox"]');
	if (!element) {
		throw new Error('нет кнопки combobox');
	}
	return element;
}

function search(): HTMLInputElement {
	return screen.getByRole<HTMLInputElement>('combobox', { name: 'Поиск' });
}

function optionLabels(): (string | null)[] {
	return screen.getAllByRole('option').map((option) => option.textContent);
}

function chipLabels(): string[] {
	return [...document.querySelectorAll<HTMLElement>('[data-multiselect-chip]')]
		.filter((chip) => !chip.hidden)
		.map((chip) => chip.textContent);
}

function openList(): void {
	trigger().focus();
	fireEvent.click(trigger());
}

function option(name: string): HTMLElement {
	return screen.getByRole('option', { name });
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

describe('MultiSelect: триггер и ARIA', () => {
	it('закрытый: кнопка role=combobox, плейсхолдер, списка нет', () => {
		render(() => <Basic/>);
		expect(trigger().getAttribute('aria-haspopup')).toBe('listbox');
		expect(trigger().getAttribute('aria-expanded')).toBe('false');
		expect(trigger().hasAttribute('aria-controls')).toBe(false);
		expect(trigger().textContent).toBe('Сотрудники');
		expect(screen.queryByRole('listbox')).toBeNull();
	});

	it('открытый: aria-multiselectable, aria-selected у опций, aria-controls на список', () => {
		render(() => <Basic defaultValue={[boris]}/>);
		openList();
		const list = screen.getByRole('listbox');
		expect(list.getAttribute('aria-multiselectable')).toBe('true');
		expect(trigger().getAttribute('aria-expanded')).toBe('true');
		expect(trigger().getAttribute('aria-controls')).toBe(list.id);
		expect(option('Борис').getAttribute('aria-selected')).toBe('true');
		expect(option('Анна').getAttribute('aria-selected')).toBe('false');
		expect(option('Вера').getAttribute('aria-disabled')).toBe('true');
	});

	it('атрибуты Field: метка указывает на кнопку', () => {
		render(() => (
			<Field label='Сотрудники'>
				{(control) => <Basic {...control}/>}
			</Field>
		));
		expect(screen.getByLabelText('Сотрудники')).toBe(trigger());
	});

	it('disabled: список не открывается, × отключены', () => {
		render(() => <Basic disabled defaultValue={[anna]}/>);
		expect(trigger().disabled).toBe(true);
		expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Убрать: Анна' }).disabled).toBe(true);
		fireEvent.click(trigger());
		expect(screen.queryByRole('listbox')).toBeNull();
	});
});

describe('MultiSelect: значение', () => {
	it('uncontrolled: клик выбирает, повторный снимает, панель остаётся открытой, порядок выбора сохраняется', () => {
		const onValueChange = vi.fn();
		render(() => <Basic onValueChange={onValueChange}/>);
		openList();
		fireEvent.click(option('Борис'));
		fireEvent.click(option('Анна'));
		expect(onValueChange).toHaveBeenNthCalledWith(1, [boris]);
		expect(onValueChange).toHaveBeenNthCalledWith(2, [boris, anna]);
		expect(screen.getByRole('listbox')).toBeTruthy();
		expect(chipLabels()).toEqual(['Борис', 'Анна']);
		fireEvent.click(option('Борис'));
		expect(onValueChange).toHaveBeenLastCalledWith([anna]);
		expect(chipLabels()).toEqual(['Анна']);
	});

	it('controlled: значение меняет только родитель', () => {
		const [value, setValue] = createSignal<MultiSelectValue<User>>([anna]);
		const onValueChange = vi.fn();
		render(() => <Basic value={value()} onValueChange={onValueChange}/>);
		openList();
		fireEvent.click(option('Борис'));
		expect(onValueChange).toHaveBeenCalledWith([anna, boris]);
		expect(chipLabels()).toEqual(['Анна']);
		setValue([anna, boris]);
		expect(chipLabels()).toEqual(['Анна', 'Борис']);
	});

	it('controlled open: onOpenChange сообщает о закрытии, состояние держит родитель', () => {
		const onOpenChange = vi.fn();
		render(() => <Basic open onOpenChange={onOpenChange}/>);
		expect(screen.getByRole('listbox')).toBeTruthy();
		fireEvent.click(trigger());
		expect(onOpenChange).toHaveBeenCalledWith(false);
		expect(screen.getByRole('listbox')).toBeTruthy();
	});

	it('отключённая опция не выбирается', () => {
		const onValueChange = vi.fn();
		render(() => <Basic onValueChange={onValueChange}/>);
		openList();
		fireEvent.click(option('Вера'));
		expect(onValueChange).not.toHaveBeenCalled();
	});
});

describe('MultiSelect: поиск в панели', () => {
	it('searchable по умолчанию: поле поиска в панели получает фокус, кнопка остаётся с aria-expanded', () => {
		render(() => <Basic/>);
		openList();
		expect(document.activeElement).toBe(search());
		expect(search().getAttribute('aria-controls')).toBe(screen.getByRole('listbox').id);
	});

	it('печать фильтрует, запрос уходит в onQueryChange и очищается при закрытии', () => {
		const onQueryChange = vi.fn();
		render(() => <Basic onQueryChange={onQueryChange}/>);
		openList();
		fireEvent.input(search(), { target: { value: 'ор' } });
		expect(optionLabels()).toEqual(['Борис']);
		expect(onQueryChange).toHaveBeenLastCalledWith('ор');
		fireEvent.click(trigger());
		expect(onQueryChange).toHaveBeenLastCalledWith('');
		openList();
		expect(search().value).toBe('');
		expect(optionLabels()).toHaveLength(4);
	});

	it('filter={false}: список не фильтруется на клиенте', () => {
		render(() => <Basic filter={false}/>);
		openList();
		fireEvent.input(search(), { target: { value: 'ор' } });
		expect(optionLabels()).toHaveLength(4);
	});

	it('выбранное вне результата поиска остаётся в значении и в чипах', () => {
		const onValueChange = vi.fn();
		render(() => <Basic defaultValue={[anna]} onValueChange={onValueChange}/>);
		openList();
		fireEvent.input(search(), { target: { value: 'Бор' } });
		fireEvent.click(option('Борис'));
		expect(onValueChange).toHaveBeenLastCalledWith([anna, boris]);
		expect(chipLabels()).toEqual(['Анна', 'Борис']);
	});

	it('стрелки двигают подсветку, aria-activedescendant совпадает с [data-active], Enter переключает', () => {
		const onValueChange = vi.fn();
		render(() => <Basic onValueChange={onValueChange}/>);
		openList();
		fireEvent.keyDown(search(), { key: 'ArrowDown' });
		const active = document.querySelector('[data-active]');
		expect(active?.id).toBe(search().getAttribute('aria-activedescendant'));
		const label = active?.textContent;
		expect(fireEvent.keyDown(search(), { key: 'Enter' })).toBe(false);
		expect(onValueChange).toHaveBeenCalledTimes(1);
		expect(chipLabels()).toEqual([label]);
		expect(screen.getByRole('listbox')).toBeTruthy();
	});

	it('Space в поле поиска не переключает опцию', () => {
		const onValueChange = vi.fn();
		render(() => <Basic onValueChange={onValueChange}/>);
		openList();
		fireEvent.keyDown(search(), { key: 'ArrowDown' });
		expect(fireEvent.keyDown(search(), { key: ' ' })).toBe(true);
		expect(onValueChange).not.toHaveBeenCalled();
	});

	it('Tab в поле поиска закрывает список и возвращает фокус на кнопку', () => {
		render(() => <Basic/>);
		openList();
		expect(fireEvent.keyDown(search(), { key: 'Tab' })).toBe(false);
		expect(screen.queryByRole('listbox')).toBeNull();
		expect(document.activeElement).toBe(trigger());
	});

	it('без searchable поля поиска нет, фокус остаётся на кнопке, работает typeahead и Enter', () => {
		const onValueChange = vi.fn();
		render(() => <Basic searchable={false} onValueChange={onValueChange}/>);
		openList();
		expect(screen.queryByRole('combobox', { name: 'Поиск' })).toBeNull();
		expect(document.activeElement).toBe(trigger());
		fireEvent.keyDown(trigger(), { key: 'Г' });
		expect(document.querySelector('[data-active]')?.textContent).toBe('Глеб');
		expect(trigger().getAttribute('aria-activedescendant')).toBe(document.querySelector('[data-active]')?.id);
		fireEvent.keyDown(trigger(), { key: 'Enter' });
		expect(onValueChange).toHaveBeenCalledWith([gleb]);
		expect(screen.getByRole('listbox')).toBeTruthy();
	});
});

describe('MultiSelect: клавиши закрытой кнопки', () => {
	it.each(['ArrowDown', 'ArrowUp', 'Enter', ' '])('%s открывает список', (key) => {
		render(() => <Basic/>);
		expect(fireEvent.keyDown(trigger(), { key })).toBe(false);
		expect(trigger().getAttribute('aria-expanded')).toBe('true');
	});

	it('Tab закрывает открытый список без поиска', () => {
		render(() => <Basic searchable={false}/>);
		openList();
		fireEvent.keyDown(trigger(), { key: 'Tab' });
		expect(screen.queryByRole('listbox')).toBeNull();
	});
});

describe('MultiSelect: строка «Все»', () => {
	const all = { allKey: -1, allLabel: 'Все сотрудники' } as const;

	it('строка первая; клик даёт allKey, повторный клик очищает', () => {
		const onValueChange = vi.fn();
		render(() => <Basic {...all} onValueChange={onValueChange}/>);
		openList();
		expect(optionLabels()[0]).toBe('Все сотрудники');
		fireEvent.click(option('Все сотрудники'));
		expect(onValueChange).toHaveBeenLastCalledWith(-1);
		expect(option('Все сотрудники').getAttribute('aria-selected')).toBe('true');
		expect(option('Борис').getAttribute('aria-selected')).toBe('true');
		expect(chipLabels()).toEqual(['Все сотрудники']);
		fireEvent.click(option('Все сотрудники'));
		expect(onValueChange).toHaveBeenLastCalledWith([]);
		expect(chipLabels()).toEqual([]);
	});

	it('без allLabel строки «Все» нет', () => {
		render(() => <Basic allKey={-1}/>);
		openList();
		expect(optionLabels()).toHaveLength(4);
	});

	it('снятие одной опции при «Все» выводит из состояния «Все»: массив остальных', () => {
		const onValueChange = vi.fn();
		render(() => <Basic {...all} defaultValue={-1} onValueChange={onValueChange}/>);
		openList();
		fireEvent.click(option('Борис'));
		expect(onValueChange).toHaveBeenLastCalledWith([anna, vera, gleb]);
		expect(option('Все сотрудники').getAttribute('aria-selected')).toBe('false');
	});

	it('при непустом запросе «Все» действует на показанные доступные', () => {
		const onValueChange = vi.fn();
		render(() => <Basic {...all} defaultValue={[anna]} onValueChange={onValueChange}/>);
		openList();
		fireEvent.input(search(), { target: { value: 'е' } });
		expect(optionLabels()).toEqual(['Все сотрудники', 'Вера', 'Глеб']);
		fireEvent.click(option('Все сотрудники'));
		expect(onValueChange).toHaveBeenLastCalledWith([anna, gleb]);
		expect(option('Все сотрудники').getAttribute('aria-selected')).toBe('true');
		fireEvent.click(option('Все сотрудники'));
		expect(onValueChange).toHaveBeenLastCalledWith([anna]);
	});

	it('Enter на строке «Все» переключает её', () => {
		const onValueChange = vi.fn();
		render(() => <Basic {...all} onValueChange={onValueChange}/>);
		openList();
		expect(document.querySelector('[data-active]')?.textContent).toBe('Все сотрудники');
		fireEvent.keyDown(search(), { key: 'Enter' });
		expect(onValueChange).toHaveBeenLastCalledWith(-1);
	});

	it('чип «Все» убирается кнопкой ×', () => {
		const onValueChange = vi.fn();
		render(() => <Basic {...all} defaultValue={-1} onValueChange={onValueChange}/>);
		fireEvent.click(screen.getByRole('button', { name: 'Убрать: Все' }));
		expect(onValueChange).toHaveBeenLastCalledWith([]);
		expect(chipLabels()).toEqual([]);
	});

	it('summary при «Все» показывает «M из M»', () => {
		render(() => <Basic {...all} defaultValue={-1} chipsOverflow='summary'/>);
		expect(trigger().textContent).toBe('4 из 4');
	});
});

describe('MultiSelect: чипы и счётчик', () => {
	it('× убирает чип и возвращает фокус на кнопку; кнопка в порядке табуляции, имя с подписью', () => {
		const onValueChange = vi.fn();
		render(() => <Basic defaultValue={[anna, boris]} onValueChange={onValueChange}/>);
		const remove = screen.getByRole<HTMLButtonElement>('button', { name: 'Убрать: Анна' });
		expect(remove.getAttribute('tabindex')).toBeNull();
		fireEvent.click(remove);
		expect(onValueChange).toHaveBeenCalledWith([boris]);
		expect(chipLabels()).toEqual(['Борис']);
		expect(document.activeElement).toBe(trigger());
		expect(screen.queryByRole('listbox')).toBeNull();
	});

	it('имя кнопки × задаётся функцией', () => {
		render(() => <Basic defaultValue={[anna]} removeChipLabel={(label) => `Удалить ${label}`}/>);
		expect(screen.getByRole('button', { name: 'Удалить Анна' })).toBeTruthy();
	});

	it('renderChip рисует содержимое чипа', () => {
		render(() => <Basic defaultValue={[anna]} renderChip={(user) => <b>{user.team}</b>}/>);
		expect(chipLabels()).toEqual(['Дизайн']);
	});

	it('в DOM не больше 24 чипов, остальные идут в счётчик', () => {
		const many = Array.from({ length: 30 }, (_, index) => ({ id: index, name: `Сотрудник ${index}`, team: 'Все' }));
		render(() => <Basic items={many} defaultValue={many}/>);
		expect(document.querySelectorAll('[data-multiselect-chip]')).toHaveLength(24);
		expect(trigger().textContent).toBe('+6');
	});

	it('summary: чипов нет, в кнопке «N из M»', () => {
		render(() => <Basic defaultValue={[anna, boris]} chipsOverflow='summary'/>);
		expect(document.querySelectorAll('[data-multiselect-chip]')).toHaveLength(0);
		expect(trigger().textContent).toBe('2 из 4');
	});

	it('«из M» берёт total; при N больше M «N выбрано»; при нуле плейсхолдер', () => {
		const { unmount } = render(() => <Basic defaultValue={[anna, boris]} chipsOverflow='summary' total={10}/>);
		expect(trigger().textContent).toBe('2 из 10');
		unmount();
		const { unmount: second } = render(() => <Basic defaultValue={[anna, boris, vera]} chipsOverflow='summary' total={2}/>);
		expect(trigger().textContent).toBe('3 выбрано');
		second();
		render(() => <Basic chipsOverflow='summary'/>);
		expect(trigger().textContent).toBe('Сотрудники');
	});

	it('wrap: все чипы на месте, счётчика нет', () => {
		render(() => <Basic defaultValue={[anna, boris, gleb]} chipsOverflow='wrap'/>);
		expect(chipLabels()).toEqual(['Анна', 'Борис', 'Глеб']);
		expect(trigger().textContent).toBe('');
	});

	it('клик по пустому месту оболочки открывает список', () => {
		render(() => <Basic defaultValue={[anna]}/>);
		const shell = document.querySelector<HTMLElement>('[data-multiselect-overflow]');
		if (!shell) {
			throw new Error('нет оболочки');
		}
		fireEvent.click(shell);
		expect(screen.getByRole('listbox')).toBeTruthy();
	});
});

describe('MultiSelect: collapse по измеренной ширине', () => {
	class StubResizeObserver {
		private readonly callback: () => void;

		constructor(callback: () => void) {
			this.callback = callback;
		}

		observe(): void {
			this.callback();
		}

		disconnect(): void {}
	}

	beforeEach(() => {
		vi.stubGlobal('ResizeObserver', StubResizeObserver);
		vi.spyOn(Element.prototype, 'clientWidth', 'get').mockImplementation(function (this: Element) {
			return this.hasAttribute('data-multiselect-overflow') ? 300 : 0;
		});
		vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
			const width = this.hasAttribute('data-multiselect-chip') ? 100 : 0;
			return { x: 0, y: 0, top: 0, left: 0, right: width, bottom: 0, width, height: 0, toJSON: () => ({}) };
		});
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('не поместившиеся чипы скрыты, счётчик «+N»', () => {
		render(() => <Basic defaultValue={[anna, boris, vera, gleb]}/>);
		expect(chipLabels()).toEqual(['Анна', 'Борис']);
		expect(document.querySelectorAll('[data-multiselect-chip]')).toHaveLength(4);
		expect(trigger().textContent).toBe('+2');
	});

	it('все помещаются: счётчика нет', () => {
		render(() => <Basic defaultValue={[anna, boris]}/>);
		expect(chipLabels()).toEqual(['Анна', 'Борис']);
		expect(trigger().textContent).toBe('');
	});
});
