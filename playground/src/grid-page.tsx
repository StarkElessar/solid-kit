import { createEffect, createSignal, For, type JSX } from 'solid-js';

import { runColumnMenuChecks } from './column-menu-checks';
import { DemoGrid } from './demo-grid';
import { runGridChecks } from './grid-checks';
import { runPagerChecks } from './pager-checks';
import { pick } from './pick';
import type { CheckResult } from './theme-checks';

type Theme = 'system' | 'light' | 'dark';

const THEMES: readonly Theme[] = ['system', 'light', 'dark'];

/** Страница «Грид» (спек этапа 4а): наращивается частями 2–5. Сейчас: таблица, виртуализация, закреплённые колонки, ресайз. */
export function GridPage(): JSX.Element {
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
				setResults([...(await runGridChecks(root)), ...(await runPagerChecks(root)), ...(await runColumnMenuChecks(root))]);
			})();
		}
	};

	return (
		<main ref={page} class='page'>
			<header class='toolbar'>
				<h1>Грид</h1>
				<label>
					Тема
					<select onChange={(event) => setTheme(pick(THEMES, event.currentTarget.value, 'system'))}>
						<For each={THEMES}>{(value) => <option value={value}>{value}</option>}</For>
					</select>
				</label>
			</header>

			<section>
				<h2>1. Таблица</h2>
				<p>
					Ручная приёмка: 100 000 строк × 12 колонок, равномерная прокрутка колёсиком по вертикали и горизонтали; две
					закреплённые колонки («Номер», «Заказчик») не наезжают на соседние и не оставляют зазора; шапка закреплена сверху;
					ресайз мышью (шапка и тело двигаются вместе, строки не мигают), Esc во время перетаскивания возвращает ширину,
					двойной клик по ручке сбрасывает её; колонка «Заметка с переносом» растёт по высоте, остальные обрезаются
					многоточием с подсказкой; последняя колонка добирает остаток, когда таблица уже контейнера.
					Меню колонки: кнопка из трёх точек в шапке, закрепление и видимость колонок; меню закрывается Esc и прокруткой грида.
					Режим «Постраничная загрузка»: поддельный сервер с задержкой, пейджер внизу рамки; под гридом отдельный Pager.
				</p>
				<DemoGrid/>
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
