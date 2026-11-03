import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library';
import { createSignal, untrack } from 'solid-js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PickerField } from './picker-field';
import type { PickerFieldProps } from './picker-field-props';

const showPopover = vi.fn(function (this: HTMLElement) {
	this.removeAttribute('popover');
});

beforeEach(() => {
	// jsdom не реализует Popover API и считает содержимое закрытого [popover] нефокусируемым: «показ» снимает атрибут
	showPopover.mockClear();
	HTMLElement.prototype.showPopover = showPopover;
	HTMLElement.prototype.hidePopover = vi.fn();
	vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation(() => 0);
});

afterEach(cleanup);

type Extra = Partial<PickerFieldProps>;

function Harness(props: Extra) {
	const [text, setText] = createSignal(untrack(() => props.text ?? ''));
	return (
		<PickerField
			onCommit={() => undefined}
			onRevert={() => undefined}
			icon={<svg data-testid='icon'/>}
			openLabel='Открыть'
			clearLabel='Очистить'
			panelLabel='Выбор'
			{...props}
			text={text()}
			onTextChange={(next) => {
				setText(next);
				props.onTextChange?.(next);
			}}
		>
			{(panel) => (
				<div data-testid='content'>
					<button type='button' data-focus-target onClick={panel.close}>День</button>
				</div>
			)}
		</PickerField>
	);
}

function field(): HTMLInputElement {
	return screen.getByRole('combobox');
}

function toggle(): HTMLElement {
	return screen.getByRole('button', { name: 'Открыть' });
}

function panel(): HTMLElement | null {
	return screen.queryByRole('dialog');
}

function clickField(): void {
	field().focus();
	fireEvent.click(field());
}

describe('PickerField: поле', () => {
	it('закрытая: роли, атрибуты, значок вне табуляции', () => {
		render(() => <Harness placeholder='дд.мм.гггг'/>);
		const input = field();
		expect(input.getAttribute('aria-haspopup')).toBe('dialog');
		expect(input.getAttribute('aria-expanded')).toBe('false');
		expect(input.hasAttribute('aria-controls')).toBe(false);
		expect(input.getAttribute('autocomplete')).toBe('off');
		expect(input.getAttribute('placeholder')).toBe('дд.мм.гггг');
		expect(toggle().getAttribute('tabindex')).toBe('-1');
		expect(panel()).toBeNull();
	});

	it('прочие атрибуты уходят на input', () => {
		render(() => <Harness id='birthday' aria-invalid={true} aria-describedby='hint'/>);
		expect(field().id).toBe('birthday');
		expect(field().getAttribute('aria-invalid')).toBe('true');
		expect(field().getAttribute('aria-describedby')).toBe('hint');
	});

	it('набор текста вызывает onTextChange', () => {
		const onTextChange = vi.fn();
		render(() => <Harness text='' onTextChange={onTextChange}/>);
		fireEvent.input(field(), { target: { value: '03.11' } });
		expect(onTextChange).toHaveBeenCalledWith('03.11');
	});

	it('скрытое поле формы несёт значение и отключается вместе с полем', () => {
		const first = render(() => <Harness name='when' hiddenValue='2026-11-03'/>);
		const hidden = document.querySelector<HTMLInputElement>('input[type="hidden"]');
		expect(hidden?.name).toBe('when');
		expect(hidden?.value).toBe('2026-11-03');
		first.unmount();
		render(() => <Harness name='when' hiddenValue='2026-11-03' disabled/>);
		expect(document.querySelector<HTMLInputElement>('input[type="hidden"]')?.disabled).toBe(true);
	});

	it('без name скрытого поля нет', () => {
		render(() => <Harness/>);
		expect(document.querySelector('input[type="hidden"]')).toBeNull();
	});
});

