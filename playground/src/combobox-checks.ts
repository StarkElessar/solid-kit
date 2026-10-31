import { closeWithEscape, frames, required } from './check-helpers';
import type { CheckResult } from './theme-checks';

function listbox(): HTMLElement | null {
	return document.querySelector<HTMLElement>('[role="listbox"]');
}

function optionCount(): number {
	return document.querySelectorAll('[role="option"]').length;
}

function keyDown(input: HTMLElement, key: string, init: KeyboardEventInit = {}): KeyboardEvent {
	const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init });
	input.dispatchEvent(event);
	return event;
}

// программная печать: значение ставится так же, как при вводе, событие `input` всплывает к обработчику поля
function typeText(input: HTMLInputElement, text: string): void {
	input.value = text;
	input.dispatchEvent(new InputEvent('input', { bubbles: true, data: text, inputType: 'insertText' }));
}

async function waitFor(condition: () => boolean, attempts = 40): Promise<boolean> {
	for (let attempt = 0; attempt < attempts; attempt++) {
		if (condition()) {
			return true;
		}
		await frames(1);
	}
	return condition();
}

async function close(): Promise<void> {
	closeWithEscape();
	await frames();
}

/**
 * Автоматические проверки Combobox: роли, фильтр, 100 000 опций, Enter в форме, возврат подписи и сброс значения при уходе
 * из поля. Настоящий ввод с клавиатуры, IME, кольцо фокуса, Esc в диалоге и поведение у краёв окна проверяются вручную.
 */
