import { createEffect, createSignal, For, type JSX } from 'solid-js';

import { runContextMenuChecks } from './context-menu-checks';
import { DemoContextMenus } from './demo-context-menus';
import { DemoDialogs } from './demo-dialogs';
import { runDialogChecks } from './dialog-checks';
import { pick } from './pick';
import type { CheckResult } from './theme-checks';

type Theme = 'system' | 'light' | 'dark';

const THEMES: readonly Theme[] = ['system', 'light', 'dark'];

/** Страница «Панели» (раздел 8 зонтичного спека, критерий 6): наращивается частями этапа 2. Сейчас: Dialog и ContextMenu. */
export function PanelsPage(): JSX.Element {
	const [theme, setTheme] = createSignal<Theme>('system');
	const [results, setResults] = createSignal<readonly CheckResult[]>([]);
	let page: HTMLElement | undefined;

	// системная тема: атрибута нет; иначе color-scheme принудительно на <html>
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
				const dialog = await runDialogChecks(root);
				const menu = await runContextMenuChecks(root);
				setResults([...dialog, ...menu]);
			})();
		}
	};

	return (
		<main ref={page} class='page'>
			<header class='toolbar'>
				<h1>Панели</h1>
				<label>
					Тема
					<select onChange={(event) => setTheme(pick(THEMES, event.currentTarget.value, 'system'))}>
						<For each={THEMES}>{(value) => <option value={value}>{value}</option>}</For>
					</select>
				</label>
			</header>

			<section>
				<h2>1. Dialog</h2>
				<p>
					Ручная приёмка настоящими нажатиями: Esc закрывает по очереди панель и диалог (второй диалог), клик по подложке
					закрывает первый диалог и не закрывает третий, колесо над подложкой не прокручивает страницу.
				</p>
				<DemoDialogs/>
			</section>

			<section>
				<h2>2. ContextMenu</h2>
				<p>
					Ручная приёмка настоящими клавишами: правый клик открывает меню в точке; Shift+F10 на кнопке внутри области
					открывает у кнопки, фокус на первом пункте; стрелки, Home, End, Enter, Space; ArrowRight и ArrowLeft в подменю;
					Esc закрывает по уровню; в диалоге Esc три раза закрывает подменю, меню и диалог.
				</p>
				<DemoContextMenus/>
			</section>

			<section>
				<h2>3. Проверки</h2>
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
