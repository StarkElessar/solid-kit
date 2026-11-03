import { contrastRatio } from '../../src/utils/color-math';

import { frames, required } from './check-helpers';
import { type CheckResult, resolveColor } from './theme-checks';

function inputOf(page: ParentNode, id: string): HTMLInputElement {
	const input = required(page, `[data-datetime-demo="${id}"] input[role="combobox"]`);
	if (!(input instanceof HTMLInputElement)) {
		throw new TypeError(`DateTime demo ${id} has no input`);
	}
	return input;
}

function panelOf(input: HTMLElement): HTMLElement | null {
	return document.getElementById(input.getAttribute('aria-controls') ?? '');
}

function toggleOf(input: HTMLElement): HTMLElement {
	return required(input.parentElement ?? document.body, 'button[aria-label="Открыть выбор даты и времени"]');
}

function optionOf(panel: HTMLElement | null, column: string, label: string): HTMLElement | null {
	const lists = [...(panel?.querySelectorAll<HTMLElement>('[role="listbox"]') ?? [])];
	const list = lists.find((item) => item.getAttribute('aria-label') === column);
	return [...(list?.querySelectorAll<HTMLElement>('[role="option"]') ?? [])].find((item) => item.textContent === label) ?? null;
}

function dayOf(panel: HTMLElement | null, labelStart: string): HTMLElement | null {
	return [...(panel?.querySelectorAll<HTMLElement>('[role="gridcell"] button') ?? [])]
		.find((item) => item.getAttribute('aria-label')?.startsWith(labelStart) === true) ?? null;
}

function keyDown(target: HTMLElement, key: string): void {
	target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
}

/** `true`, если никто не отменил событие. */
function keyDownAllowed(target: HTMLElement, key: string, shiftKey = false): boolean {
	return target.dispatchEvent(new KeyboardEvent('keydown', { key, shiftKey, bubbles: true, cancelable: true }));
}

function typeText(input: HTMLInputElement, text: string): void {
	input.value = text;
	input.dispatchEvent(new InputEvent('input', { bubbles: true }));
}

function formText(form: HTMLFormElement, name: string): string {
	const entry = new FormData(form).get(name);
	return typeof entry === 'string' ? entry : '';
}

function stateOf(page: ParentNode, id: string): string {
	return required(page, `[data-datetime-demo="${id}"] [data-datetime-state]`).textContent;
}

function countIn(panel: HTMLElement | null, selector: string): number {
	return panel?.querySelectorAll(selector).length ?? 0;
}

function exists(node: Element | null | undefined): string {
	return node ? 'есть' : 'нет';
}

function activeTag(): string {
	return document.activeElement?.tagName ?? '?';
}

function pad(value: number): string {
	return String(value).padStart(2, '0');
}

