import { blend, contrastRatio, type Rgb } from '../../src/utils/color-math';

import { closeWithEscape, frames, required } from './check-helpers';
import { type CheckResult, resolveColor, type Rgba } from './theme-checks';

function rgb([red, green, blue]: Rgba): Rgb {
	return [red, green, blue];
}

function listbox(): HTMLElement | null {
	return document.querySelector<HTMLElement>('[role="listbox"]');
}

function keyDown(trigger: HTMLElement, key: string): void {
	trigger.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
}

async function open(trigger: HTMLElement): Promise<number> {
	// настоящий клик фокусирует кнопку, программный `click()` нет
	trigger.focus();
	const started = performance.now();
	trigger.click();
	// ждём, пока список появится и отрисуется хотя бы одна опция
	for (let attempt = 0; attempt < 30; attempt++) {
		await frames(1);
		if (document.querySelector('[role="option"]')) {
			return performance.now() - started;
		}
	}
	return performance.now() - started;
}

async function close(): Promise<void> {
	closeWithEscape();
	await frames();
}

/**
 * Автоматические проверки Select: роли и атрибуты, согласованность `aria-activedescendant`, ширина панели, виртуализация
 * на 100 000 опций, `virtualized={false}`, липкий заголовок, контраст. Настоящие клавиши, кольцо фокуса, Esc в диалоге
 * и поведение у краёв окна проверяются вручную.
 */
export async function runSelectChecks(page: HTMLElement): Promise<CheckResult[]> {
	const results: CheckResult[] = [];
	const check = (name: string, ok: boolean, detail: string): void => {
		results.push({ name, ok, detail });
	};

	const short = required(page, '[data-select="short"]');
	await open(short);
	try {
		const panelList = required(document, '[role="listbox"]');
		const options = [...panelList.querySelectorAll<HTMLElement>('[role="option"]')];
		check(
			'Select: роли триггера и списка',
			short.getAttribute('role') === 'combobox'
				&& short.getAttribute('aria-haspopup') === 'listbox'
				&& short.getAttribute('aria-expanded') === 'true'
				&& short.getAttribute('aria-controls') === panelList.id
				&& options.length === 6,
			`опций ${options.length}`
		);
		const active = panelList.querySelector<HTMLElement>('[data-active]');
		check(
			'Select: aria-activedescendant указывает на подсвеченную опцию',
			active !== null && short.getAttribute('aria-activedescendant') === active.id,
			`activedescendant = ${short.getAttribute('aria-activedescendant') ?? 'нет'}`
		);
		const panel = panelList.closest<HTMLElement>('[data-s-kit]');
		const triggerBox = short.getBoundingClientRect();
		const panelBox = panel?.getBoundingClientRect();
		check(
			'Select: панель в top layer и той же ширины, что кнопка',
			panel !== null && panel.matches(':popover-open') && panelBox !== undefined
				&& Math.abs(panelBox.width - triggerBox.width) <= 1,
			`панель ${panelBox?.width.toFixed(1) ?? '—'} px, кнопка ${triggerBox.width.toFixed(1)} px`
		);
		const rowHeight = options[0]?.getBoundingClientRect().height ?? 0;
		const controlHeight = triggerBox.height;
		check(
			'Select: высота строки не меньше высоты контрола',
			rowHeight >= controlHeight - 0.5,
			`строка ${rowHeight} px, контрол ${controlHeight} px`
		);
		check(
			'Select: фокус остался на кнопке',
			document.activeElement === short,
			`активный элемент: ${document.activeElement?.tagName ?? 'нет'}`
		);

		if (panel) {
			const fill = resolveColor(getComputedStyle(panel).backgroundColor);
			const text = rgb(resolveColor(getComputedStyle(options[0] as HTMLElement).color));
			const worst = Math.min(
				...([[0, 0, 0], [255, 255, 255]] as const).map((backdrop) => contrastRatio(text, blend(rgb(fill), fill[3] / 255, backdrop)))
			);
			check('Select: контраст подписи опции на любом фоне под панелью (4.5:1)', worst >= 4.5, `минимум ${worst.toFixed(2)}:1`);
		}
	}
	finally {
		await close();
	}
	const closed: boolean = listbox() === null;
	check('Select: Esc закрывает список', closed, 'список удалён');

	const huge = required(page, '[data-select="huge"]');
	const openTime = await open(huge);
	try {
		const optionCount = document.querySelectorAll('[role="option"]').length;
		check('Select, 100 000 опций: в DOM только окно рендера', optionCount > 0 && optionCount <= 40, `опций в DOM ${optionCount}`);
		check(
			'Select, 100 000 опций: открытие быстрее 100 мс (цель критерия 2)',
			openTime < 100,
			`${openTime.toFixed(0)} мс до появления опции`
		);
		keyDown(huge, 'End');
		await frames(4);
		const last = listbox()?.querySelector<HTMLElement>('[data-active]');
		check(
			'Select, 100 000 опций: End подсвечивает последнюю опцию, она смонтирована',
			last?.textContent === 'Сотрудник 99999' && huge.getAttribute('aria-activedescendant') === last.id,
			`подсвечено: ${last?.textContent ?? 'ничего'}`
		);
		keyDown(huge, 'Home');
		await frames(4);
		check(
			'Select, 100 000 опций: Home возвращает к первой',
			listbox()?.querySelector('[data-active]')?.textContent === 'Сотрудник 0',
			`подсвечено: ${listbox()?.querySelector('[data-active]')?.textContent ?? 'ничего'}`
		);
	}
	finally {
		await close();
	}

	const full = required(page, '[data-select="full"]');
	await open(full);
	const fullCount = document.querySelectorAll('[role="option"]').length;
	check('Select: virtualized={false} рендерит все 200 опций', fullCount === 200, `опций в DOM ${fullCount}`);
	await close();

	const grouped = required(page, '[data-select="grouped"]');
	await open(grouped);
	try {
		const scroller = required(document, '[role="listbox"]');
		check(
			'Select: у списка с группами есть заголовки групп',
			scroller.querySelectorAll('[role="presentation"][data-index]').length > 0,
			`заголовков в окне ${scroller.querySelectorAll('[role="presentation"][data-index]').length}`
		);
		scroller.scrollTop = 200;
		scroller.dispatchEvent(new Event('scroll'));
		await frames(3);
		const sticky = scroller.querySelector('[data-list-box-sticky]');
		check('Select: липкий заголовок группы появляется при прокрутке', sticky !== null, `заголовок: ${sticky?.textContent ?? 'нет'}`);
	}
	finally {
		await close();
	}

	return results;
}
