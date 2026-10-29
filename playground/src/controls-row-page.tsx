import { Button } from '@stark/solid-kit/button';
import { IconButton } from '@stark/solid-kit/icon-button';
import { Input } from '@stark/solid-kit/input';
import { createEffect, createSignal, For, type JSX } from 'solid-js';

import { runButtonChecks } from './button-checks';
import { ROWS, type RowSpec } from './control-rows';
import { DEMO_CONTROLS } from './demo-controls';
import { DemoIcon } from './demo-icon';
import { runInputChecks } from './input-checks';
import { pick } from './pick';
import { runRowChecks } from './row-checks';
import type { CheckResult } from './theme-checks';

type Theme = 'system' | 'light' | 'dark';

const THEMES: readonly Theme[] = ['system', 'light', 'dark'];
// переход фона в основе контролов длится 150 мс
const TRANSITION_SETTLE_MS = 250;
const VARIANTS = ['primary', 'tinted', 'plain', 'danger'] as const;

// список контролов статичен, поэтому реактивность по индексу не нужна
function renderRow(row: RowSpec): JSX.Element[] {
	return DEMO_CONTROLS.map((control, index) => control.render(row.sizeFor(index)));
}

// оба блока фокуса показывают одни и те же контролы; список статичен, поэтому реактивность по индексу не нужна
function renderFocusControls(): JSX.Element[] {
	return [
		...VARIANTS.map((variant) => <Button variant={variant}>{variant}</Button>),
		...VARIANTS.map((variant) => (
			<IconButton variant={variant} aria-label={variant} data-focus-name={`icon-${variant}`}><DemoIcon/></IconButton>
		)),
		<Input aria-label='Поле' placeholder='Текст' data-focus-name='input'/>,
		<Input aria-label='Поле с ошибкой' aria-invalid='true' defaultValue='Ошибка' data-focus-name='input-invalid'/>
	];
}

export function ControlsRowPage(): JSX.Element {
	const [theme, setTheme] = createSignal<Theme>('system');
	const [results, setResults] = createSignal<readonly CheckResult[]>([]);
	let page: HTMLElement | undefined;

	const runChecks = (): void => {
		if (page) {
			setResults([...runRowChecks(page), ...runButtonChecks(page), ...runInputChecks(page)]);
		}
	};

	// раскладка читает токены текущей темы: проверки перезапускаются после смены темы и первого рендера,
	// когда переходы цвета (150 мс) закончились, иначе контраст считается по промежуточным цветам
	createEffect(() => {
		const root = document.documentElement;
		if (theme() === 'system') {
			root.removeAttribute('data-s-kit-theme');
		}
		else {
			root.setAttribute('data-s-kit-theme', theme());
		}
		setTimeout(runChecks, TRANSITION_SETTLE_MS);
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
				<h2>Кольцо фокуса: снаружи и внутри контейнера с data-s-kit-focus-inset</h2>
				<div class='focus-blocks'>
					<div class='focus-block' data-focus-block='outer'>
						{renderFocusControls()}
					</div>
					<div class='focus-block' data-focus-block='inset' data-s-kit-focus-inset>
						{renderFocusControls()}
					</div>
				</div>
			</section>

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
