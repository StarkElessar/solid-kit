import { createEffect, createSignal, For, type JSX } from 'solid-js';

import { DemoTimePickers } from './demo-time-pickers';
import { pick } from './pick';
import type { CheckResult } from './theme-checks';
import { runTimePickerChecks } from './time-picker-checks';

type Theme = 'system' | 'light' | 'dark';

const THEMES: readonly Theme[] = ['system', 'light', 'dark'];

/** Страница «Выбор времени» (этап 5, часть 3): TimePicker, правила открытия, ввод, ограничения, 12 часов, диалог и автопроверки. */
export function TimePickerPage(): JSX.Element {
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
				setResults(await runTimePickerChecks(root));
			})();
		}
	};

	return (
		<main ref={page} class='page'>
			<header class='toolbar'>
				<h1>Выбор времени</h1>
				<label>
					Тема
					<select onChange={(event) => setTheme(pick(THEMES, event.currentTarget.value, 'system'))}>
						<For each={THEMES}>{(value) => <option value={value}>{value}</option>}</For>
					</select>
				</label>
			</header>

			<section>
				<h2>1. TimePicker</h2>
				<p>
					Ручная приёмка настоящими клавишами и мышью: клик по полю открывает панель с колонками часов и минут, второй клик её не
					закрывает; клик по значку открывает, повторный закрывает; курсор остаётся в поле, печать работает сразу и колонки
					подсвечивают набранное время; Enter и уход из поля принимают, невалидный текст откатывается; ArrowDown открывает панель
					и
					переносит фокус на час; стрелки двигают фокус по колонке (отключённые строки пропускаются), Left и Right переходят между
					колонками, значение меняют только Enter, Space и клик; выбор минут (в 12-часовом виде периода) закрывает панель и
					возвращает фокус в поле; Esc закрывает; «Сейчас» выбирает текущее время; панель не обрезается предками с transform,
					filter, contain и overflow; в диалоге Esc закрывает сначала панель, потом диалог (счётчик закрытий равен 1); в Field
					подпись фокусирует поле и не открывает панель; при открытии выбранная строка стоит по центру колонки.
				</p>
				<DemoTimePickers/>
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
