import { closeWithEscape, frames, required } from './check-helpers';
import type { CheckResult } from './theme-checks';

function listbox(): HTMLElement | null {
	return document.querySelector<HTMLElement>('[role="listbox"]');
}

function options(): HTMLElement[] {
	return [...document.querySelectorAll<HTMLElement>('[role="option"]')];
}

function option(label: string): HTMLElement {
	const found = options().find((candidate) => candidate.textContent === label);
	if (!found) {
		throw new Error(`Playground option is missing: ${label}`);
	}
	return found;
}

function keyDown(element: HTMLElement, key: string): KeyboardEvent {
	const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
	element.dispatchEvent(event);
	return event;
}

// программная печать: значение ставится так же, как при вводе, событие `input` всплывает к обработчику поля
function typeText(input: HTMLInputElement, text: string): void {
	input.value = text;
	input.dispatchEvent(new InputEvent('input', { bubbles: true, data: text, inputType: 'insertText' }));
}

function counterOf(trigger: HTMLElement): string {
	return shellOf(trigger).querySelector('[data-multiselect-counter]')?.textContent ?? '';
}

function shellOf(trigger: HTMLElement): HTMLElement {
	const shell = trigger.closest<HTMLElement>('[data-multiselect-overflow]');
	if (!shell) {
		throw new Error('Playground element is missing: shell');
	}
	return shell;
}

function visibleChips(trigger: HTMLElement): string[] {
	return [...shellOf(trigger).querySelectorAll<HTMLElement>('[data-multiselect-chip]')]
		.filter((chip) => !chip.hidden)
		.map((chip) => chip.textContent);
}