describe('PickerField: открытие', () => {
	it('клик по полю открывает панель, фокус остаётся в поле', () => {
		const onOpenChange = vi.fn();
		render(() => <Harness onOpenChange={onOpenChange}/>);
		clickField();
		const dialog = panel();
		expect(dialog).toBeTruthy();
		expect(dialog?.getAttribute('aria-label')).toBe('Выбор');
		expect(onOpenChange).toHaveBeenCalledWith(true);
		expect(field().getAttribute('aria-expanded')).toBe('true');
		expect(field().getAttribute('aria-controls')).toBe(dialog?.id);
		expect(document.activeElement).toBe(field());
	});

	it('повторный клик по полю панель не закрывает', () => {
		render(() => <Harness/>);
		clickField();
		fireEvent.click(field());
		expect(panel()).toBeTruthy();
	});

	it('клик по значку открывает панель и возвращает фокус в поле, повторный закрывает', () => {
		const onOpenChange = vi.fn();
		render(() => <Harness onOpenChange={onOpenChange}/>);
		fireEvent.click(toggle());
		expect(panel()).toBeTruthy();
		expect(onOpenChange).toHaveBeenLastCalledWith(true);
		expect(document.activeElement).toBe(field());
		fireEvent.click(toggle());
		expect(panel()).toBeNull();
		expect(onOpenChange).toHaveBeenLastCalledWith(false);
	});

	it('mousedown по значку не уводит фокус из поля', () => {
		render(() => <Harness/>);
		expect(fireEvent.mouseDown(toggle())).toBe(false);
	});

	it('disabled: клики ничего не открывают', () => {
		render(() => <Harness disabled/>);
		fireEvent.click(field());
		fireEvent.click(toggle());
		fireEvent.keyDown(field(), { key: 'ArrowDown' });
		expect(panel()).toBeNull();
	});

	it('readOnly: поле, значок и стрелка вниз панель не открывают', () => {
		render(() => <Harness readOnly/>);
		clickField();
		fireEvent.click(toggle());
		fireEvent.keyDown(field(), { key: 'ArrowDown' });
		expect(panel()).toBeNull();
	});

	it('controlled open: состояние ведёт родитель', () => {
		const [open, setOpen] = createSignal(false);
		const onOpenChange = vi.fn();
		render(() => <Harness open={open()} onOpenChange={onOpenChange}/>);
		clickField();
		expect(onOpenChange).toHaveBeenCalledWith(true);
		expect(panel()).toBeNull();
		setOpen(true);
		expect(panel()).toBeTruthy();
	});

	it('defaultOpen открывает при создании', () => {
		render(() => <Harness defaultOpen/>);
		expect(panel()).toBeTruthy();
	});
});

