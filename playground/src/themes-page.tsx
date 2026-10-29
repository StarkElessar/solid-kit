import { Probe } from '@stark/solid-kit/probe';
import { createEffect, createSignal, For, type JSX, onMount } from 'solid-js';

import { DerivedSwatches } from './derived-swatches';
import { PALETTE_NAMES, type PaletteName, PALETTES } from './palettes';
import { type CheckResult, runThemeChecks } from './theme-checks';

type Theme = 'system' | 'light' | 'dark';
type Size = 'default' | 'sm' | 'md' | 'lg';

const THEMES: readonly Theme[] = ['system', 'light', 'dark'];
const SIZES: readonly Size[] = ['default', 'sm', 'md', 'lg'];

function pick<T extends string>(options: readonly T[], value: string, fallback: T): T {
	return options.find((option) => option === value) ?? fallback;
}

export function ThemesPage(): JSX.Element {
	const [theme, setTheme] = createSignal<Theme>('system');
	const [size, setSize] = createSignal<Size>('default');
	const [palette, setPalette] = createSignal<PaletteName>('blue');
	const [primary, setPrimary] = createSignal('');
	const [results, setResults] = createSignal<readonly CheckResult[]>([]);
	let page: HTMLElement | undefined;
	let dialog: HTMLDialogElement | undefined;

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

	const pageStyle = (): JSX.CSSProperties => ({
		...PALETTES[palette()],
		...(primary() ? { '--s-kit-color-primary': primary() } : {})
	});

	const runChecks = (): void => {
		if (page) {
			setResults(runThemeChecks(page));
		}
	};

	// панели позиционируются асинхронно: проверки запускаются после двух кадров
	onMount(() => {
		requestAnimationFrame(() => {
			requestAnimationFrame(runChecks);
		});
	});

	return (
		<main ref={page} class='page' data-s-kit-size={size() === 'default' ? undefined : size()} style={pageStyle()}>
			<header class='toolbar'>
				<h1>Темы</h1>
				<label>
					Тема
					<select onChange={(event) => setTheme(pick(THEMES, event.currentTarget.value, 'system'))}>
						<For each={THEMES}>{(value) => <option value={value}>{value}</option>}</For>
					</select>
				</label>
				<label>
					Размер
					<select onChange={(event) => setSize(pick(SIZES, event.currentTarget.value, 'default'))}>
						<For each={SIZES}>{(value) => <option value={value}>{value}</option>}</For>
					</select>
				</label>
				<label>
					Палитра
					<select onChange={(event) => setPalette(pick(PALETTE_NAMES, event.currentTarget.value, 'blue'))}>
						<For each={PALETTE_NAMES}>{(value) => <option value={value}>{value}</option>}</For>
					</select>
				</label>
				<label>
					Primary
					<input type='color' value='#0071e3' onInput={(event) => setPrimary(event.currentTarget.value)}/>
				</label>
				<button type='button' onClick={() => setPrimary('')}>
					Сбросить primary
				</button>
			</header>

			<section>
				<h2>1. Системная тема и принудительная тема на обёртке</h2>
				<p>
					prefers-color-scheme: dark = {String(window.matchMedia('(prefers-color-scheme: dark)').matches)}. Обёртки ниже
					принудительно светлая и тёмная; тема переключается только внутри них.
				</p>
				<div class='boxes'>
					<div class='box' data-scenario='light' data-s-kit-theme='light'>
						<Probe defaultOpen>Светлая обёртка</Probe>
					</div>
					<div class='box' data-scenario='dark' data-s-kit-theme='dark'>
						<Probe defaultOpen>Тёмная обёртка</Probe>
					</div>
				</div>
			</section>

			<section>
				<h2>2. Производные токены: покой, hover, active, subtle</h2>
				<DerivedSwatches/>
			</section>

			<section>
				<h2>3. Вложенные области: панель в top layer получает тему, размер, primary и токен формы</h2>
				<div
					class='box'
					data-scenario='nested'
					data-s-kit-theme='dark'
					data-s-kit-size='sm'
					style={{ '--s-kit-color-primary': 'light-dark(#7c3aed, #a78bfa)' }}
				>
					<form
						style={{ '--s-kit-probe-panel-bg': '#ffe8cc' }}
						onSubmit={(event) => {
							event.preventDefault();
						}}
					>
						<Probe defaultOpen>
							<i class='chip' data-chip/>
							Содержимое панели
						</Probe>
					</form>
				</div>
			</section>

			<section>
				<h2>4. Панель поверх модального Dialog</h2>
				<button type='button' onClick={() => dialog?.showModal()}>
					Открыть dialog
				</button>
				<dialog ref={dialog} data-s-kit-theme='dark' data-s-kit-size='sm' class='dialog'>
					<Probe>Панель над dialog</Probe>
					<button type='button' onClick={() => dialog?.close()}>
						Закрыть
					</button>
				</dialog>
			</section>

			<section>
				<h2>5. Проверки</h2>
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
