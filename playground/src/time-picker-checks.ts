import { contrastRatio } from '../../src/utils/color-math';

import { frames, required } from './check-helpers';
import { type CheckResult, resolveColor } from './theme-checks';

function inputOf(page: ParentNode, id: string): HTMLInputElement {
	const input = required(page, `[data-time-demo="${id}"] input[role="combobox"]`);
	if (!(input instanceof HTMLInputElement)) {
		throw new TypeError(`Time demo ${id} has no input`);
	}
	return input;
}

function panelOf(input: HTMLElement): HTMLElement | null {
	return document.getElementById(input.getAttribute('aria-controls') ?? '');
}

function toggleOf(input: HTMLElement): HTMLElement {
	return required(input.parentElement ?? document.body, 'button[aria-label="Открыть выбор времени"]');
}

function optionOf(panel: HTMLElement | null, column: string, label: string): HTMLElement | null {
	const lists = [...(panel?.querySelectorAll<HTMLElement>('[role="listbox"]') ?? [])];
	const list = lists.find((item) => item.getAttribute('aria-label') === column);
	return [...(list?.querySelectorAll<HTMLElement>('[role="option"]') ?? [])].find((item) => item.textContent === label) ?? null;
}

function keyDown(target: HTMLElement, key: string): void {
	target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
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
	return required(page, `[data-time-demo="${id}"] [data-time-state]`).textContent;
}