describe('PickerField: клавиатура и фокус', () => {
	it('ArrowDown открывает панель и переносит фокус внутрь', async () => {
		render(() => <Harness/>);
		field().focus();
		const notPrevented = fireEvent.keyDown(field(), { key: 'ArrowDown' });
		await Promise.resolve();
		expect(notPrevented).toBe(false);
		expect(panel()).toBeTruthy();
		expect(document.activeElement).toBe(screen.getByRole('button', { name: 'День' }));
	});

	it('ArrowDown при открытой панели (фокус в поле) переносит фокус внутрь', async () => {
		render(() => <Harness/>);
		clickField();
		expect(document.activeElement).toBe(field());
		fireEvent.keyDown(field(), { key: 'ArrowDown', altKey: true });
		await Promise.resolve();
		expect(document.activeElement).toBe(screen.getByRole('button', { name: 'День' }));
	});

	it('Esc закрывает открытую панель и возвращает фокус в поле', async () => {
		render(() => <Harness/>);
		field().focus();
		fireEvent.keyDown(field(), { key: 'ArrowDown' });
		await Promise.resolve();
		fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' });
		expect(panel()).toBeNull();
		expect(document.activeElement).toBe(field());
	});

	it('Esc при закрытой панели откатывает набранное', () => {
		const onRevert = vi.fn();
		render(() => <Harness onRevert={onRevert}/>);
		fireEvent.keyDown(field(), { key: 'Escape' });
		expect(onRevert).toHaveBeenCalledTimes(1);
	});

	it('Esc при открытой панели откат не вызывает', () => {
		const onRevert = vi.fn();
		render(() => <Harness onRevert={onRevert}/>);
		clickField();
		fireEvent.keyDown(field(), { key: 'Escape' });
		expect(onRevert).not.toHaveBeenCalled();
	});

	it('Enter принимает текст; открытую панель закрывает и не отправляет форму', () => {
		const onCommit = vi.fn();
		render(() => <Harness onCommit={onCommit}/>);
		const closedResult = fireEvent.keyDown(field(), { key: 'Enter' });
		expect(onCommit).toHaveBeenCalledTimes(1);
		expect(closedResult).toBe(true);
		clickField();
		const openResult = fireEvent.keyDown(field(), { key: 'Enter' });
		expect(onCommit).toHaveBeenCalledTimes(2);
		expect(openResult).toBe(false);
		expect(panel()).toBeNull();
	});

	it('Tab в поле закрывает панель', () => {
		render(() => <Harness/>);
		clickField();
		fireEvent.keyDown(field(), { key: 'Tab' });
		expect(panel()).toBeNull();
	});

	it('Tab внутри панели закрывает её и возвращает фокус в поле', async () => {
		render(() => <Harness/>);
		field().focus();
		fireEvent.keyDown(field(), { key: 'ArrowDown' });
		await Promise.resolve();
		const notPrevented = fireEvent.keyDown(screen.getByRole('button', { name: 'День' }), { key: 'Tab' });
		expect(notPrevented).toBe(false);
		expect(panel()).toBeNull();
		expect(document.activeElement).toBe(field());
	});

	describe('panelTab="move"', () => {
		function MoveHarness() {
			const [text, setText] = createSignal('');
			return (
				<PickerField
					text={text()}
					onTextChange={setText}
					onCommit={() => undefined}
					onRevert={() => undefined}
					icon={<svg/>}
					openLabel='Открыть'
					panelLabel='Выбор'
					panelTab='move'
				>
					{() => (
						<div>
							<button type='button' data-focus-target>Первая</button>
							<button type='button' tabindex='-1'>Вне табуляции</button>
							<button type='button'>Последняя</button>
						</div>
					)}
				</PickerField>
			);
		}

		async function openPanel(): Promise<void> {
			field().focus();
			fireEvent.keyDown(field(), { key: 'ArrowDown' });
			await Promise.resolve();
		}

		it('Tab внутри панели не отменяется и панель не закрывается', async () => {
			render(() => <MoveHarness/>);
			await openPanel();
			const notPrevented = fireEvent.keyDown(screen.getByRole('button', { name: 'Первая' }), { key: 'Tab' });
			expect(notPrevented).toBe(true);
			expect(panel()).not.toBeNull();
		});

		it('Shift+Tab внутри панели не отменяется на втором и последнем элементах', async () => {
			render(() => <MoveHarness/>);
			await openPanel();
			const last = screen.getByRole('button', { name: 'Последняя' });
			expect(fireEvent.keyDown(last, { key: 'Tab', shiftKey: true })).toBe(true);
			expect(panel()).not.toBeNull();
		});

		it('Tab на последнем элементе закрывает панель и возвращает фокус в поле', async () => {
			render(() => <MoveHarness/>);
			await openPanel();
			const notPrevented = fireEvent.keyDown(screen.getByRole('button', { name: 'Последняя' }), { key: 'Tab' });
			expect(notPrevented).toBe(false);
			expect(panel()).toBeNull();
			expect(document.activeElement).toBe(field());
		});

		it('Shift+Tab на первом элементе закрывает панель и возвращает фокус в поле', async () => {
			render(() => <MoveHarness/>);
			await openPanel();
			const notPrevented = fireEvent.keyDown(screen.getByRole('button', { name: 'Первая' }), { key: 'Tab', shiftKey: true });
			expect(notPrevented).toBe(false);
			expect(panel()).toBeNull();
			expect(document.activeElement).toBe(field());
		});

		it('Tab с элемента вне табуляции считается по порядку документа', async () => {
			render(() => <MoveHarness/>);
			await openPanel();
			const skipped = screen.getByRole('button', { name: 'Вне табуляции' });
			expect(fireEvent.keyDown(skipped, { key: 'Tab' })).toBe(true);
			expect(fireEvent.keyDown(skipped, { key: 'Tab', shiftKey: true })).toBe(true);
			expect(panel()).not.toBeNull();
		});
	});

	describe('mask', () => {
		const digitsOnly = (next: string): string => next.replaceAll(/\D/g, '');

		it('переписывает набранный текст', () => {
			const onTextChange = vi.fn();
			render(() => <Harness mask={digitsOnly} onTextChange={onTextChange}/>);
			fireEvent.input(field(), { target: { value: '1a2b' } });
			expect(field().value).toBe('12');
			expect(onTextChange).toHaveBeenLastCalledWith('12');
		});

		it('отвергнутый символ оставляет прежний текст и не вызывает onTextChange', () => {
			const onTextChange = vi.fn();
			render(() => <Harness text='12' mask={digitsOnly} onTextChange={onTextChange}/>);
			fireEvent.input(field(), { target: { value: '12x' } });
			expect(field().value).toBe('12');
			expect(onTextChange).not.toHaveBeenCalled();
		});

		it('без маски ввод свободный', () => {
			render(() => <Harness/>);
			fireEvent.input(field(), { target: { value: '1a2b' } });
			expect(field().value).toBe('1a2b');
		});

		it('курсор не в конце остаётся у той же цифры', async () => {
			render(() => <Harness mask={digitsOnly}/>);
			fireEvent.input(field(), { target: { value: '12' } });
			field().value = '1x2';
			field().setSelectionRange(2, 2);
			fireEvent.input(field());
			await Promise.resolve();
			expect(field().value).toBe('12');
			expect(field().selectionStart).toBe(1);
		});
	});

	it('уход из поля принимает текст и закрывает панель', () => {
		const onCommit = vi.fn();
		render(() => (
			<>
				<Harness onCommit={onCommit}/>
				<button type='button'>Другая кнопка</button>
			</>
		));
		clickField();
		screen.getByRole('button', { name: 'Другая кнопка' }).focus();
		expect(onCommit).toHaveBeenCalledTimes(1);
		expect(panel()).toBeNull();
	});

	it('уход фокуса внутрь панели не считается уходом из поля', async () => {
		const onCommit = vi.fn();
		render(() => <Harness onCommit={onCommit}/>);
		field().focus();
		fireEvent.keyDown(field(), { key: 'ArrowDown' });
		await Promise.resolve();
		expect(onCommit).not.toHaveBeenCalled();
		expect(panel()).toBeTruthy();
	});

	it('mousedown по панели не уводит фокус из поля', () => {
		render(() => <Harness/>);
		clickField();
		expect(fireEvent.mouseDown(screen.getByTestId('content'))).toBe(false);
	});

	it('клик снаружи закрывает панель', () => {
		render(() => <Harness/>);
		clickField();
		fireEvent.pointerDown(document.body);
		expect(panel()).toBeNull();
	});

	it('panel.close закрывает панель и возвращает фокус в поле', () => {
		render(() => <Harness/>);
		clickField();
		screen.getByRole('button', { name: 'День' }).focus();
		fireEvent.click(screen.getByRole('button', { name: 'День' }));
		expect(panel()).toBeNull();
		expect(document.activeElement).toBe(field());
	});
});

