import { createEffect, createSignal, For, type JSX } from 'solid-js';

import { runDatePickerChecks } from './date-picker-checks';
import { DemoDatePickers } from './demo-date-pickers';
import { pick } from './pick';
import type { CheckResult } from './theme-checks';

type Theme = 'system' | 'light' | 'dark';

const THEMES: readonly Theme[] = ['system', 'light', 'dark'];

/** Страница «Выбор даты» (этап 5, часть 2): DatePicker, правила открытия, ввод, ограничения, диалог и автопроверки. */
export function DatePickerPage(): JSX.Element {
	const [theme, setTheme] = createSignal<Theme>('system');
	const [results, setResults] = createSignal<readonly CheckResult[]>([]);
	let page: HTMLElement | undefined;

	createEffect(() => {
		const root = document.documentElement;
		if (theme() === 'system') {
			root.removeAttribute('data-s-kit-theme');
		}
		else {
			root.setAttribute('data-s-kit-theme', theme());
		}
	});

	const runChecks = (): void => {
		if (page) {
			const root = page;
			void (async () => {
				setResults(await runDatePickerChecks(root));
			})();
		}
	};

	return (
		<main ref={page} class='page'>
			<header class='toolbar'>
				<h1>Выбор даты</h1>
				<label>
					Тема
					<select onChange={(event) => setTheme(pick(THEMES, event.currentTarget.value, 'system'))}>
						<For each={THEMES}>{(value) => <option value={value}>{value}</option>}</For>
					</select>
				</label>
			</header>

			<section>
				<h2>1. DatePicker</h2>
				<p>
					Ручная приёмка настоящими клавишами и мышью: клик по полю открывает календарь, второй клик его не закрывает; клик по
					значку открывает, повторный закрывает; курсор остаётся в поле, печать работает сразу и календарь следует за набранной
					датой; Enter и уход из поля принимают, невалидный текст откатывается; ArrowDown (и Alt+ArrowDown) открывает календарь и
					переносит фокус на дату; Esc закрывает и возвращает фокус в поле; Tab закрывает; выбор дня и «Сегодня» выбирают дату,
					закрывают календарь и возвращают фокус в поле; календарь не обрезается предками с transform, filter, contain и overflow;
					в диалоге Esc закрывает сначала календарь, потом диалог (счётчик закрытий диалога равен 1); в Field подпись фокусирует
					поле и не открывает календарь.
				</p>
				<DemoDatePickers/>
			</section>

			<section>
				<h2>2. Проверки</h2>
				<button type='button' onClick={runChecks}>
					Запустить проверки
				</button>
				<ul class='checks'>
					<For each={results()}>
						{(result) => (
							<li data-ok={result.ok}>
								{result.ok ? 'OK' : 'FAIL'}: {result.name} <small>({result.detail})</small>
							</li>
						)}
					</For>
				</ul>
			</section>

			<div class='page-filler' aria-hidden='true'/>
		</main>
	);
}