// все чипы в DOM, в том числе скрытые режимом collapse: значение они не теряют
function allChips(trigger: HTMLElement): string[] {
	return [...shellOf(trigger).querySelectorAll<HTMLElement>('[data-multiselect-chip]')].map((chip) => chip.textContent);
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

async function open(trigger: HTMLElement): Promise<void> {
	// настоящий клик фокусирует кнопку, программный `click()` нет
	trigger.focus();
	trigger.click();
	await waitFor(() => options().length > 0);
	await frames(2);
}

async function close(): Promise<void> {
	closeWithEscape();
	await frames();
}

/**
 * Автоматические проверки MultiSelect: роли, панель остаётся открытой после выбора, ввод в поле триггера и выбранное вне
 * результата, строка «Все» со значением -1, кнопка `×`, режимы collapse и summary, 100 000 опций, Enter в форме.
 * Настоящий ввод с клавиатуры, порядок Tab по чипам, кольца фокуса, Esc в диалоге, сужение окна и IME проверяются вручную.
 */
export async function runMultiSelectChecks(page: HTMLElement): Promise<CheckResult[]> {
	const results: CheckResult[] = [];
	const check = (name: string, ok: boolean, detail: string): void => {
		results.push({ name, ok, detail });
	};

	const short = required(page, '[data-multiselect="short"]');
	await open(short);
	try {
		const list = required(document, '[role="listbox"]');
		check(
			'MultiSelect: роли поля и списка, фокус остаётся в поле триггера, в панели поля ввода нет',
			short.tagName === 'INPUT' && short.getAttribute('role') === 'combobox'
				&& short.getAttribute('aria-expanded') === 'true'
				&& short.getAttribute('aria-controls') === list.id
				&& list.getAttribute('aria-multiselectable') === 'true'
				&& document.activeElement === short && options().length === 8
				&& list.closest('[data-s-kit]')?.querySelector('input') === null,
			`опций ${options().length}, фокус ${document.activeElement === short ? 'в поле триггера' : 'не в поле'}`
		);
		option('Сотрудник 0').click();
		await frames();
		check(
			'MultiSelect: панель остаётся открытой после выбора, чип появился',
			listbox() !== null && option('Сотрудник 0').getAttribute('aria-selected') === 'true'
				&& visibleChips(short).includes('Сотрудник 0'),
			`чипы: ${visibleChips(short).join(', ') || 'нет'}`
		);
		typeText(short as HTMLInputElement, 'Сотрудник 5');
		await frames();
		const filtered = options().map((candidate) => candidate.textContent);
		check(
			'MultiSelect: печать в поле триггера фильтрует',
			filtered.length === 1 && filtered[0] === 'Сотрудник 5',
			`опции: ${filtered.join(', ')}`
		);
		option('Сотрудник 5').click();
		await frames();
		check(
			'MultiSelect: выбранное вне результата поиска остаётся в чипах',
			allChips(short).includes('Сотрудник 0') && allChips(short).includes('Сотрудник 5'),
			`чипы: ${allChips(short).join(', ')}`
		);
	}
	finally {
		await close();
	}
	check(
		'MultiSelect: после Esc запрос очищен, фокус в поле',
		listbox() === null && document.activeElement === short && (short as HTMLInputElement).value === '',
		document.activeElement === short ? 'фокус в поле' : 'фокус ушёл'
	);

	// × убирает чип и возвращает фокус на основную кнопку
	const removeButton = shellOf(short).querySelector<HTMLButtonElement>('[data-multiselect-chip] button');
	removeButton?.click();
	await frames();
	check(
		'MultiSelect: × убирает чип, фокус в поле',
		!allChips(short).includes('Сотрудник 0') && document.activeElement === short,
		`чипы: ${allChips(short).join(', ') || 'нет'}`
	);

	const all = required(page, '[data-multiselect="all"]');
	const allValue = required(page, '[data-multiselect-all-value]');
	await open(all);
	try {
		check(
			'MultiSelect: «Все» первой строкой',
			options()[0]?.textContent === 'Все сотрудники',
			`первая: ${options()[0]?.textContent ?? 'нет'}`
		);
		option('Все сотрудники').click();
		await frames();
		check(
			'MultiSelect: «Все» даёт значение -1, чип «Все сотрудники», все опции отмечены',
			allValue.textContent.includes('allKey -1') && visibleChips(all).join() === 'Все сотрудники'
				&& option('Сотрудник 1').getAttribute('aria-selected') === 'true',
			allValue.textContent
		);
		option('Сотрудник 1').click();
		await frames();
		check(
			'MultiSelect: снятие одной опции при «Все» даёт массив остальных',
			/Значение: 7:/.test(allValue.textContent) && !allValue.textContent.includes('Сотрудник 1,')
				&& option('Все сотрудники').getAttribute('aria-selected') === 'false',
			allValue.textContent
		);
	}
	finally {
		await close();
	}

	const narrow = required(page, '[data-multiselect="narrow"]');
	const counter = counterOf(narrow);
	check(
		'MultiSelect: collapse на узком контроле показывает счётчик «+N»',
		/^\+\d+$/.test(counter) && visibleChips(narrow).length >= 1 && visibleChips(narrow).length < 5,
		`чипов видно ${visibleChips(narrow).length} из 5, счётчик «${counter}»`
	);
	const summary = required(page, '[data-multiselect="summary"]');
	check(
		'MultiSelect: summary показывает «N из M»',
		counterOf(summary) === '3 из 60' && visibleChips(summary).length === 0,
		`«${counterOf(summary)}»`
	);

	const plain = required(page, '[data-multiselect="plain"]');
	await open(plain);
	check(
		'MultiSelect: без searchable поле только для чтения, фокус остаётся в нём',
		(plain as HTMLInputElement).readOnly && document.activeElement === plain,
		document.activeElement === plain ? 'фокус в поле' : 'фокус ушёл'
	);
	await close();

	const huge = required(page, '[data-multiselect="huge"]');
	huge.focus();
	const started = performance.now();
	huge.click();
	const opened = await waitFor(() => options().length > 0);
	const openTime = performance.now() - started;
	check('MultiSelect: 100 000 опций, в DOM не более 30', opened && options().length <= 30, `опций в DOM ${options().length}`);
	check('MultiSelect: открытие на 100 000 опций быстрее 100 мс', openTime < 100, `${openTime.toFixed(0)} мс`);
	await close();

	const form = required(page, '[data-multiselect-form]') as HTMLFormElement;
	const formTrigger = required(form, '[data-multiselect="form"]');
	const sent = { submitted: false };
	const onSubmit = (): void => {
		sent.submitted = true;
	};
	form.addEventListener('submit', onSubmit);
	await open(formTrigger);
	keyDown(formTrigger, 'ArrowDown');
	const enterPrevented = keyDown(formTrigger, 'Enter').defaultPrevented;
	await frames();
	check(
		'MultiSelect: Enter с активной опцией выбирает её и не отправляет форму',
		enterPrevented && !sent.submitted && listbox() !== null && visibleChips(formTrigger).length === 1,
		`чипов ${visibleChips(formTrigger).length}, отправлено: ${sent.submitted ? 'да' : 'нет'}`
	);
	form.removeEventListener('submit', onSubmit);
	await close();

	const server = required(page, '[data-multiselect="server"]');
	server.focus();
	server.click();
	await frames(2);
	typeText(server as HTMLInputElement, 'Сотрудник 5');
	await frames(2);
	const loadingShown = document.body.textContent.includes('Загрузка');
	const arrived = await waitFor(() => options().length > 0, 60);
	check(
		'MultiSelect: внешний поиск показывает загрузку, затем результаты',
		loadingShown && arrived,
		`загрузка видна: ${loadingShown ? 'да' : 'нет'}, опций ${options().length}`
	);
	await close();

	return results;
}
