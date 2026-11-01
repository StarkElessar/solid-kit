import { closeWithEscape, frames, required } from './check-helpers';
import type { CheckResult } from './theme-checks';

function menuButton(frame: HTMLElement, columnId: string): HTMLElement {
	return required(frame, `[data-grid-column-menu="${columnId}"]`);
}

function headTitles(frame: HTMLElement): string[] {
	return [...frame.querySelectorAll('thead th')].map((cell) => cell.textContent.trim());
}

function menuItem(role: 'menuitem' | 'menuitemcheckbox', text: string): HTMLElement | undefined {
	return [...document.querySelectorAll<HTMLElement>(`[role="${role}"]`)].find((item) => item.textContent.trim() === text);
}

function menuIsOpen(): boolean {
	return document.querySelector('[role="menu"]') !== null;
}

/** Esc закрывает по одному слою: сначала подменю «Список колонок», затем само меню. */
async function closeMenus(): Promise<void> {
	for (let step = 0; step < 2 && menuIsOpen(); step++) {
		closeWithEscape();
		await frames();
	}
}

/**
 * Автопроверки меню колонки: кнопки в шапке, открытие, скрытие и показ, закрепление, журнал onColumnMenuClose.
 * Кольца фокуса, настоящие Tab и закрытие прокруткой проверяются вручную в Chrome. Состояние колонок в конце возвращается.
 */
export async function runColumnMenuChecks(page: HTMLElement): Promise<CheckResult[]> {
	const results: CheckResult[] = [];
	const check = (name: string, ok: boolean, detail: string): void => {
		results.push({ name, ok, detail });
	};
	const frame = required(page, '[data-grid-demo]');
	const log = required(page, '[data-grid-columns-log]');

	const buttons = frame.querySelectorAll('thead th [data-grid-column-menu]').length;
	// первая ячейка шапки это колонка чекбоксов
	const heads = frame.querySelectorAll('thead th').length - 1;
	check('Меню колонки: кнопка в каждой ячейке шапки', buttons === heads && buttons > 0, `${buttons} из ${heads}`);

	menuButton(frame, 'note').click();
	await frames();
	const hasLock = menuItem('menuitem', 'Закрепить') !== undefined;
	menuItem('menuitem', 'Список колонок')?.click();
	await frames();
	const toggles = document.querySelectorAll('[role="menuitemcheckbox"]').length;
	check(
		'Меню колонки: пункт закрепления и подменю «Список колонок» с переключателем на каждую колонку',
		menuIsOpen() && hasLock && toggles === buttons,
		`${document.querySelector('[role="menu"]')?.getAttribute('aria-label') ?? 'нет меню'}; переключателей ${toggles}`
	);

	menuItem('menuitemcheckbox', 'Город')?.click();
	await frames();
	check(
		'Меню колонки: снятие галочки скрывает колонку, меню остаётся открытым',
		!headTitles(frame).includes('Город') && menuIsOpen(),
		headTitles(frame).join(', ')
	);

	await closeMenus();
	check(
		'Меню колонки: Esc закрывает меню, журнал получает видимые колонки без city',
		!menuIsOpen() && !log.textContent.includes('city') && log.textContent.includes('note'),
		log.textContent
	);

	menuButton(frame, 'phone').click();
	await frames();
	menuItem('menuitem', 'Закрепить')?.click();
	await frames();
	const phone = [...frame.querySelectorAll('thead th')].find((cell) => cell.textContent.trim() === 'Телефон');
	check(
		'Меню колонки: «Закрепить» делает ячейку шапки закреплённой и закрывает меню',
		phone?.hasAttribute('data-sticky') === true && !menuIsOpen(),
		String(phone?.hasAttribute('data-sticky'))
	);

	menuButton(frame, 'phone').click();
	await frames();
	const unlock = menuItem('menuitem', 'Открепить');
	check('Меню колонки: у закреплённой колонки пункт «Открепить»', unlock !== undefined, unlock?.textContent.trim() ?? 'нет');
	unlock?.click();
	await frames();

	menuButton(frame, 'note').click();
	await frames();
	menuItem('menuitem', 'Список колонок')?.click();
	await frames();
	menuItem('menuitemcheckbox', 'Город')?.click();
	await frames();
	check('Меню колонки: галочка у скрытой колонки возвращает её', headTitles(frame).includes('Город'), headTitles(frame).join(', '));
	await closeMenus();
	return results;
}
