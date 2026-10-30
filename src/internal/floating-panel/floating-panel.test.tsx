import { cleanup, createEvent, fireEvent, render, screen } from '@solidjs/testing-library';
import { createSignal, type JSX } from 'solid-js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PanelHostContext } from '../panel/panel-host';

import { FloatingPanel } from './floating-panel';

beforeEach(() => {
	// jsdom не реализует Popover API
	// jsdom считает содержимое закрытого [popover] нефокусируемым: «показ» снимает атрибут
	HTMLElement.prototype.showPopover = vi.fn(function (this: HTMLElement) {
		this.removeAttribute('popover');
	});
	HTMLElement.prototype.hidePopover = vi.fn();
});

afterEach(cleanup);

interface Harness {
	onDismiss: ReturnType<typeof vi.fn>;
	setOpen: (open: boolean) => void;
}

interface PanelOptions {
	open?: boolean;
	/** `inner` вызывать внутри обёртки (`{inner()}`): иначе содержимое создаётся раньше провайдера контекста и не видит его. */
	wrap?: (inner: () => JSX.Element) => JSX.Element;
	children?: JSX.Element;
	dismissExempt?: (() => Element | undefined) | undefined;
}

function renderPanel(options: PanelOptions = {}): Harness {
	const onDismiss = vi.fn();
	const [open, setOpen] = createSignal(options.open ?? true);
	const [anchor, setAnchor] = createSignal<HTMLElement>();
	const wrap = options.wrap ?? ((inner: () => JSX.Element) => inner());
	render(() =>
		wrap(() => (
			<>
				<button type='button' ref={setAnchor}>anchor</button>
				<FloatingPanel
					open={open}
					onDismiss={onDismiss}
					anchor={anchor}
					dismissExempt={options.dismissExempt}
					data-testid='panel'
				>
					{options.children ?? 'content'}
				</FloatingPanel>
			</>
		))
	);
	return { onDismiss, setOpen };
}

