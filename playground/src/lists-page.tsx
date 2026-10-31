import { createEffect, createSignal, For, type JSX } from 'solid-js';

import { DemoSelects } from './demo-selects';
import { pick } from './pick';
import { runSelectChecks } from './select-checks';
import type { CheckResult } from './theme-checks';

type Theme = 'system' | 'light' | 'dark';

const THEMES: readonly Theme[] = ['system', 'light', 'dark'];

/** Страница «Списки» (раздел 8 зонтичного спека): наращивается частями этапа 3. Сейчас: Select. */
export function ListsPage(): JSX.Element {
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
				setResults(await runSelectChecks(root));
			})();
		}
	};

	return (
		<main ref={page} class='page'>
			<header class='toolbar'>
				<h1>Списки</h1>
				<label>
					Тема
					<select onChange={(event) => setTheme(pick(THEMES, event.currentTarget.value, 'system'))}>
						<For each={THEMES}>{(value) => <option value={value}>{value}</option>}</For>
					</select>
				</label>
			</header>

			<section>
				<h2>1. Select</h2>
				<p>
					Ручная приёмка настоящими клавишами: открытие кнопкой, ArrowDown, ArrowUp, Enter и Space; стрелки, Home, End, PageUp,
					PageDown; набор букв; Enter и Space выбирают, Esc закрывает, Tab закрывает без выбора; кольцо фокуса на активной опции
					только при клавиатуре, при наведении мыши один фон; липкий заголовок групп; на 100 000 опций прокрутка без рывков;
					в диалоге Esc закрывает сначала список, потом диалог (счётчик закрытий диалога равен 1).
				</p>
				<DemoSelects/>
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
