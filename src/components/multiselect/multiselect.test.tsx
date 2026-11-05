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

function field(): HTMLInputElement {
	return screen.getByRole<HTMLInputElement>('combobox');
}

function counter(): string {
	return document.querySelector('[data-multiselect-counter]')?.textContent ?? '';
}

function type(text: string): void {
	fireEvent.input(field(), { target: { value: text } });
}

function press(key: string, init: KeyboardEventInit = {}): boolean {
	return fireEvent.keyDown(field(), { key, ...init });
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
	field().focus();
	fireEvent.click(field());
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

describe('MultiSelect: поле и ARIA', () => {
	it('закрытый: поле ввода role=combobox с плейсхолдером, шеврон вне табуляции, списка нет', () => {
		render(() => <Basic/>);
		expect(field().tagName).toBe('INPUT');
		expect(field().getAttribute('aria-haspopup')).toBe('listbox');
		expect(field().getAttribute('aria-autocomplete')).toBe('list');
		expect(field().getAttribute('aria-expanded')).toBe('false');
		expect(field().hasAttribute('aria-controls')).toBe(false);
		expect(field().placeholder).toBe('Сотрудники');
		expect(field().readOnly).toBe(false);
		expect(screen.getByRole('button', { name: 'Показать список' }).getAttribute('tabindex')).toBe('-1');
		expect(screen.queryByRole('listbox')).toBeNull();
	});

	it('в панели нет поля ввода: фокус остаётся в поле триггера', () => {
		render(() => <Basic/>);
		openList();
		expect(screen.getAllByRole('combobox')).toHaveLength(1);
		expect(screen.getByRole('listbox').querySelector('input')).toBeNull();
		expect(document.activeElement).toBe(field());
	});

	it('открытый: aria-multiselectable, aria-selected у опций, aria-controls на список', () => {
		render(() => <Basic defaultValue={[boris]}/>);
		openList();
		const list = screen.getByRole('listbox');
		expect(list.getAttribute('aria-multiselectable')).toBe('true');
		expect(field().getAttribute('aria-expanded')).toBe('true');
		expect(field().getAttribute('aria-controls')).toBe(list.id);
		expect(option('Борис').getAttribute('aria-selected')).toBe('true');
		expect(option('Анна').getAttribute('aria-selected')).toBe('false');
		expect(option('Вера').getAttribute('aria-disabled')).toBe('true');
	});

	it('плейсхолдер пропадает, когда есть выбранные', () => {
		render(() => <Basic defaultValue={[anna]}/>);
		expect(field().placeholder).toBe('');
	});

	it('атрибуты Field: метка указывает на поле', () => {
		render(() => (
			<Field label='Сотрудники'>
				{(control) => <Basic {...control}/>}
			</Field>
		));
		expect(screen.getByLabelText('Сотрудники')).toBe(field());
	});

	it('disabled: список не открывается, поле, шеврон и × отключены', () => {
		render(() => <Basic disabled defaultValue={[anna]}/>);
		expect(field().disabled).toBe(true);
		expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Убрать: Анна' }).disabled).toBe(true);
		expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Показать список' }).disabled).toBe(true);
		fireEvent.click(field());
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
		fireEvent.click(screen.getByRole('button', { name: 'Показать список' }));
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

describe('MultiSelect: ввод в поле триггера', () => {
	it('клик по полю открывает закрытый список, повторный клик его не закрывает', () => {
		render(() => <Basic/>);
		fireEvent.click(field());
		expect(field().getAttribute('aria-expanded')).toBe('true');
		fireEvent.click(field());
		expect(field().getAttribute('aria-expanded')).toBe('true');
	});

	it('шеврон открывает и закрывает список, фокус остаётся в поле', () => {
		render(() => <Basic/>);
		field().focus();
		const toggle = screen.getByRole('button', { name: 'Показать список' });
		fireEvent.click(toggle);
		expect(screen.getByRole('listbox')).toBeTruthy();
		expect(document.activeElement).toBe(field());
		fireEvent.click(toggle);
		expect(screen.queryByRole('listbox')).toBeNull();
	});

	it('печать открывает список и фильтрует, запрос уходит в onQueryChange и очищается при закрытии', () => {
		const onQueryChange = vi.fn();
		render(() => <Basic onQueryChange={onQueryChange}/>);
		type('ор');
		expect(screen.getByRole('listbox')).toBeTruthy();
		expect(optionLabels()).toEqual(['Борис']);
		expect(onQueryChange).toHaveBeenLastCalledWith('ор');
		fireEvent.click(screen.getByRole('button', { name: 'Показать список' }));
		expect(onQueryChange).toHaveBeenLastCalledWith('');
		expect(field().value).toBe('');
		openList();
		expect(optionLabels()).toHaveLength(4);
	});

	it('filter={false}: список не фильтруется на клиенте', () => {
		render(() => <Basic filter={false}/>);
		type('ор');
		expect(optionLabels()).toHaveLength(4);
	});

	it('выбранное вне результата поиска остаётся в значении и в чипах', () => {
		const onValueChange = vi.fn();
		render(() => <Basic defaultValue={[anna]} onValueChange={onValueChange}/>);
		type('Бор');
		fireEvent.click(option('Борис'));
		expect(onValueChange).toHaveBeenLastCalledWith([anna, boris]);
		expect(chipLabels()).toEqual(['Анна', 'Борис']);
	});

	it('стрелки двигают подсветку, aria-activedescendant совпадает с [data-active], Enter переключает', () => {
		const onValueChange = vi.fn();
		render(() => <Basic onValueChange={onValueChange}/>);
		openList();
		press('ArrowDown');
		const active = document.querySelector('[data-active]');
		expect(active?.id).toBe(field().getAttribute('aria-activedescendant'));
		const label = active?.textContent;
		expect(press('Enter')).toBe(false);
		expect(onValueChange).toHaveBeenCalledTimes(1);
		expect(chipLabels()).toEqual([label]);
		expect(screen.getByRole('listbox')).toBeTruthy();
	});

	it('Space и Home в поле не обрабатываются списком', () => {
		const onValueChange = vi.fn();
		render(() => <Basic onValueChange={onValueChange}/>);
		openList();
		press('ArrowDown');
		expect(press(' ')).toBe(true);
		expect(press('Home')).toBe(true);
		expect(onValueChange).not.toHaveBeenCalled();
	});

	it('Tab закрывает список, фокус остаётся для естественного перехода', () => {
		render(() => <Basic/>);
		openList();
		expect(press('Tab')).toBe(true);
		expect(screen.queryByRole('listbox')).toBeNull();
	});

	it('Enter и Space в закрытом поле не открывают список', () => {
		render(() => <Basic/>);
		expect(press(' ')).toBe(true);
		expect(screen.queryByRole('listbox')).toBeNull();
	});

	it('Enter в закрытом поле не перехватывается (форма отправится)', () => {
		render(() => <Basic/>);
		expect(press('Enter')).toBe(true);
		expect(screen.queryByRole('listbox')).toBeNull();
	});
});

describe('MultiSelect: Backspace', () => {
	it('в пустом поле убирает последний выбранный чип, фокус остаётся в поле', () => {
		const onValueChange = vi.fn();
		render(() => <Basic defaultValue={[anna, boris, gleb]} onValueChange={onValueChange}/>);
		field().focus();
		expect(press('Backspace')).toBe(false);
		expect(onValueChange).toHaveBeenLastCalledWith([anna, boris]);
		press('Backspace');
		expect(onValueChange).toHaveBeenLastCalledWith([anna]);
		expect(chipLabels()).toEqual(['Анна']);
		expect(document.activeElement).toBe(field());
	});

	it('убирает последний чип и при открытом списке', () => {
		render(() => <Basic defaultValue={[anna, boris]}/>);
		openList();
		press('Backspace');
		expect(chipLabels()).toEqual(['Анна']);
		expect(screen.getByRole('listbox')).toBeTruthy();
	});

	it('при непустом тексте стирает символ, значение не трогает', () => {
		const onValueChange = vi.fn();
		render(() => <Basic defaultValue={[anna]} onValueChange={onValueChange}/>);
		type('Бо');
		expect(press('Backspace')).toBe(true);
		expect(onValueChange).not.toHaveBeenCalled();
		expect(chipLabels()).toEqual(['Анна']);
	});

	it('без выбранных ничего не делает', () => {
		const onValueChange = vi.fn();
		render(() => <Basic onValueChange={onValueChange}/>);
		expect(press('Backspace')).toBe(true);
		expect(onValueChange).not.toHaveBeenCalled();
	});

	it('при «Все» снимает «Все»', () => {
		const onValueChange = vi.fn();
		render(() => <Basic allKey={-1} allLabel='Все' defaultValue={-1} onValueChange={onValueChange}/>);
		press('Backspace');
		expect(onValueChange).toHaveBeenLastCalledWith([]);
	});

	it('в disabled не срабатывает', () => {
		const onValueChange = vi.fn();
		render(() => <Basic disabled defaultValue={[anna]} onValueChange={onValueChange}/>);
		press('Backspace');
		expect(onValueChange).not.toHaveBeenCalled();
	});
});

describe('MultiSelect: клавиши закрытого поля', () => {
	it.each(['ArrowDown', 'ArrowUp'])('%s открывает список', (key) => {
		render(() => <Basic/>);
		expect(press(key)).toBe(false);
		expect(field().getAttribute('aria-expanded')).toBe('true');
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
		type('е');
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
		press('Enter');
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
		expect(counter()).toBe('4 из 4');
	});
});

describe('MultiSelect: чипы и счётчик', () => {
	it('× убирает чип и возвращает фокус в поле; кнопка в порядке табуляции, имя с подписью', () => {
		const onValueChange = vi.fn();
		render(() => <Basic defaultValue={[anna, boris]} onValueChange={onValueChange}/>);
		const remove = screen.getByRole<HTMLButtonElement>('button', { name: 'Убрать: Анна' });
		expect(remove.getAttribute('tabindex')).toBeNull();
		fireEvent.click(remove);
		expect(onValueChange).toHaveBeenCalledWith([boris]);
		expect(chipLabels()).toEqual(['Борис']);
		expect(document.activeElement).toBe(field());
		expect(screen.queryByRole('listbox')).toBeNull();
	});

	it('клик по тексту чипа и счётчику ничего не убирает, даже внутри <label> без for', () => {
		const onValueChange = vi.fn();
		render(() => (
			<label>
				Сотрудники
				<Basic defaultValue={[anna, boris, vera]} onValueChange={onValueChange}/>
			</label>
		));
		fireEvent.click(screen.getByText('Борис'));
		fireEvent.click(document.querySelector('[data-multiselect-chip]') as HTMLElement);
		expect(onValueChange).not.toHaveBeenCalled();
		expect(chipLabels()).toEqual(['Анна', 'Борис', 'Вера']);
		// кнопка × по-прежнему убирает ровно свой чип
		fireEvent.click(screen.getByRole('button', { name: 'Убрать: Борис' }));
		expect(chipLabels()).toEqual(['Анна', 'Вера']);
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
		expect(counter()).toBe('+6');
	});

	it('счётчик оформлен как чип без кнопки ×', () => {
		render(() => <Basic defaultValue={[anna, boris]} chipsOverflow='summary'/>);
		const element = document.querySelector('[data-multiselect-counter]');
		expect(element?.className).toContain('chip');
		expect(element?.querySelector('button')).toBeNull();
	});

	it('summary: чипов нет, рядом с полем «N из M»', () => {
		render(() => <Basic defaultValue={[anna, boris]} chipsOverflow='summary'/>);
		expect(document.querySelectorAll('[data-multiselect-chip]')).toHaveLength(0);
		expect(counter()).toBe('2 из 4');
	});

	it('«из M» берёт total; при N больше M «N выбрано»; при нуле плейсхолдер', () => {
		const { unmount } = render(() => <Basic defaultValue={[anna, boris]} chipsOverflow='summary' total={10}/>);
		expect(counter()).toBe('2 из 10');
		unmount();
		const { unmount: second } = render(() => <Basic defaultValue={[anna, boris, vera]} chipsOverflow='summary' total={2}/>);
		expect(counter()).toBe('3 выбрано');
		second();
		render(() => <Basic chipsOverflow='summary'/>);
		expect(counter()).toBe('');
		expect(field().placeholder).toBe('Сотрудники');
	});

	it('wrap: все чипы на месте, счётчика нет', () => {
		render(() => <Basic defaultValue={[anna, boris, gleb]} chipsOverflow='wrap'/>);
		expect(chipLabels()).toEqual(['Анна', 'Борис', 'Глеб']);
		expect(counter()).toBe('');
	});

	it('клик по пустому месту оболочки открывает список и переводит фокус в поле', () => {
		render(() => <Basic defaultValue={[anna]}/>);
		const shell = document.querySelector<HTMLElement>('[data-multiselect-overflow]');
		if (!shell) {
			throw new Error('нет оболочки');
		}
		fireEvent.click(shell);
		expect(screen.getByRole('listbox')).toBeTruthy();
		expect(document.activeElement).toBe(field());
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
			return this.hasAttribute('data-multiselect-overflow') ? 340 : 0;
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
		expect(counter()).toBe('+2');
	});

	it('все помещаются: счётчика нет', () => {
		render(() => <Basic defaultValue={[anna, boris]}/>);
		expect(chipLabels()).toEqual(['Анна', 'Борис']);
		expect(counter()).toBe('');
	});
});
