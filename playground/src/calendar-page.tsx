import { createEffect, createSignal, For, type JSX } from 'solid-js';

import { runCalendarChecks } from './calendar-checks';
import { DemoCalendars } from './demo-calendars';
import { pick } from './pick';
import type { CheckResult } from './theme-checks';

type Theme = 'system' | 'light' | 'dark';

const THEMES: readonly Theme[] = ['system', 'light', 'dark'];

/** Страница «Календарь» (этап 5, часть 1): размеры, режимы, ограничения, клавиатура и автопроверки. */
export function CalendarPage(): JSX.Element {
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
				setResults(await runCalendarChecks(root));
			})();
		}
	};

	return (
		<main ref={page} class='page'>
			<header class='toolbar'>
				<h1>Календарь</h1>
				<label>
					Тема
					<select onChange={(event) => setTheme(pick(THEMES, event.currentTarget.value, 'system'))}>
						<For each={THEMES}>{(value) => <option value={value}>{value}</option>}</For>
					</select>
				</label>
			</header>

			<section>
				<h2>1. Календари</h2>
				<p>
					«Сегодня» зафиксировано на 2 ноября 2026. Первый ряд: размеры 28 / 32 / 40. Второй ряд: февраль 2027 (4 недели),
					сентябрь 2026 (5), март 2026 (6): размер один и тот же, ячейки соседних месяцев приглушены. Третий ряд: controlled
					(значение и фокус снаружи), ограничения (с 5 ноября по 20 января, выходные отключены) и календарь вплотную к
					контейнеру с обрезкой (кольцо фокуса должно быть видно целиком).
				</p>
				<p>
					Ручная приёмка настоящими клавишами: Tab входит одним стопом на выбранную дату; стрелки, Home, End, PageUp, PageDown,
					Shift+PageUp и Shift+PageDown; Enter и пробел выбирают; кнопка с названием периода уводит в месяцы, затем в годы
					(ячейки растянуты на всю рамку, размер календаря не меняется); Backspace возвращает на уровень ниже; клик по серому
					дню выбирает его и переключает месяц; «Сегодня» возвращает к текущей дате, не выбирая её.
				</p>
				<DemoCalendars/>
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
		</main>
	);
}
