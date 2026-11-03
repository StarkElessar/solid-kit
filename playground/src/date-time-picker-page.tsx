import { createEffect, createSignal, For, type JSX } from 'solid-js';

import { runDateTimePickerChecks } from './date-time-picker-checks';
import { DemoDateTimePickers } from './demo-date-time-pickers';
import { pick } from './pick';
import type { CheckResult } from './theme-checks';

type Theme = 'system' | 'light' | 'dark';

const THEMES: readonly Theme[] = ['system', 'light', 'dark'];

/** Страница «Выбор даты и времени» (этап 5, часть 4): DateTimePicker, открытие, ввод, ограничения, 12 часов, диалог и автопроверки. */
export function DateTimePickerPage(): JSX.Element {
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
				setResults(await runDateTimePickerChecks(root));
			})();
		}
	};

	return (
		<main ref={page} class='page'>
			<header class='toolbar'>
				<h1>Выбор даты и времени</h1>
				<label>
					Тема
					<select onChange={(event) => setTheme(pick(THEMES, event.currentTarget.value, 'system'))}>
						<For each={THEMES}>{(value) => <option value={value}>{value}</option>}</For>
					</select>
				</label>
			</header>

			<section>
				<h2>1. DateTimePicker</h2>
				<p>
					Ручная приёмка настоящими клавишами и мышью: клик по полю открывает панель с календарём и колонками времени, второй клик
					её не закрывает; клик по значку открывает, повторный закрывает; курсор остаётся в поле, печать работает сразу, панель
					показывает набранные дату и время; Enter и уход из поля принимают, невалидный текст и время без даты откатываются,
					дата без времени принимается; ArrowDown открывает панель и переносит фокус на день; Tab и Shift+Tab ходят по областям
					панели (шапка календаря, дни, часы, минуты, «Сейчас») и закрывают её только на выходе; выбор дня и часа применяется
					сразу и панель остаётся открытой, выбор минут (периода) и «Сейчас» закрывают её; панель не обрезается предками с
					transform, filter, contain и overflow; в диалоге Esc закрывает сначала панель, потом диалог (счётчик закрытий равен 1);
					в Field подпись фокусирует поле и не открывает панель; на узком окне колонки времени переносятся под календарь.
				</p>
				<DemoDateTimePickers/>
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