describe('PickerField: подпись', () => {
	it('клик по подписи (for) не открывает панель', () => {
		render(() => (
			<>
				<label for='when-field'>Когда</label>
				<Harness id='when-field'/>
			</>
		));
		fireEvent.click(screen.getByText('Когда'));
		expect(panel()).toBeNull();
	});

	it('клик по подписи, внутри которой лежит поле, не открывает панель', () => {
		render(() => (
			<label>
				Когда
				<Harness/>
			</label>
		));
		fireEvent.click(screen.getByText('Когда'));
		expect(panel()).toBeNull();
	});

	it('клик по подписи при открытой панели её не закрывает и не переоткрывает', () => {
		render(() => (
			<>
				<label for='when-field'>Когда</label>
				<Harness id='when-field' defaultOpen/>
			</>
		));
		expect(panel()).toBeTruthy();
		fireEvent.click(screen.getByText('Когда'));
		expect(panel()).toBeTruthy();
	});

	it('после клика по подписи клик по полю в следующей задаче снова открывает', async () => {
		render(() => (
			<>
				<label for='when-field'>Когда</label>
				<Harness id='when-field'/>
			</>
		));
		fireEvent.click(screen.getByText('Когда'));
		await new Promise<void>((resolve) => {
			setTimeout(resolve, 0);
		});
		clickField();
		expect(panel()).toBeTruthy();
	});
});

describe('PickerField: «Очистить»', () => {
	it('показывается при clearable и непустом тексте; клик очищает и оставляет фокус в поле', () => {
		const onClear = vi.fn();
		render(() => <Harness clearable text='03.11.2026' onClear={onClear}/>);
		const clear = screen.getByRole('button', { name: 'Очистить' });
		expect(clear.getAttribute('tabindex')).toBe('-1');
		expect(fireEvent.mouseDown(clear)).toBe(false);
		fireEvent.click(clear);
		expect(onClear).toHaveBeenCalledTimes(1);
		expect(document.activeElement).toBe(field());
	});

	it('clearable ставит data-clearable на оболочку независимо от текста, чтобы поле не меняло ширину', () => {
		render(() => <Harness clearable text=''/>);
		const shell = field().parentElement;
		expect(shell?.hasAttribute('data-clearable')).toBe(true);
	});

	it('без clearable data-clearable нет', () => {
		render(() => <Harness text='03.11.2026'/>);
		expect(field().parentElement?.hasAttribute('data-clearable')).toBe(false);
	});

	it.each([
		['без clearable', { text: '03.11.2026' }],
		['с пустым текстом', { clearable: true, text: '' }],
		['при readOnly', { clearable: true, readOnly: true, text: '03.11.2026' }],
		['при disabled', { clearable: true, disabled: true, text: '03.11.2026' }]
	])('не показывается %s', (_name, extra) => {
		render(() => <Harness {...extra}/>);
		expect(screen.queryByRole('button', { name: 'Очистить' })).toBeNull();
	});
});
