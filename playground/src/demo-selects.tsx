import { Dialog } from '@stark/solid-kit/dialog';
import { Field } from '@stark/solid-kit/field';
import { Select } from '@stark/solid-kit/select';
import { createSignal, type JSX } from 'solid-js';

export interface Employee {
	readonly id: number;
	readonly name: string;
	readonly team: string;
	readonly blocked?: boolean;
}

const TEAMS = ['Дизайн', 'Разработка', 'Аналитика', 'Поддержка'] as const;

function makeEmployees(count: number): Employee[] {
	return Array.from({ length: count }, (_, index) => ({
		id: index,
		name: `Сотрудник ${index}`,
		team: TEAMS[index % TEAMS.length] ?? 'Дизайн',
		blocked: index % 7 === 3
	}));
}

const SHORT = makeEmployees(6);
const GROUPED = makeEmployees(60);
const HUGE = makeEmployees(100_000);
const MEDIUM = makeEmployees(200);

const getKey = (employee: Employee): number => employee.id;
const getLabel = (employee: Employee): string => employee.name;
const isBlocked = (employee: Employee): boolean => employee.blocked === true;
const getTeam = (employee: Employee): string => employee.team;

/** Демонстрации Select для проверок и ручной приёмки (страница «Списки»). Каждый триггер помечен `data-select`. */
export function DemoSelects(): JSX.Element {
	const [log, setLog] = createSignal('');
	const [dialogCloses, setDialogCloses] = createSignal(0);
	const [filter, setFilter] = createSignal<readonly Employee[]>(GROUPED);

	return (
		<div class='select-demos'>
			<Field label='Сотрудник (короткий список, плейсхолдер, Field)' hint='Подсказка под полем'>
				{(control) => (
					<Select<Employee>
						{...control}
						data-select='short'
						items={SHORT}
						getKey={getKey}
						getLabel={getLabel}
						isItemDisabled={isBlocked}
						placeholder='Выберите сотрудника'
						onValueChange={(value) => setLog(`short: ${value?.name ?? '—'}`)}
					/>
				)}
			</Field>

			<Field label='С группами и отключёнными (60 элементов)'>
				{(control) => (
					<Select<Employee>
						{...control}
						data-select='grouped'
						items={GROUPED}
						getKey={getKey}
						getLabel={getLabel}
						groupBy={getTeam}
						isItemDisabled={isBlocked}
						placeholder='Сотрудник'
					/>
				)}
			</Field>

			<Field label='100 000 опций (виртуализация)'>
				{(control) => (
					<Select<Employee>
						{...control}
						data-select='huge'
						items={HUGE}
						getKey={getKey}
						getLabel={getLabel}
						placeholder='Сотрудник'
					/>
				)}
			</Field>

			<Field label='virtualized={false}, 200 опций'>
				{(control) => (
					<Select<Employee>
						{...control}
						data-select='full'
						items={MEDIUM}
						getKey={getKey}
						getLabel={getLabel}
						virtualized={false}
						placeholder='Сотрудник'
					/>
				)}
			</Field>

			<Field label='Свой renderOption и renderValue'>
				{(control) => (
					<Select<Employee>
						{...control}
						data-select='custom'
						items={SHORT}
						getKey={getKey}
						getLabel={getLabel}
						placeholder='Сотрудник'
						renderValue={(employee) => <b>{employee.name}</b>}
						renderOption={(employee, state) => (
							<span style={{ display: 'flex', gap: '8px', 'align-items': 'center', width: '100%' }}>
								<span aria-hidden='true'>{state.selected() ? '●' : '○'}</span>
								<span style={{ flex: '1' }}>{employee.name}</span>
								<small>{employee.team}</small>
							</span>
						)}
					/>
				)}
			</Field>

			<Field label='Загрузка и пустой список'>
				{(control) => (
					<div style={{ display: 'flex', gap: '12px' }}>
						<Select<Employee>
							{...control}
							data-select='loading'
							items={[]}
							getKey={getKey}
							getLabel={getLabel}
							loading
							placeholder='Загрузка'
						/>
						<Select<Employee>
							data-select='empty'
							items={[]}
							getKey={getKey}
							getLabel={getLabel}
							placeholder='Пусто'
							aria-label='Пустой список'
						/>
					</div>
				)}
			</Field>

			<Field label='Внешний фильтр данных (items меняются при открытом списке)'>
				{(control) => (
					<div style={{ display: 'flex', gap: '12px', 'align-items': 'center' }}>
						<Select<Employee>
							{...control}
							data-select='dynamic'
							items={filter()}
							getKey={getKey}
							getLabel={getLabel}
							placeholder='Сотрудник'
						/>
						<button
							type='button'
							data-select-action='shrink'
							onClick={() => setFilter((current) => (current.length > 10 ? current.slice(0, 10) : GROUPED))}
						>
							Сменить набор
						</button>
					</div>
				)}
			</Field>

			<Field label='Select в диалоге (Esc: сначала панель, потом диалог)'>
				{() => (
					<Dialog.Root
						onOpenChange={(open) => {
							if (!open) {
								setDialogCloses((count) => count + 1);
							}
						}}
					>
						<Dialog.Trigger data-dialog-trigger='select'>Открыть диалог</Dialog.Trigger>
						<Dialog.Content data-dialog-demo='select'>
							<Dialog.Title>Диалог с Select</Dialog.Title>
							<Dialog.Body>
								<Select<Employee>
									data-select='in-dialog'
									items={SHORT}
									getKey={getKey}
									getLabel={getLabel}
									placeholder='Сотрудник'
									aria-label='Сотрудник в диалоге'
								/>
							</Dialog.Body>
							<Dialog.Footer>
								<Dialog.Close data-dialog-close>Закрыть</Dialog.Close>
							</Dialog.Footer>
						</Dialog.Content>
					</Dialog.Root>
				)}
			</Field>

			<p data-select-log>{log()}</p>
			<p data-select-dialog-closes>Закрытий диалога: {dialogCloses()}</p>
		</div>
	);
}