describe('FloatingPanel', () => {
	it('renders only while open and removes the panel when closed', () => {
		const { setOpen } = renderPanel({ open: false });
		expect(screen.queryByTestId('panel')).toBeNull();
		setOpen(true);
		expect(screen.getByTestId('panel')).toBeTruthy();
		setOpen(false);
		expect(screen.queryByTestId('panel')).toBeNull();
	});

	it('mounts the panel into the parent of the anchor, through a display: contents wrapper', () => {
		renderPanel({ wrap: (inner) => <section data-testid='host'>{inner()}</section> });
		const panel = screen.getByTestId('panel');
		const host = screen.getByTestId('host');
		expect(panel.parentElement?.parentElement).toBe(host);
		expect(panel.parentElement?.style.display).toBe('contents');
		expect(screen.getByText('anchor').contains(panel)).toBe(false);
	});

	it('skips a label ancestor: the panel is not a descendant of the label', () => {
		renderPanel({
			wrap: (inner) => <section data-testid='host'><label data-testid='label'>{inner()}</label></section>
		});
		const panel = screen.getByTestId('panel');
		expect(screen.getByTestId('label').contains(panel)).toBe(false);
		expect(panel.parentElement?.parentElement).toBe(screen.getByTestId('host'));
	});

	it('mounts into the host given by PanelHostContext', () => {
		const custom = document.createElement('aside');
		document.body.append(custom);
		renderPanel({ wrap: (inner) => <PanelHostContext.Provider value={() => custom}>{inner()}</PanelHostContext.Provider> });
		expect(custom.contains(screen.getByTestId('panel'))).toBe(true);
		custom.remove();
	});

	it('the nearest PanelHostContext provider wins', () => {
		const outer = document.createElement('aside');
		const inner = document.createElement('nav');
		document.body.append(outer, inner);
		renderPanel({
			wrap: (content) => (
				<PanelHostContext.Provider value={() => outer}>
					<PanelHostContext.Provider value={() => inner}>{content()}</PanelHostContext.Provider>
				</PanelHostContext.Provider>
			)
		});
		expect(inner.contains(screen.getByTestId('panel'))).toBe(true);
		expect(outer.contains(screen.getByTestId('panel'))).toBe(false);
		outer.remove();
		inner.remove();
	});

	it('puts data-s-kit, the size attribute, class and style on the root and passes other attributes through', () => {
		const [anchor, setAnchor] = createSignal<HTMLElement>();
		render(() => (
			<>
				<button type='button' ref={setAnchor}>anchor</button>
				<FloatingPanel
					open={() => true}
					onDismiss={() => {}}
					anchor={anchor}
					size='lg'
					class='x'
					style={{ color: 'red' }}
					aria-label='Панель'
					data-testid='panel'
				>
					c
				</FloatingPanel>
			</>
		));
		const panel = screen.getByTestId('panel');
		expect(panel.hasAttribute('data-s-kit')).toBe(true);
		expect(panel.getAttribute('data-s-kit-size')).toBe('lg');
		expect(panel.className).toBe('x');
		expect(panel.style.color).toBe('red');
		expect(panel.getAttribute('aria-label')).toBe('Панель');
	});

	it('isolates delegated events from logical ancestors but not from handlers inside', () => {
		const onParentClick = vi.fn();
		const onInnerClick = vi.fn();
		renderPanel({
			wrap: (inner) => <div onClick={onParentClick}>{inner()}</div>,
			children: <button type='button' onClick={onInnerClick}>inside</button>
		});
		fireEvent.click(screen.getByText('inside'));
		expect(onInnerClick).toHaveBeenCalledOnce();
		expect(onParentClick).not.toHaveBeenCalled();
		fireEvent.click(screen.getByText('anchor'));
		expect(onParentClick).toHaveBeenCalledOnce();
	});

	it('runs the own keydown handler first and then stops the event from reaching ancestors', () => {
		const onParentKeyDown = vi.fn();
		const onKeyDown = vi.fn();
		const [anchor, setAnchor] = createSignal<HTMLElement>();
		render(() => (
			<div onKeyDown={onParentKeyDown}>
				<button type='button' ref={setAnchor}>anchor</button>
				<FloatingPanel open={() => true} onDismiss={() => {}} anchor={anchor} onKeyDown={onKeyDown} data-testid='panel'>
					<button type='button'>inside</button>
				</FloatingPanel>
			</div>
		));
		fireEvent.keyDown(screen.getByText('inside'), { key: 'a' });
		expect(onKeyDown).toHaveBeenCalledOnce();
		expect(onParentKeyDown).not.toHaveBeenCalled();
	});

	it('Escape and a click outside dismiss, a click on the anchor does not', () => {
		const { onDismiss } = renderPanel();
		fireEvent.pointerDown(screen.getByText('anchor'));
		expect(onDismiss).not.toHaveBeenCalled();
		fireEvent.pointerDown(document.body);
		expect(onDismiss).toHaveBeenCalledOnce();
		fireEvent.keyDown(document.body, { key: 'Escape' });
		expect(onDismiss).toHaveBeenCalledTimes(2);
	});

	it('a click on a big dismissExempt-less area counts as outside: dismissExempt decides what is exempt from dismissal', () => {
		const { onDismiss } = renderPanel({ dismissExempt: () => undefined });
		fireEvent.pointerDown(screen.getByText('anchor'));
		expect(onDismiss).toHaveBeenCalledOnce();
	});

	it('focuses the first tabbable element on open and returns the focus to the anchor on close', () => {
		const { setOpen } = renderPanel({ children: <button type='button'>inside</button> });
		expect(document.activeElement).toBe(screen.getByText('inside'));
		setOpen(false);
		expect(document.activeElement).toBe(screen.getByText('anchor'));
	});

	it('does not take the focus back when it already moved to another element', () => {
		const { setOpen } = renderPanel({ wrap: (inner) => <>{inner()}<input aria-label='other'/></> });
		const other = screen.getByLabelText('other');
		other.focus();
		setOpen(false);
		expect(document.activeElement).toBe(other);
	});

	it('cancels Enter in an input whose form is outside the panel, so that the host form is not submitted', () => {
		renderPanel({
			wrap: (inner) => <form>{inner()}</form>,
			children: <input aria-label='name'/>
		});
		const event = createEvent.keyDown(screen.getByLabelText('name'), { key: 'Enter' });
		fireEvent(screen.getByLabelText('name'), event);
		expect(event.defaultPrevented).toBe(true);
	});
});