export async function runComboboxChecks(page: HTMLElement): Promise<CheckResult[]> {
	const results: CheckResult[] = [];
	const check = (name: string, ok: boolean, detail: string): void => {
		results.push({ name, ok, detail });
	};

	const short = required(page, '[data-combobox="short"]') as HTMLInputElement;
	short.focus();
	keyDown(short, 'ArrowDown');
	await frames();
	try {
		const panelList = required(document, '[role="listbox"]');
		check(
			'Combobox: роли поля и списка',
			short.getAttribute('role') === 'combobox'
				&& short.getAttribute('aria-autocomplete') === 'list'
				&& short.getAttribute('aria-expanded') === 'true'
				&& short.getAttribute('aria-controls') === panelList.id
				&& optionCount() === 8,
			`опций ${optionCount()}`
		);
		const active = panelList.querySelector<HTMLElement>('[data-active]');
		check(
			'Combobox: aria-activedescendant указывает на подсвеченную опцию',
			active !== null && short.getAttribute('aria-activedescendant') === active.id,
			`activedescendant = ${short.getAttribute('aria-activedescendant') ?? 'нет'}`
		);
		const wrapper = short.parentElement;
		const panel = panelList.closest<HTMLElement>('[data-s-kit]');
		const wrapperBox = wrapper?.getBoundingClientRect();
		const panelBox = panel?.getBoundingClientRect();
		check(
			'Combobox: панель в top layer и той же ширины, что поле целиком',
			panel !== null && panel.matches(':popover-open') && wrapperBox !== undefined && panelBox !== undefined
				&& Math.abs(panelBox.width - wrapperBox.width) <= 1,
			`панель ${panelBox?.width.toFixed(1) ?? '—'} px, поле ${wrapperBox?.width.toFixed(1) ?? '—'} px`
		);
		check(
			'Combobox: фокус остался в поле',
			document.activeElement === short,
			document.activeElement === short ? 'в поле' : 'фокус ушёл'
		);
		const toggle = wrapper?.querySelector('button');
		check(
			'Combobox: шеврон вне порядка табуляции и лежит внутри поля',
			toggle !== null && toggle !== undefined && toggle.getAttribute('tabindex') === '-1'
				&& toggle.getBoundingClientRect().right <= short.getBoundingClientRect().right + 1,
			`tabindex ${toggle?.getAttribute('tabindex') ?? 'нет'}`
		);

		typeText(short, 'Сотрудник 1');
		await frames();
		const filtered = [...document.querySelectorAll('[role="option"]')].map((option) => option.textContent);
		check(
			'Combobox: печать фильтрует по подписи',
			filtered.length === 1 && filtered[0] === 'Сотрудник 1',
			`опции: ${filtered.join(', ') || 'нет'}`
		);
	}
	finally {
		await close();
	}

	// открыть список выбранного значения без печати: виден весь список
	short.focus();
	keyDown(short, 'ArrowDown');
	await frames();
	keyDown(short, 'ArrowDown');
	keyDown(short, 'Enter');
	await frames();
	const selectedText = short.value;
	keyDown(short, 'ArrowDown');
	await frames();
	check(
		'Combobox: после выбора список открывается целиком',
		selectedText !== '' && optionCount() === 8,
		`подпись «${selectedText}», опций ${optionCount()}`
	);
	await close();

	// уход из поля: текст возвращается к подписи, пустой текст сбрасывает значение
	typeText(short, 'абв');
	await frames();
	short.blur();
	await frames();
	check('Combobox: уход из поля возвращает подпись значения', short.value === selectedText, `в поле «${short.value}»`);
	short.focus();
	typeText(short, '');
	await frames();
	short.blur();
	await frames();
	check('Combobox: пустой текст при уходе сбрасывает значение', short.value === '', `в поле «${short.value}»`);

	const huge = required(page, '[data-combobox="huge"]') as HTMLInputElement;
	huge.focus();
	const started = performance.now();
	keyDown(huge, 'ArrowDown');
	const opened = await waitFor(() => optionCount() > 0);
	const openTime = performance.now() - started;
	check('Combobox: 100 000 опций, в DOM не более 30', opened && optionCount() <= 30, `опций в DOM ${optionCount()}`);
	check('Combobox: открытие на 100 000 опций быстрее 100 мс', openTime < 100, `${openTime.toFixed(0)} мс`);
	typeText(huge, 'Сотрудник 9999');
	await frames();
	const hugeFiltered = optionCount();
	check('Combobox: фильтр по 100 000 опций оставляет десяток строк', hugeFiltered >= 1 && hugeFiltered <= 12, `опций ${hugeFiltered}`);
	await close();
	huge.blur();

	const form = required(page, '[data-combobox-form]') as HTMLFormElement;
	const formInput = required(form, '[data-combobox="form"]') as HTMLInputElement;
	const sent = { submitted: false };
	const onSubmit = (): void => {
		sent.submitted = true;
	};
	form.addEventListener('submit', onSubmit);
	formInput.focus();
	keyDown(formInput, 'ArrowDown');
	await frames();
	const enter = keyDown(formInput, 'Enter');
	await frames();
	check(
		'Combobox: Enter с активной опцией выбирает и не отправляет форму',
		enter.defaultPrevented && formInput.value !== '' && !sent.submitted && listbox() === null,
		`подпись «${formInput.value}», отправлено: ${sent.submitted ? 'да' : 'нет'}`
	);
	const idle = keyDown(formInput, 'Enter');
	check('Combobox: Enter при закрытом списке не перехватывается', !idle.defaultPrevented, `defaultPrevented ${idle.defaultPrevented}`);
	form.removeEventListener('submit', onSubmit);
	formInput.blur();

	const server = required(page, '[data-combobox="server"]') as HTMLInputElement;
	server.focus();
	typeText(server, 'Сотрудник 5');
	await frames(2);
	const loadingShown = document.body.textContent.includes('Загрузка');
	const arrived = await waitFor(() => optionCount() > 0, 60);
	check(
		'Combobox: внешний поиск показывает загрузку, затем результаты',
		loadingShown && arrived,
		`загрузка видна: ${loadingShown ? 'да' : 'нет'}, опций ${optionCount()}`
	);
	await close();
	server.blur();

	return results;
}
