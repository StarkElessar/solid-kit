import { createEffect, createSignal, For, type JSX } from 'solid-js';

import { ROWS, type RowSpec } from './control-rows';
import { DEMO_CONTROLS } from './demo-controls';
import { pick } from './pick';
import { runRowChecks } from './row-checks';
import type { CheckResult } from './theme-checks';

type Theme = 'system' | 'light' | 'dark';

const THEMES: readonly Theme[] = ['system', 'light', 'dark'];

// список контролов статичен, поэтому реактивность по индексу не нужна
function renderRow(row: RowSpec): JSX.Element[] {
	return DEMO_CONTROLS.map((control, index) => control.render(row.sizeFor(index)));
}

export function ControlsRowPage(): JSX.Element {
	const [theme, setTheme] = createSignal<Theme>('system');
	const [results, setResults] = createSignal<readonly CheckResult[]>([]);
	let page: HTMLElement | undefined;

	const runChecks = (): void => {
		if (page) {
			setResults(runRowChecks(page));
		}
	};

	// раскладка читает токены текущей темы: проверки перезапускаются после смены темы и первого рендера
	createEffect(() => {
		const root = document.documentElement;
		if (theme() === 'system') {
			root.removeAttribute('data-s-kit-theme');
		}
		else {
			root.setAttribute('data-s-kit-theme', theme());
		}
		requestAnimationFrame(runChecks);
	});

	return (
		<main ref={page} class='page'>
			<header class='toolbar'>
				<h1>Контролы в ряд</h1>
				<label>
					Тема
					<select onChange={(event) => setTheme(pick(THEMES, event.currentTarget.value, 'system'))}>
						<For each={THEMES}>{(value) => <option value={value}>{value}</option>}</For>
					</select>
				</label>
				<button type='button' onClick={runChecks}>
					Запустить проверки
				</button>
			</header>

			<For each={ROWS}>
				{(row) => (
					<section>
						<h2>{row.title}</h2>
						<div class='control-row' data-row={row.id} data-s-kit-size={row.wrapperSize}>
							{renderRow(row)}
						</div>
					</section>
				)}
			</For>

			<section>
				<h2>Проверки</h2>
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
