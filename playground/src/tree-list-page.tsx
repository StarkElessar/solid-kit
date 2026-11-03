import { createEffect, createSignal, For, type JSX } from 'solid-js';

import { DemoTreeList } from './demo-tree-list';
import { DemoTreeListLazy } from './demo-tree-list-lazy';
import { pick } from './pick';
import type { CheckResult } from './theme-checks';
import { runTreeListChecks } from './tree-list-checks';

type Theme = 'system' | 'light' | 'dark';

const THEMES: readonly Theme[] = ['system', 'light', 'dark'];

/** Страница «Дерево» (спек TreeList): плоский список с parentId и ленивая подгрузка поверх общего движка грида. */
export function TreeListPage(): JSX.Element {
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
				setResults(await runTreeListChecks(root));
			})();
		}
	};

	return (
		<main ref={page} class='page'>
			<header class='toolbar'>
				<h1>Дерево</h1>
				<label>
					Тема
					<select onChange={(event) => setTheme(pick(THEMES, event.currentTarget.value, 'system'))}>
						<For each={THEMES}>{(value) => <option value={value}>{value}</option>}</For>
					</select>
				</label>
			</header>

			<section>
				<h2>1. Плоский список с parentId</h2>
				<p>
					Ручная приёмка: 20 000 узлов, плавная прокрутка; шеврон раскрывает узел, отступ 16 px на уровень; четыре кнопки
					справа в полосе сверху (свернуть уровень, свернуть все, развернуть уровень, развернуть все); первая колонка
					закреплена, тени под ней нет; меню колонки, ресайз, выбор строк, пейджер с «Обновить» внизу.
				</p>
				<DemoTreeList/>
			</section>

			<section>
				<h2>2. Ленивая подгрузка</h2>
				<p>Дети узла приходят через 400 мс: под узлом «Загрузка…», запрос один на раскрытие.</p>
				<DemoTreeListLazy/>
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
		</main>
	);
}