function activeText(): string {
	return document.activeElement?.textContent ?? '?';
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

function nowText(): string {
	const now = new Date();
	return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
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
 * Приёмка TimePicker (спек этапа 5, часть 3): открытие кликом по полю и по значку, выбор часа и минут, «Сейчас», ввод и принятие
 * текста, клавиатура колонок, положение панели, предки с обрезкой, ограничения, 12 часов, форма, контраст. Esc в диалоге
 * проверяется вручную настоящими клавишами.
 */
export async function runTimePickerChecks(page: HTMLElement): Promise<CheckResult[]> {
	const results: CheckResult[] = [];
	const check = (name: string, ok: boolean, detail: string): void => {
		results.push({ name, ok, detail });
	};

	// открытие кликом по полю и по значку
	{
		const input = inputOf(page, 'size-md');
		const panel = await openByClick(input);
		check('TimePicker: клик по полю открывает панель', panel !== null && input.getAttribute('aria-expanded') === 'true', exists(panel));
		check('TimePicker: после клика курсор остаётся в поле', document.activeElement === input, `активен ${activeTag()}`);
		const field = (input.parentElement ?? input).getBoundingClientRect();
		const box = panel?.getBoundingClientRect();
		const aligned = box !== undefined && Math.abs(box.left - field.left) <= 1;
		// под полем; над ним только если снизу не хватает места (окно низкое)
		const below = box !== undefined && box.top >= field.bottom - 1;
		const flipped = box !== undefined && box.bottom <= field.top + 1 && innerHeight - field.bottom < box.height;
		const under = aligned && (below || flipped);
		const dy = box ? (box.top - field.bottom).toFixed(1) : '?';
		const dx = box ? (box.left - field.left).toFixed(1) : '?';
		check('TimePicker: панель стоит у поля и его левого края', under, `сверху ${dy}px, слева ${dx}px`);
		const overscroll = panel ? getComputedStyle(panel).overscrollBehaviorY : '?';
		check('TimePicker: прокрутка над панелью не передаётся странице', overscroll === 'contain', `overscroll-behavior ${overscroll}`);
		input.click();
		await frames();
		check('TimePicker: повторный клик по полю панель не закрывает', panelOf(input) !== null, exists(panelOf(input)));
		toggleOf(input).click();
		await frames();
		check('TimePicker: клик по значку при открытой панели закрывает её', panelOf(input) === null, exists(panelOf(input)));
		toggleOf(input).click();
		await frames();
		check('TimePicker: клик по значку открывает панель', panelOf(input) !== null, exists(panelOf(input)));
		check('TimePicker: после клика по значку фокус в поле', document.activeElement === input, `активен ${activeTag()}`);
		const selected = optionOf(panelOf(input), 'Часы', '14');
		check('TimePicker: выбранные строки отмечены aria-selected', selected?.getAttribute('aria-selected') === 'true', exists(selected));
		await dismiss();
		check('TimePicker: клик снаружи закрывает панель', panelOf(input) === null, exists(panelOf(input)));
	}

	// выбор часа и минут, «Сейчас», ширина текста
	{
		const input = inputOf(page, 'controlled');
		typeText(input, '09:30');
		keyDown(input, 'Enter');
		await frames();
		check(
			'TimePicker: в поле с clearable время помещается целиком',
			input.scrollWidth <= input.clientWidth,
			`текст ${input.scrollWidth}px, поле ${input.clientWidth}px`
		);
		const panel = await openByClick(input);
		optionOf(panel, 'Часы', '11')?.click();
		await frames();
		const afterHour = stateOf(page, 'controlled');
		const hourKept = afterHour.includes('11:30') && panelOf(input) !== null;
		check('TimePicker: выбор часа меняет значение и оставляет панель открытой', hourKept, afterHour);
		optionOf(panelOf(input), 'Минуты', '45')?.click();
		await frames();
		const afterMinute = stateOf(page, 'controlled');
		check(
			'TimePicker: выбор минут завершает выбор: панель закрыта, текст обновлён',
			afterMinute.includes('11:45') && panelOf(input) === null && input.value === '11:45',
			`${afterMinute}; текст ${input.value}`
		);
		check('TimePicker: после выбора фокус возвращается в поле', document.activeElement === input, `активен ${activeTag()}`);
		await openByClick(input);
		const buttons = [...(panelOf(input)?.querySelectorAll('button') ?? [])];
		buttons.find((button) => button.textContent === 'Сейчас')?.click();
		await frames();
		check(
			'TimePicker: «Сейчас» выбирает текущее время и закрывает панель',
			input.value === nowText() && panelOf(input) === null,
			`текст ${input.value}, ожидалось ${nowText()}`
		);
	}

	// ввод текста
	{
		const input = inputOf(page, 'controlled');
		await openByClick(input);
		typeText(input, '1430');
		await frames();
		const highlighted = [...(panelOf(input)?.querySelectorAll('[data-highlighted]') ?? [])].map((item) => item.textContent).sort();
		const before = stateOf(page, 'controlled');
		check(
			'TimePicker: набранное время подсвечивается в колонках до принятия',
			highlighted.join() === '14,30' && !before.includes('14:30'),
			`${highlighted.join()}; ${before}`
		);
		keyDown(input, 'Enter');
		await frames();
		const after = stateOf(page, 'controlled');
		check('TimePicker: Enter принимает набранное время и закрывает панель', after.includes('14:30') && panelOf(input) === null, after);
		typeText(input, '9:5');
		keyDown(input, 'Enter');
		await frames();
		check('TimePicker: невалидный текст откатывается', input.value === '14:30', `текст ${input.value}`);
		typeText(input, '');
		keyDown(input, 'Enter');
		await frames();
		const cleared = stateOf(page, 'controlled');
		check('TimePicker: пустой текст принимается как null', cleared.includes('null') && input.value === '', cleared);
	}

	// клавиатура: ArrowDown переносит фокус в колонки, стрелки двигают фокус, не значение
	{
		const input = inputOf(page, 'size-lg');
		input.scrollIntoView({ behavior: 'instant', block: 'center' });
		input.focus();
		keyDown(input, 'ArrowDown');
		await frames();
		const first = document.activeElement;
		check(
			'TimePicker: ArrowDown открывает панель и переносит фокус на строку часов',
			panelOf(input)?.contains(first) === true && first?.textContent === '14',
			`активен ${activeTag()} ${first?.textContent ?? ''}`
		);
		first instanceof HTMLElement && keyDown(first, 'ArrowDown');
		await frames(1);
		check('TimePicker: ArrowDown в колонке двигает фокус на следующий час', activeText() === '15', `активна ${activeText()}`);
		const moved = document.activeElement;
		moved instanceof HTMLElement && keyDown(moved, 'ArrowRight');
		await frames(1);
		check('TimePicker: ArrowRight переходит в колонку минут', activeText() === '30', `активна ${activeText()}`);
		check('TimePicker: стрелки не меняют значение', input.value === '14:30', `текст ${input.value}`);
		const active = document.activeElement;
		const tabAllowed = active?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }));
		check(
			'TimePicker: Tab внутри панели не отменяется и панель остаётся открытой',
			tabAllowed === true && panelOf(input) !== null,
			`панель ${exists(panelOf(input))}`
		);
		active?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
		await frames();
		const closed = panelOf(input) === null && document.activeElement === input;
		check('TimePicker: Esc закрывает панель и возвращает фокус в поле', closed, `активен ${activeTag()}`);
	}

	// подпись Field: клик фокусирует поле и не открывает панель
	{
		const input = inputOf(page, 'field');
		input.scrollIntoView({ behavior: 'instant', block: 'center' });
		required(page, '[data-time-demo="field"] label').click();
		await frames();
		check(
			'TimePicker: клик по подписи Field фокусирует поле и не открывает панель',
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
		check('TimePicker: readOnly панель не открывает', panelOf(readonly) === null, exists(panelOf(readonly)));
		const disabled = inputOf(page, 'disabled');
		toggleOf(disabled).click();
		await frames();
		check('TimePicker: disabled панель не открывает', panelOf(disabled) === null, exists(panelOf(disabled)));
		const limits = inputOf(page, 'limits');
		const panel = await openByClick(limits);
		const blocked = (label: string): boolean => optionOf(panel, 'Часы', label)?.getAttribute('aria-disabled') === 'true';
		check(
			'TimePicker: часы вне диапазона и обеденный час отключены',
			blocked('08') && blocked('19') && blocked('13') && !blocked('10'),
			`08 ${blocked('08')}, 19 ${blocked('19')}, 13 ${blocked('13')}, 10 ${blocked('10')}`
		);
		const minuteRows = countIn(panel, '[aria-label="Минуты"] [role="option"]');
		check('TimePicker: колонка минут идёт с шагом 15', minuteRows === 4, `строк ${minuteRows}`);
		typeText(limits, '08:00');
		keyDown(limits, 'Enter');
		await frames();
		check('TimePicker: время вне диапазона не принимается', limits.value === '', `текст «${limits.value}»`);
		await dismiss();
	}

	// 12 часов
	{
		const input = inputOf(page, 'english');
		typeText(input, '2:30pm');
		keyDown(input, 'Enter');
		await frames();
		check('TimePicker en-US: текст в 12-часовом виде', input.value === '2:30 PM', `текст ${input.value}`);
		const fits = input.scrollWidth <= input.clientWidth;
		check('TimePicker en-US: время помещается в поле с clearable', fits, `текст ${input.scrollWidth}px, поле ${input.clientWidth}px`);
		const panel = await openByClick(input);
		const columns = countIn(panel, '[role="listbox"]');
		check('TimePicker en-US: три колонки с периодом', columns === 3, `колонок ${columns}`);
		optionOf(panel, 'AM/PM', 'AM')?.click();
		await frames();
		const switched = input.value === '2:30 AM' && panelOf(input) === null;
		check('TimePicker en-US: выбор AM пересчитывает время и закрывает панель', switched, `текст ${input.value}`);
		typeText(input, '11pm');
		keyDown(input, 'Enter');
		await frames();
		check('TimePicker en-US: ввод 11pm даёт 11:00 PM', input.value === '11:00 PM', `текст ${input.value}`);
		await dismiss();
	}

	// форма
	{
		const input = inputOf(page, 'form');
		const hidden = required(page, '[data-time-demo="form"] input[type="hidden"]');
		const form = hidden.closest('form');
		typeText(input, '18:00');
		keyDown(input, 'Enter');
		await frames();
		const before = hidden instanceof HTMLInputElement ? hidden.value : '';
		typeText(input, '20:15');
		keyDown(input, 'Enter');
		await frames();
		const sent = form ? formText(form, 'at') : '';
		check('TimePicker: FormData получает значение HH:mm', before === '18:00' && sent === '20:15', `было ${before}, ушло ${sent}`);
		await dismiss();
	}

	// контраст выбранной строки
	{
		const input = inputOf(page, 'size-md');
		const panel = await openByClick(input);
		const selected = optionOf(panel, 'Часы', '14');
		if (selected) {
			const style = getComputedStyle(selected);
			const text = resolveColor(style.color);
			const fill = resolveColor(style.backgroundColor);
			const ratio = contrastRatio([text[0], text[1], text[2]], [fill[0], fill[1], fill[2]]);
			check('TimePicker: текст выбранной строки читаем (4.5:1)', ratio >= 4.5, `контраст ${ratio.toFixed(2)}:1`);
		}
		else {
			check('TimePicker: текст выбранной строки читаем (4.5:1)', false, 'нет выбранной строки');
		}
		await dismiss();
	}

	// панель в предках с обрезкой
	for (const name of ['transform', 'filter', 'contain', 'overflow']) {
		const holder = required(page, `[data-time-demo="clip-${name}"]`);
		const input = inputOf(page, `clip-${name}`);
		const panel = await openByClick(input);
		const box = panel?.getBoundingClientRect();
		const row = panel?.querySelector<HTMLElement>('[role="option"][tabindex="0"]');
		const rowBox = row?.getBoundingClientRect();
		const hit = rowBox ? document.elementFromPoint(rowBox.x + rowBox.width / 2, rowBox.y + rowBox.height / 2) : null;
		const ok = box !== undefined && box.bottom > holder.getBoundingClientRect().bottom && !!row && !!hit && row.contains(hit);
		const detail = box ? `низ панели ${box.bottom.toFixed(0)}, под указателем ${hit?.tagName ?? 'ничего'}` : 'нет панели';
		check(`TimePicker: предок с ${name}, панель не обрезана и принимает указатель`, ok, detail);
		await dismiss();
	}

	// маска ввода
	{
		const input = inputOf(page, 'controlled');
		typeText(input, '1430');
		check('TimePicker: цифры превращаются во время с разделителем', input.value === '14:30', `текст ${input.value}`);
		typeText(input, '9');
		check('TimePicker: одиночная цифра часа закрывается нулём и разделителем', input.value === '09:', `текст ${input.value}`);
		typeText(input, '14:30x');
		check('TimePicker: буквы не попадают в поле', input.value === '14:30', `текст ${input.value}`);
		keyDown(input, 'Enter');
		await frames();
		const english = inputOf(page, 'english');
		typeText(english, '230pmq');
		check('TimePicker en-US: период через пробел, лишние буквы отброшены', english.value === '2:30 pm', `текст ${english.value}`);
		keyDown(english, 'Enter');
		await frames();
	}

	return results;
}
