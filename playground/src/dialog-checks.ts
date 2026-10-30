import { contrastRatio, type Rgb } from '../../src/utils/color-math';

import { frames, required } from './check-helpers';
import { type CheckResult, resolveColor, type Rgba } from './theme-checks';

function rgb([red, green, blue]: Rgba): Rgb {
	return [red, green, blue];
}

/** Высота резервного отступа в пикселях: `--s-kit-focus-space` это calc(), поэтому читается через вычисленный padding пробного элемента. */
function focusSpace(host: HTMLElement): number {
	const probe = document.createElement('span');
	probe.style.paddingInlineStart = 'var(--s-kit-focus-space)';
	host.append(probe);
	const value = Number.parseFloat(getComputedStyle(probe).paddingInlineStart);
	probe.remove();
	return value;
}

/**
 * Открывает диалог «basic» кликом по инициатору и проверяет измеримое: модальность, `aria-labelledby`/`aria-describedby`,
 * подложку, блокировку прокрутки страницы, отступ тела под кольцо фокуса, контраст текста, возврат фокуса.
 * Настоящий Esc, клик по подложке и поведение Popover внутри диалога проверяются вручную (синтетические события не годятся).
 */
export async function runDialogChecks(page: HTMLElement): Promise<CheckResult[]> {
	const results: CheckResult[] = [];
	const check = (name: string, ok: boolean, detail: string): void => {
		results.push({ name, ok, detail });
	};
	const trigger = required(page, '[data-dialog-trigger="basic"]');

	trigger.focus();
	trigger.click();
	await frames();
	const dialog = required(page, '[data-dialog-demo="basic"]');
	if (!(dialog instanceof HTMLDialogElement)) {
		throw new Error('Playground element is not a dialog');
	}
	try {
		check('Dialog: диалог открыт как модальный', dialog.open && dialog.matches(':modal'), `open = ${String(dialog.open)}`);

		const title = document.getElementById(dialog.getAttribute('aria-labelledby') ?? '');
		check(
			'Dialog: aria-labelledby указывает на заголовок',
			title?.textContent === 'Удалить запись?',
			`заголовок = ${title?.textContent ?? 'нет'}`
		);
		const description = document.getElementById(dialog.getAttribute('aria-describedby') ?? '');
		check(
			'Dialog: aria-describedby указывает на описание',
			description?.textContent === 'Действие нельзя отменить.',
			`описание = ${description?.textContent ?? 'нет'}`
		);

		const backdrop = resolveColor(getComputedStyle(dialog, '::backdrop').backgroundColor);
		check(
			'Dialog: подложка видна (::backdrop наследует токены диалога)',
			backdrop[3] > 0,
			`alpha подложки = ${(backdrop[3] / 255).toFixed(2)}`
		);

		check(
			'Dialog: прокрутка страницы заблокирована',
			getComputedStyle(document.documentElement).overflow === 'hidden',
			`overflow html = ${getComputedStyle(document.documentElement).overflow}`
		);

		const body = required(dialog, '[data-dialog-body]');
		const reserved = focusSpace(body);
		const padding = Number.parseFloat(getComputedStyle(body).paddingInlineStart);
		check(
			'Dialog.Body: отступ не меньше пространства кольца фокуса',
			padding >= reserved && reserved > 0,
			`отступ ${padding} px, кольцо ${reserved} px`
		);

		// критерий 7 для тела диалога: внешнее кольцо первого и последнего контрола целиком внутри области обрезки тела
		const bodyBox = body.getBoundingClientRect();
		const controls = Array.from(body.children);
		const first = controls[0]?.getBoundingClientRect();
		const last = controls.at(-1)?.getBoundingClientRect();
		check(
			'Dialog.Body: кольцо первого и последнего контрола не обрезано телом',
			first !== undefined && last !== undefined
				&& first.left - reserved >= bodyBox.left && first.top - reserved >= bodyBox.top
				&& last.right + reserved <= bodyBox.right && last.bottom + reserved <= bodyBox.bottom,
			`кольцо ${reserved} px; слева ${((first?.left ?? 0) - bodyBox.left).toFixed(1)}, `
				+ `сверху ${((first?.top ?? 0) - bodyBox.top).toFixed(1)}, снизу ${(bodyBox.bottom - (last?.bottom ?? 0)).toFixed(1)}`
		);

		const surface = resolveColor(getComputedStyle(dialog).backgroundColor);
		for (const [name, element] of [['заголовка', title], ['описания', description]] as const) {
			if (!element) {
				continue;
			}
			const ratio = contrastRatio(rgb(resolveColor(getComputedStyle(element).color)), rgb(surface));
			check(`Dialog: контраст текста ${name} (4.5:1)`, ratio >= 4.5, `контраст ${ratio.toFixed(2)}:1`);
		}
	}
	finally {
		required(dialog, '[data-dialog-close]').click();
		await frames();
	}

	check('Dialog: после закрытия диалога нет в DOM', page.querySelector('[data-dialog-demo="basic"]') === null, 'диалог удалён');
	check(
		'Dialog: после закрытия прокрутка страницы возвращена',
		getComputedStyle(document.documentElement).overflow !== 'hidden',
		`overflow html = ${getComputedStyle(document.documentElement).overflow}`
	);
	check('Dialog: фокус вернулся на инициатор', document.activeElement === trigger, `активен ${document.activeElement?.tagName ?? 'нет'}`);

	return results;
}
