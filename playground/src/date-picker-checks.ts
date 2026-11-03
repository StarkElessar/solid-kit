import { frames, required } from './check-helpers';
import type { CheckResult } from './theme-checks';

function inputOf(page: ParentNode, id: string): HTMLInputElement {
	const input = required(page, `[data-date-demo="${id}"] input[role="combobox"]`);
	if (!(input instanceof HTMLInputElement)) {
		throw new TypeError(`Date demo ${id} has no input`);
	}
	return input;
}

function panelOf(input: HTMLElement): HTMLElement | null {
	return document.getElementById(input.getAttribute('aria-controls') ?? '');
}

function toggleOf(input: HTMLElement): HTMLElement {
	return required(input.parentElement ?? document.body, 'button[aria-label="Открыть календарь"]');
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
	return required(page, `[data-date-demo="${id}"] [data-date-state]`).textContent;
}

function exists(node: Element | null | undefined): string {
	return node ? 'есть' : 'нет';
}

function activeTag(): string {
	return document.activeElement?.tagName ?? '?';
}

function focusedLabel(panel: HTMLElement | null): string {
	return panel?.querySelector('[data-focus-target]')?.getAttribute('aria-label') ?? '';
}

function todayText(): string {
	const now = new Date();
	const day = String(now.getDate()).padStart(2, '0');
	const month = String(now.getMonth() + 1).padStart(2, '0');
	return `${day}.${month}.${now.getFullYear()}`;
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
 * Приёмка DatePicker (спек этапа 5, часть 2): открытие кликом по полю и по значку, повторные клики, выбор дня и «Сегодня»,
 * ввод и принятие текста, клавиатура, положение панели, предки с обрезкой, ограничения, форма. Esc в диалоге
 * проверяется вручную настоящими клавишами.
 */
export async function runDatePickerChecks(page: HTMLElement): Promise<CheckResult[]> {
	const results: CheckResult[] = [];
	const check = (name: string, ok: boolean, detail: string): void => {
		results.push({ name, ok, detail });
	};

	// открытие кликом по полю и по значку
	{
		const input = inputOf(page, 'size-md');
		const panel = await openByClick(input);
		const opened = panel !== null && input.getAttribute('aria-expanded') === 'true';
		check('DatePicker: клик по полю открывает календарь', opened, `панель ${exists(panel)}`);
		check('DatePicker: после клика курсор остаётся в поле', document.activeElement === input, `активен ${activeTag()}`);
		const field = (input.parentElement ?? input).getBoundingClientRect();
		const box = panel?.getBoundingClientRect();
		const aligned = box !== undefined && Math.abs(box.left - field.left) <= 1;
		// под полем; над ним только если снизу не хватает места (окно низкое)
		const below = box !== undefined && box.top >= field.bottom - 1;
		const flipped = box !== undefined && box.bottom <= field.top + 1 && innerHeight - field.bottom < box.height;
		const under = aligned && (below || flipped);
		const dy = box ? (box.top - field.bottom).toFixed(1) : '?';
		const dx = box ? (box.left - field.left).toFixed(1) : '?';
		const offsets = `сверху ${dy}px, слева ${dx}px`;
		check('DatePicker: панель стоит у поля и его левого края', under, offsets);
		const overscroll = panel ? getComputedStyle(panel).overscrollBehaviorY : '?';
		check('DatePicker: прокрутка над панелью не передаётся странице', overscroll === 'contain', `overscroll-behavior ${overscroll}`);
		input.click();
		await frames();
		check('DatePicker: повторный клик по полю календарь не закрывает', panelOf(input) !== null, `панель ${exists(panelOf(input))}`);
		toggleOf(input).click();
		await frames();
		check('DatePicker: клик по значку при открытом календаре закрывает его', panelOf(input) === null, exists(panelOf(input)));
		toggleOf(input).click();
		await frames();
		check('DatePicker: клик по значку открывает календарь', panelOf(input) !== null, `панель ${exists(panelOf(input))}`);
		check('DatePicker: после клика по значку фокус в поле', document.activeElement === input, `активен ${activeTag()}`);
		await dismiss();
		check('DatePicker: клик снаружи закрывает календарь', panelOf(input) === null, `панель ${exists(panelOf(input))}`);
	}

	// выбор дня и «Сегодня»
	{
		const input = inputOf(page, 'controlled');
		typeText(input, '28.11.2026');
		keyDown(input, 'Enter');
		await frames();
		check(
			'DatePicker: в поле с clearable дата помещается целиком',
			input.scrollWidth <= input.clientWidth,
			`текст ${input.scrollWidth}px, поле ${input.clientWidth}px`
		);
		const panel = await openByClick(input);
		panel?.querySelector<HTMLElement>('button[aria-label^="вторник, 10 ноября"]')?.click();
		await frames();
		check(
			'DatePicker: выбор дня обновляет текст и закрывает календарь',
			input.value === '10.11.2026' && panelOf(input) === null,
			`текст ${input.value}`
		);
		check('DatePicker: после выбора фокус возвращается в поле', document.activeElement === input, `активен ${activeTag()}`);
		const state = stateOf(page, 'controlled');
		check('DatePicker: колбэк получил ISO-значение', state.includes('2026-11-10'), state);
		input.click();
		await frames();
		const buttons = [...(panelOf(input)?.querySelectorAll('button') ?? [])];
		const today = buttons.find((button) => button.textContent === 'Сегодня');
		today?.click();
		await frames();
		check(
			'DatePicker: «Сегодня» выбирает сегодняшнюю дату и закрывает календарь',
			input.value === todayText() && panelOf(input) === null,
			`текст ${input.value}, ожидалось ${todayText()}`
		);
	}

	// ввод текста
	{
		const input = inputOf(page, 'controlled');
		await openByClick(input);
		typeText(input, '15.12.2026');
		await frames();
		const label = focusedLabel(panelOf(input));
		const before = stateOf(page, 'controlled');
		check(
			'DatePicker: набранная дата показывается в календаре до принятия',
			label.includes('15 декабря 2026') && !before.includes('2026-12-15'),
			`${label}; ${before}`
		);
		keyDown(input, 'Enter');
		await frames();
		const after = stateOf(page, 'controlled');
		check(
			'DatePicker: Enter принимает набранную дату и закрывает календарь',
			after.includes('2026-12-15') && panelOf(input) === null,
			after
		);
		typeText(input, '31.02.2026');
		keyDown(input, 'Enter');
		await frames();
		check('DatePicker: невалидный текст откатывается', input.value === '15.12.2026', `текст ${input.value}`);
		typeText(input, '');
		keyDown(input, 'Enter');
		await frames();
		const cleared = stateOf(page, 'controlled');
		check('DatePicker: пустой текст принимается как null', cleared.includes('null') && input.value === '', cleared);
	}

	// клавиатура: ArrowDown переносит фокус в календарь
	{
		const input = inputOf(page, 'size-lg');
		input.scrollIntoView({ behavior: 'instant', block: 'center' });
		input.focus();
		keyDown(input, 'ArrowDown');
		await frames();
		const active = document.activeElement;
		check(
			'DatePicker: ArrowDown открывает календарь и переносит фокус на дату',
			panelOf(input)?.contains(active) === true && active?.hasAttribute('data-focus-target') === true,
			`активен ${activeTag()}`
		);
		active?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
		await frames();
		check(
			'DatePicker: Esc закрывает календарь и возвращает фокус в поле',
			panelOf(input) === null && document.activeElement === input,
			`активен ${activeTag()}`
		);
	}

	// подпись Field: клик фокусирует поле и не открывает календарь
	{
		const input = inputOf(page, 'field');
		input.scrollIntoView({ behavior: 'instant', block: 'center' });
		required(page, '[data-date-demo="field"] label').click();
		await frames();
		check(
			'DatePicker: клик по подписи Field фокусирует поле и не открывает календарь',
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
		check('DatePicker: readOnly календарь не открывает', panelOf(readonly) === null, `панель ${exists(panelOf(readonly))}`);
		const disabled = inputOf(page, 'disabled');
		toggleOf(disabled).click();
		await frames();
		check('DatePicker: disabled календарь не открывает', panelOf(disabled) === null, `панель ${exists(panelOf(disabled))}`);
		const limits = inputOf(page, 'limits');
		const panel = await openByClick(limits);
		const blocked = [...(panel?.querySelectorAll('button[aria-disabled="true"]') ?? [])];
		const weekend = blocked.some((cell) => /суббота|воскресенье/.test(cell.getAttribute('aria-label') ?? ''));
		check('DatePicker: дни вне диапазона и выходные отключены', blocked.length > 0 && weekend, `отключено ${blocked.length}`);
		typeText(limits, '01.11.2026');
		keyDown(limits, 'Enter');
		await frames();
		check('DatePicker: дата вне диапазона не принимается', limits.value === '', `текст «${limits.value}»`);
		await dismiss();
	}

	// форма
	{
		const input = inputOf(page, 'form');
		const hidden = required(page, '[data-date-demo="form"] input[type="hidden"]');
		const form = hidden.closest('form');
		typeText(input, '18.11.2026');
		keyDown(input, 'Enter');
		await frames();
		const before = hidden instanceof HTMLInputElement ? hidden.value : '';
		typeText(input, '20.11.2026');
		keyDown(input, 'Enter');
		await frames();
		const sent = form ? formText(form, 'when') : '';
		const iso = before === '2026-11-18' && sent === '2026-11-20';
		check('DatePicker: FormData получает ISO-значение', iso, `было ${before}, ушло ${sent}`);
		await dismiss();
	}

	// панель в предках с обрезкой
	for (const name of ['transform', 'filter', 'contain', 'overflow']) {
		const holder = required(page, `[data-date-demo="clip-${name}"]`);
		const input = inputOf(page, `clip-${name}`);
		const panel = await openByClick(input);
		const box = panel?.getBoundingClientRect();
		const day = panel?.querySelector<HTMLElement>('[role="gridcell"] button');
		const dayBox = day?.getBoundingClientRect();
		const hit = dayBox ? document.elementFromPoint(dayBox.x + dayBox.width / 2, dayBox.y + dayBox.height / 2) : null;
		const ok = box !== undefined && box.bottom > holder.getBoundingClientRect().bottom && !!day && !!hit && day.contains(hit);
		const detail = box ? `низ панели ${box.bottom.toFixed(0)}, под указателем ${hit?.tagName ?? 'ничего'}` : 'нет панели';
		check(`DatePicker: предок с ${name}, календарь не обрезан и принимает указатель`, ok, detail);
		await dismiss();
	}

	// маска ввода
	{
		const input = inputOf(page, 'controlled');
		typeText(input, '28112026');
		check('DatePicker: цифры превращаются в дату с разделителями', input.value === '28.11.2026', `текст ${input.value}`);
		typeText(input, '28.11.2026x');
		check('DatePicker: буквы не попадают в поле', input.value === '28.11.2026', `текст ${input.value}`);
		typeText(input, '2811');
		check('DatePicker: разделители ставятся по мере набора', input.value === '28.11.', `текст ${input.value}`);
		typeText(input, '28.11.2026');
		keyDown(input, 'Enter');
		await frames();
	}

	return results;
}
