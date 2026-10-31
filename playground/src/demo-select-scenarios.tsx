import { Select } from '@stark/solid-kit/select';
import { createSignal, For, type JSX } from 'solid-js';

import type { Employee } from './demo-selects';

const TEAMS = ['Дизайн', 'Разработка', 'Аналитика', 'Поддержка'] as const;

const EMPLOYEES: readonly Employee[] = Array.from({ length: 60 }, (_, index) => ({
	id: index,
	name: `Сотрудник ${index}`,
	team: TEAMS[Math.floor(index / 15)] ?? 'Дизайн'
}));

const CLIPPERS: ReadonlyArray<readonly [name: string, style: JSX.CSSProperties]> = [
	['transform', { transform: 'translateZ(0)' }],
	['filter', { filter: 'grayscale(0)' }],
	['contain', { contain: 'paint' }],
	['overflow', { overflow: 'hidden' }]
];

const getKey = (employee: Employee): number => employee.id;
const getLabel = (employee: Employee): string => employee.name;
const getTeam = (employee: Employee): string => employee.team;

function ScenarioSelect(props: { label: string; style?: JSX.CSSProperties; grouped?: boolean }): JSX.Element {
	return (
		<Select<Employee>
			data-scenario-trigger
			aria-label={props.label}
			style={props.style}
			items={EMPLOYEES}
			getKey={getKey}
			getLabel={getLabel}
			groupBy={props.grouped === true ? getTeam : undefined}
			placeholder='Выберите'
		/>
	);
}

/** Сценарии критериев 4 и 5 на Select: панель не зависит от окружения инициатора (зеркало `DemoPopoverScenarios`). */
export function DemoSelectScenarios(): JSX.Element {
	const [cardClicks, setCardClicks] = createSignal(0);
	const [cardDoubleClicks, setCardDoubleClicks] = createSignal(0);
	const [submits, setSubmits] = createSignal(0);

	return (
		<div class='scenario-demos'>
			<div class='scenario' data-scenario='select-b' style={{ 'pointer-events': 'none' }}>
				<span>(б) предок с pointer-events: none; сам инициатор включён обратно</span>
				<ScenarioSelect label='Select под pointer-events: none' style={{ 'pointer-events': 'auto' }}/>
			</div>

			<label class='scenario' data-scenario='select-c-label'>
				<span>(в) Select внутри label: клик по опции не переключает флажок</span>
				<input type='checkbox' data-label-input/>
				<ScenarioSelect label='Select внутри label'/>
			</label>

			<div
				class='scenario'
				data-scenario='select-c-card'
				onClick={() => setCardClicks((count) => count + 1)}
				onDblClick={() => setCardDoubleClicks((count) => count + 1)}
			>
				<span>(в) Select внутри кликабельной карточки: клик и двойной клик по опции не доходят до карточки</span>
				<ScenarioSelect label='Select внутри карточки'/>
				<output>
					клики карточки: <span data-counter='select-clicks'>{cardClicks()}</span>, двойные:
					<span data-counter='select-doubles'>{cardDoubleClicks()}</span>
				</output>
			</div>

			<form
				class='scenario'
				data-scenario='select-c-form'
				onSubmit={(event) => {
					event.preventDefault();
					setSubmits((count) => count + 1);
				}}
			>
				<span>(в) Select внутри form: Enter в списке выбирает опцию и не отправляет чужую форму</span>
				<ScenarioSelect label='Select внутри формы'/>
				<output>отправок формы: <span data-counter='select-submits'>{submits()}</span></output>
			</form>

			<div class='scenario' data-scenario='select-ring'>
				<span>Кольцо активной опции у краёв списка и под липким заголовком группы</span>
				<ScenarioSelect label='Select с группами' grouped/>
			</div>

			<div class='clippers'>
				<For each={CLIPPERS}>
					{([name, style]) => (
						<div class='clipper' data-scenario={`select-d-${name}`} style={style}>
							<span>(д) {name}</span>
							<ScenarioSelect label={`Select из ${name}`}/>
						</div>
					)}
				</For>
			</div>
		</div>
	);
}
