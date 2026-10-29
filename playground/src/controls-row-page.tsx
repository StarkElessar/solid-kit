import { Button } from '@stark/solid-kit/button';
import { ButtonGroup } from '@stark/solid-kit/button-group';
import { Checkbox } from '@stark/solid-kit/checkbox';
import { IconButton } from '@stark/solid-kit/icon-button';
import { Input } from '@stark/solid-kit/input';
import { NumericInput } from '@stark/solid-kit/numeric-input';
import { RadioGroup } from '@stark/solid-kit/radio-group';
import { Switch } from '@stark/solid-kit/switch';
import { Tabs } from '@stark/solid-kit/tabs';
import { ToggleGroup } from '@stark/solid-kit/toggle-group';
import { createEffect, createSignal, For, type JSX } from 'solid-js';

import { runButtonChecks } from './button-checks';
import { runCheckboxChecks } from './checkbox-checks';
import { ROWS, type RowSpec } from './control-rows';
import { DemoCheckboxes } from './demo-checkboxes';
import { DEMO_CONTROLS } from './demo-controls';
import { DemoFields } from './demo-fields';
import { DemoIcon } from './demo-icon';
import { DemoNumericInputs } from './demo-numeric-inputs';
import { DemoRadioGroups } from './demo-radio-groups';
import { DemoSwitches } from './demo-switches';
import { DemoTabs } from './demo-tabs';
import { DemoToggleGroups } from './demo-toggle-groups';
import { runFieldChecks } from './field-checks';
import { runInputChecks } from './input-checks';
import { runNumericInputChecks } from './numeric-input-checks';
import { pick } from './pick';
import { runRadioChecks } from './radio-checks';
import { runRowChecks } from './row-checks';
import { runSwitchChecks } from './switch-checks';
import { runTabsChecks } from './tabs-checks';
import type { CheckResult } from './theme-checks';
import { runToggleGroupChecks } from './toggle-group-checks';

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
		<Input aria-label='Поле с ошибкой' aria-invalid='true' defaultValue='Ошибка' data-focus-name='input-invalid'/>,
		<NumericInput aria-label='Число' defaultValue={7} data-focus-name='numeric-input'/>,
		<ButtonGroup aria-label='Группа'>
			<Button variant='plain' data-focus-name='group-first'>Один</Button>
			<Button variant='plain' data-focus-name='group-second'>Два</Button>
		</ButtonGroup>,
		<ToggleGroup.Root aria-label='Переключатели' mode='multi' defaultValue={['one']}>
			<ToggleGroup.Item value='one' data-focus-name='toggle-selected'>Один</ToggleGroup.Item>
			<ToggleGroup.Item value='two' data-focus-name='toggle-plain'>Два</ToggleGroup.Item>
		</ToggleGroup.Root>,
		<Checkbox aria-label='Флажок' data-focus-name='checkbox'/>,
		<Checkbox aria-label='Выбранный флажок' defaultChecked data-focus-name='checkbox-checked'/>,
		<RadioGroup.Root aria-label='Радио' orientation='horizontal' defaultValue='two'>
			<RadioGroup.Item value='one' aria-label='Радио' data-focus-name='radio'/>
			<RadioGroup.Item value='two' aria-label='Выбранное радио' data-focus-name='radio-checked'/>
		</RadioGroup.Root>,
		<Switch aria-label='Переключатель' data-focus-name='switch'/>,
		<Switch aria-label='Включённый переключатель' defaultChecked data-focus-name='switch-on'/>,
		<Tabs.Root defaultValue='one'>
			<Tabs.List aria-label='Вкладки'>
				<Tabs.Tab value='one' data-focus-name='tab-selected'>Одна</Tabs.Tab>
				<Tabs.Tab value='two' data-focus-name='tab'>Две</Tabs.Tab>
			</Tabs.List>
		</Tabs.Root>
	];
}

export function ControlsRowPage(): JSX.Element {
	const [theme, setTheme] = createSignal<Theme>('system');
	const [results, setResults] = createSignal<readonly CheckResult[]>([]);
	let page: HTMLElement | undefined;

	const runChecks = (): void => {
		if (page) {
			setResults([
				...runRowChecks(page),
				...runButtonChecks(page),
				...runInputChecks(page),
				...runFieldChecks(page),
				...runToggleGroupChecks(page),
				...runCheckboxChecks(page),
				...runRadioChecks(page),
				...runSwitchChecks(page),
				...runNumericInputChecks(page),
				...runTabsChecks(page)
			]);
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
				<h2>Кольцо фокуса: снаружи и внутри контейнера с data-s-kit-focus-inset, сегменты группы всегда внутри</h2>
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
				<h2>Field: подпись, подсказка и ошибка вокруг поля</h2>
				<DemoFields/>
			</section>

			<section>
				<h2>ToggleGroup: щелчок меняет значение, выбранный сегмент отличается заливкой и цветом текста</h2>
				<DemoToggleGroups/>
			</section>

			<section>
				<h2>Checkbox: состояния и контраст отметки</h2>
				<DemoCheckboxes/>
			</section>

			<section>
				<h2>RadioGroup: группа, состояния и контраст отметки (стрелки двигают выбор)</h2>
				<DemoRadioGroups/>
			</section>

			<section>
				<h2>Switch: состояния и контраст дорожки и ползунка</h2>
				<DemoSwitches/>
			</section>

			<section>
				<h2>NumericInput: ввод, стрелки, границы и фиксация на потере фокуса</h2>
				<DemoNumericInputs/>
			</section>

			<section>
				<h2>Tabs: выбор, стрелки по кругу, прокрутка полосы и контраст индикатора</h2>
				<DemoTabs/>
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