function nowText(): string {
	const now = new Date();
	return `${pad(now.getDate())}.${pad(now.getMonth() + 1)}.${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

async function dismiss(): Promise<void> {
	document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
	await frames();
}

async function openByClick(input: HTMLInputElement): Promise<HTMLElement | null> {
	input.scrollIntoView({ behavior: 'instant', block: 'center' });
	input.focus();
	input.click();
	await frames();
	return panelOf(input);
}

/**
 * Приёмка DateTimePicker (спек этапа 5, часть 4): открытие кликом по полю и по значку, выбор дня, часа и минут, «Сейчас», ввод и
 * принятие текста, клавиатура и Tab по областям, положение панели, предки с обрезкой, ограничения, 12 часов, форма, контраст.
 * Esc в диалоге и настоящий Tab проверяются вручную настоящими клавишами.
 */
export async function runDateTimePickerChecks(page: HTMLElement): Promise<CheckResult[]> {
	const results: CheckResult[] = [];
	const check = (name: string, ok: boolean, detail: string): void => {
		results.push({ name, ok, detail });
	};

	// открытие кликом по полю и по значку
	{
		const input = inputOf(page, 'size-md');
		const panel = await openByClick(input);
		const opened = panel !== null && input.getAttribute('aria-expanded') === 'true';
		check('DateTimePicker: клик по полю открывает панель', opened, exists(panel));
		check('DateTimePicker: после клика курсор остаётся в поле', document.activeElement === input, `активен ${activeTag()}`);
		const field = (input.parentElement ?? input).getBoundingClientRect();
		const box = panel?.getBoundingClientRect();
		const aligned = box !== undefined && Math.abs(box.left - field.left) <= 1;
		// под полем; над ним только если снизу не хватает места (окно низкое)
		const below = box !== undefined && box.top >= field.bottom - 1;
		const flipped = box !== undefined && box.bottom <= field.top + 1 && innerHeight - field.bottom < box.height;
		const under = aligned && (below || flipped);
		const dy = box ? (box.top - field.bottom).toFixed(1) : '?';
		const dx = box ? (box.left - field.left).toFixed(1) : '?';
		check('DateTimePicker: панель стоит у поля и его левого края', under, `сверху ${dy}px, слева ${dx}px`);
		const overscroll = panel ? getComputedStyle(panel).overscrollBehaviorY : '?';
		check('DateTimePicker: прокрутка над панелью не уходит странице', overscroll === 'contain', `overscroll-behavior ${overscroll}`);
		input.click();
		await frames();
		check('DateTimePicker: повторный клик по полю панель не закрывает', panelOf(input) !== null, exists(panelOf(input)));
		toggleOf(input).click();
		await frames();
		check('DateTimePicker: клик по значку при открытой панели закрывает её', panelOf(input) === null, exists(panelOf(input)));
		toggleOf(input).click();
		await frames();
		check('DateTimePicker: клик по значку открывает панель', panelOf(input) !== null, exists(panelOf(input)));
		check('DateTimePicker: после клика по значку фокус в поле', document.activeElement === input, `активен ${activeTag()}`);
		const open = panelOf(input);
		const marked = dayOf(open, 'четверг, 14 ноября 2030')?.hasAttribute('data-selected') === true
			&& optionOf(open, 'Часы', '14')?.getAttribute('aria-selected') === 'true';
		check('DateTimePicker: выбранные день и время отмечены', marked, `день ${exists(dayOf(open, 'четверг, 14 ноября 2030'))}`);
		const content = open?.querySelector('[role="group"]')?.parentElement?.getBoundingClientRect();
		const lists = [...(open?.querySelectorAll('[role="listbox"]') ?? [])].map((item) => item.getBoundingClientRect());
		const sideBySide = content !== undefined && lists.length === 2 && lists.every((rect) => rect.left >= content.left + 1);
		check('DateTimePicker: колонки времени стоят справа от календаря', sideBySide, `колонок ${lists.length}`);
		await dismiss();
		check('DateTimePicker: клик снаружи закрывает панель', panelOf(input) === null, exists(panelOf(input)));
	}

	// выбор дня, часа, минут и «Сейчас»
	{
		const input = inputOf(page, 'controlled');
		typeText(input, '14.11.2030 09:30');
		keyDown(input, 'Enter');
		await frames();
		check(
			'DateTimePicker: в поле с clearable дата и время помещаются целиком',
			input.scrollWidth <= input.clientWidth,
			`текст ${input.scrollWidth}px, поле ${input.clientWidth}px`
		);
		const panel = await openByClick(input);
		optionOf(panel, 'Часы', '11')?.click();
		await frames();
		const afterHour = stateOf(page, 'controlled');
		check(
			'DateTimePicker: выбор часа меняет значение и оставляет панель открытой',
			afterHour.includes('2030-11-14T11:30') && panelOf(input) !== null,
			afterHour
		);
		dayOf(panelOf(input), 'вторник, 19 ноября 2030')?.click();
		await frames();
		const afterDay = stateOf(page, 'controlled');
		check(
			'DateTimePicker: выбор дня меняет дату, сохраняет время и оставляет панель открытой',
			afterDay.includes('2030-11-19T11:30') && panelOf(input) !== null,
			afterDay
		);
		optionOf(panelOf(input), 'Минуты', '45')?.click();
		await frames();
		const afterMinute = stateOf(page, 'controlled');
		check(
			'DateTimePicker: выбор минут завершает выбор: панель закрыта, текст обновлён',
			afterMinute.includes('2030-11-19T11:45') && panelOf(input) === null && input.value === '19.11.2030 11:45',
			`${afterMinute}; текст ${input.value}`
		);
		check('DateTimePicker: после выбора фокус возвращается в поле', document.activeElement === input, `активен ${activeTag()}`);
		await openByClick(input);
		const buttons = [...(panelOf(input)?.querySelectorAll('button') ?? [])];
		const nowButtons = buttons.filter((button) => button.textContent === 'Сейчас').length;
		const hasToday = buttons.some((button) => button.textContent === 'Сегодня');
		check('DateTimePicker: у календаря нет своего «Сегодня», «Сейчас» одна', nowButtons === 1 && !hasToday, `кнопок ${buttons.length}`);
		buttons.find((button) => button.textContent === 'Сейчас')?.click();
		await frames();
		check(
			'DateTimePicker: «Сейчас» выбирает сегодня и текущее время и закрывает панель',
			input.value === nowText() && panelOf(input) === null,
			`текст ${input.value}, ожидалось ${nowText()}`
		);
	}

	// ввод текста
	{
		const input = inputOf(page, 'controlled');
		await openByClick(input);
		typeText(input, '15.12.2030 17:25');
		await frames();
		const open = panelOf(input);
		const focusLabel = open?.querySelector('[data-focus-target][aria-label]')?.getAttribute('aria-label') ?? '';
		const highlighted = [...(open?.querySelectorAll('[data-highlighted]') ?? [])].map((item) => item.textContent).sort();
		const before = stateOf(page, 'controlled');
		check(
			'DateTimePicker: набранные дата и время показываются в панели до принятия',
			focusLabel.includes('15 декабря 2030') && highlighted.join() === '17,25' && !before.includes('2030-12-15'),
			`${focusLabel}; ${highlighted.join()}; ${before}`
		);
		keyDown(input, 'Enter');
		await frames();
		const after = stateOf(page, 'controlled');
		check(
			'DateTimePicker: Enter принимает набранное и закрывает панель',
			after.includes('2030-12-15T17:25') && panelOf(input) === null,
			after
		);
		typeText(input, '17:25');
		keyDown(input, 'Enter');
		await frames();
		check('DateTimePicker: время без даты откатывается', input.value === '15.12.2030 17:25', `текст ${input.value}`);
		typeText(input, '31.02.2030 10:00');
		keyDown(input, 'Enter');
		await frames();
		check('DateTimePicker: невалидный текст откатывается', input.value === '15.12.2030 17:25', `текст ${input.value}`);
		typeText(input, '16.12.2030');
		keyDown(input, 'Enter');
		await frames();
		const dateOnly = input.value === '16.12.2030 17:25';
		check('DateTimePicker: дата без времени принимается с прежним временем', dateOnly, `текст ${input.value}`);
		typeText(input, '');
		keyDown(input, 'Enter');
		await frames();
		const cleared = stateOf(page, 'controlled');
		check('DateTimePicker: пустой текст принимается как null', cleared.includes('null') && input.value === '', cleared);
	}

	// клавиатура: ArrowDown переносит фокус на день, Tab ходит по панели, Esc закрывает
	{
		const input = inputOf(page, 'size-lg');
		input.scrollIntoView({ behavior: 'instant', block: 'center' });
		input.focus();
		keyDown(input, 'ArrowDown');
		await frames();
		const active = document.activeElement;
		const open = panelOf(input);
		const inPanel = open?.contains(active) === true;
		const onDay = inPanel && active?.hasAttribute('data-focus-target') === true && active.closest('[role="gridcell"]') !== null;
		check('DateTimePicker: ArrowDown открывает панель и переносит фокус на день', onDay, `активен ${activeTag()}`);
		check(
			'DateTimePicker: Tab внутри панели не отменяется и панель остаётся открытой',
			active instanceof HTMLElement && keyDownAllowed(active, 'Tab') && panelOf(input) !== null,
			`панель ${exists(panelOf(input))}`
		);
		const now = [...(open?.querySelectorAll('button') ?? [])].find((button) => button.textContent === 'Сейчас');
		check(
			'DateTimePicker: Tab на «Сейчас» закрывает панель и возвращает фокус в поле',
			now !== undefined && !keyDownAllowed(now, 'Tab') && panelOf(input) === null && document.activeElement === input,
			`активен ${activeTag()}`
		);
		keyDown(input, 'ArrowDown');
		await frames();
		const opened = document.activeElement;
		opened?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
		await frames();
		check(
			'DateTimePicker: Esc закрывает панель и возвращает фокус в поле',
			panelOf(input) === null && document.activeElement === input,
			`активен ${activeTag()}`
		);
	}

	// подпись Field: клик фокусирует поле и не открывает панель
	{
		const input = inputOf(page, 'field');
		input.scrollIntoView({ behavior: 'instant', block: 'center' });
		required(page, '[data-datetime-demo="field"] label').click();
		await frames();
		check(
			'DateTimePicker: клик по подписи Field фокусирует поле и не открывает панель',
			document.activeElement === input && panelOf(input) === null,
			`активен ${activeTag()}, панель ${exists(panelOf(input))}`
		);
		input.blur();
	}

	// readOnly, disabled, ограничения
	{
		const readonly = inputOf(page, 'readonly');
		readonly.focus();
		readonly.click();
		toggleOf(readonly).click();
		await frames();
		check('DateTimePicker: readOnly панель не открывает', panelOf(readonly) === null, exists(panelOf(readonly)));
		const disabled = inputOf(page, 'disabled');
		toggleOf(disabled).click();
		await frames();
		check('DateTimePicker: disabled панель не открывает', panelOf(disabled) === null, exists(panelOf(disabled)));
		const limits = inputOf(page, 'limits');
		const panel = await openByClick(limits);
		const blockedDay = (label: string): boolean => dayOf(panel, label)?.getAttribute('aria-disabled') === 'true';
		check(
			'DateTimePicker: дни вне диапазона и выходные отключены',
			blockedDay('понедельник, 4 ноября 2030') && blockedDay('вторник, 26 ноября 2030') && blockedDay('суббота, 16 ноября 2030')
				&& !blockedDay('вторник, 12 ноября 2030'),
			`4 нояб. ${blockedDay('понедельник, 4 ноября 2030')}, 26 нояб. ${blockedDay('вторник, 26 ноября 2030')}`
		);
		const blocked = (label: string): boolean => optionOf(panel, 'Часы', label)?.getAttribute('aria-disabled') === 'true';
		check(
			'DateTimePicker: обеденный час отключён, остальные часы доступны',
			blocked('13') && !blocked('08') && !blocked('19'),
			`13 ${blocked('13')}`
		);
		const minuteRows = countIn(panel, '[aria-label="Минуты"] [role="option"]');
		check('DateTimePicker: колонка минут идёт с шагом 15', minuteRows === 4, `строк ${minuteRows}`);
		dayOf(panel, 'вторник, 5 ноября 2030')?.click();
		await frames();
		const borderDay = optionOf(panelOf(limits), 'Часы', '08')?.getAttribute('aria-disabled') === 'true';
		check(
			'DateTimePicker: в день min время раньше границы отключено',
			borderDay && limits.value === '05.11.2030 10:00',
			`текст ${limits.value}`
		);
		typeText(limits, '05.11.2030 08:00');
		keyDown(limits, 'Enter');
		await frames();
		check('DateTimePicker: время раньше min в день min не принимается', limits.value === '05.11.2030 10:00', `текст «${limits.value}»`);
		typeText(limits, '25.11.2030 19:00');
		keyDown(limits, 'Enter');
		await frames();
		check('DateTimePicker: время позже max в день max не принимается', limits.value === '05.11.2030 10:00', `текст «${limits.value}»`);
		await dismiss();
	}

	// 12 часов
	{
		const input = inputOf(page, 'english');
		typeText(input, '12/15/2030 2:30pm');
		keyDown(input, 'Enter');
		await frames();
		check('DateTimePicker en-US: текст в 12-часовом виде', input.value === '12/15/2030 2:30 PM', `текст ${input.value}`);
		check(
			'DateTimePicker en-US: значение помещается в поле с clearable',
			input.scrollWidth <= input.clientWidth,
			`текст ${input.scrollWidth}px, поле ${input.clientWidth}px`
		);
		const panel = await openByClick(input);
		check(
			'DateTimePicker en-US: три колонки времени',
			countIn(panel, '[role="listbox"]') === 3,
			`колонок ${countIn(panel, '[role="listbox"]')}`
		);
		optionOf(panel, 'AM/PM', 'AM')?.click();
		await frames();
		check(
			'DateTimePicker en-US: выбор AM пересчитывает время и закрывает панель',
			input.value === '12/15/2030 2:30 AM' && panelOf(input) === null,
			`текст ${input.value}`
		);
		await dismiss();
	}

	// форма
	{
		const input = inputOf(page, 'form');
		const hidden = required(page, '[data-datetime-demo="form"] input[type="hidden"]');
		const form = hidden.closest('form');
		typeText(input, '18.11.2030 18:00');
		keyDown(input, 'Enter');
		await frames();
		const before = hidden instanceof HTMLInputElement ? hidden.value : '';
		typeText(input, '20.11.2030 20:15');
		keyDown(input, 'Enter');
		await frames();
		const sent = form ? formText(form, 'at') : '';
		check(
			'DateTimePicker: FormData получает значение YYYY-MM-DDTHH:mm',
			before === '2030-11-18T18:00' && sent === '2030-11-20T20:15',
			`было ${before}, ушло ${sent}`
		);
		await dismiss();
	}

	// контраст выбранных день и час
	{
		const input = inputOf(page, 'size-md');
		const panel = await openByClick(input);
		const pairs = [['день', dayOf(panel, 'четверг, 14 ноября 2030')], ['час', optionOf(panel, 'Часы', '14')]] as const;
		for (const [name, selected] of pairs) {
			if (selected) {
				const style = getComputedStyle(selected);
				const text = resolveColor(style.color);
				const fill = resolveColor(style.backgroundColor);
				const ratio = contrastRatio([text[0], text[1], text[2]], [fill[0], fill[1], fill[2]]);
				check(`DateTimePicker: текст выбранного элемента читаем (${name}, 4.5:1)`, ratio >= 4.5, `контраст ${ratio.toFixed(2)}:1`);
			}
			else {
				check(`DateTimePicker: текст выбранного элемента читаем (${name}, 4.5:1)`, false, 'нет выбранного элемента');
			}
		}
		await dismiss();
	}

	// панель в предках с обрезкой
	for (const name of ['transform', 'filter', 'contain', 'overflow']) {
		const holder = required(page, `[data-datetime-demo="clip-${name}"]`);
		const input = inputOf(page, `clip-${name}`);
		const panel = await openByClick(input);
		const box = panel?.getBoundingClientRect();
		const row = panel?.querySelector<HTMLElement>('[role="option"][tabindex="0"]');
		const rowBox = row?.getBoundingClientRect();
		const hit = rowBox ? document.elementFromPoint(rowBox.x + rowBox.width / 2, rowBox.y + rowBox.height / 2) : null;
		const ok = box !== undefined && box.bottom > holder.getBoundingClientRect().bottom && !!row && !!hit && row.contains(hit);
		const detail = box ? `низ панели ${box.bottom.toFixed(0)}, под указателем ${hit?.tagName ?? 'ничего'}` : 'нет панели';
		check(`DateTimePicker: предок с ${name}, панель не обрезана и принимает указатель`, ok, detail);
		await dismiss();
	}

	// маска ввода
	{
		const input = inputOf(page, 'controlled');
		typeText(input, '031120301430');
		check('DateTimePicker: цифры превращаются в дату и время', input.value === '03.11.2030 14:30', `текст ${input.value}`);
		typeText(input, '03112030');
		check('DateTimePicker: после года ставится пробел', input.value === '03.11.2030 ', `текст «${input.value}»`);
		typeText(input, 'мусор');
		check('DateTimePicker: буквы не попадают в поле', input.value === '', `текст «${input.value}»`);
		typeText(input, '03.11.2030 14:30');
		keyDown(input, 'Enter');
		await frames();
		const english = inputOf(page, 'english');
		typeText(english, '110320302 30pm');
		check('DateTimePicker en-US: дата, время и период по маске', english.value === '11/03/2030 2:30 pm', `текст ${english.value}`);
		keyDown(english, 'Enter');
		await frames();
	}

	return results;
}
