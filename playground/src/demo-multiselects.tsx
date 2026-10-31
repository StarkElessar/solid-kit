import { Dialog } from '@stark/solid-kit/dialog';
import { Field } from '@stark/solid-kit/field';
import { MultiSelect, type MultiSelectValue } from '@stark/solid-kit/multiselect';
import { createSignal, type JSX, onCleanup } from 'solid-js';

import type { Employee } from './demo-selects';

const TEAMS = ['Дизайн', 'Разработка', 'Аналитика', 'Поддержка'] as const;

function makeEmployees(count: number): Employee[] {
	return Array.from({ length: count }, (_, index) => ({
		id: index,
		name: `Сотрудник ${index}`,
		team: TEAMS[index % TEAMS.length] ?? 'Дизайн',
		blocked: index % 7 === 3
	}));
}

const SHORT = makeEmployees(8);
const GROUPED = makeEmployees(60);
const HUGE = makeEmployees(100_000);

const getKey = (employee: Employee): number => employee.id;
const getLabel = (employee: Employee): string => employee.name;
const isBlocked = (employee: Employee): boolean => employee.blocked === true;
const getTeam = (employee: Employee): string => employee.team;

const SERVER_DELAY_MS = 300;
const ALL_KEY = -1;

function describeValue(value: MultiSelectValue<Employee>): string {
	if (typeof value === 'string' || typeof value === 'number') {
		return `allKey ${value}`;
	}
	return `${value.length}: ${value.map(getLabel).join(', ') || '—'}`;
}

/** Демонстрации MultiSelect для проверок и ручной приёмки (страница «Списки»). Каждая основная кнопка помечена `data-multiselect`. */
export function DemoMultiSelects(): JSX.Element {
	const [log, setLog] = createSignal('');
	const [allValue, setAllValue] = createSignal<MultiSelectValue<Employee>>([]);
	const [submits, setSubmits] = createSignal(0);
	const [dialogCloses, setDialogCloses] = createSignal(0);
	const [serverItems, setServerItems] = createSignal<readonly Employee[]>([]);
	const [serverLoading, setServerLoading] = createSignal(false);

	let timer: ReturnType<typeof setTimeout> | undefined;
	onCleanup(() => {
		clearTimeout(timer);
	});

	// «сервер»: ответ приходит через задержку, пустой запрос возвращает первые элементы
	const search = (query: string): void => {
		clearTimeout(timer);
		setServerLoading(true);
		timer = setTimeout(() => {
			const needle = query.toLocaleLowerCase();
			setServerItems(GROUPED.filter((employee) => employee.name.toLocaleLowerCase().includes(needle)).slice(0, 12));
			setServerLoading(false);
		}, SERVER_DELAY_MS);
	};

	return (
		<div class='select-demos'>
			<Field label='Сотрудники (короткий список, collapse, Field)' hint='Подсказка под полем'>
				{(control) => (
					<MultiSelect<Employee>
						{...control}
						data-multiselect='short'
						items={SHORT}
						getKey={getKey}
						getLabel={getLabel}
						isItemDisabled={isBlocked}
						placeholder='Выберите сотрудников'
						onValueChange={(value) => setLog(`short: ${describeValue(value)}`)}
					/>
				)}
			</Field>

			<Field label='Узкий контрол: чипы сворачиваются в «+N»'>
				{(control) => (
					<MultiSelect<Employee>
						{...control}
						data-multiselect='narrow'
						style={{ '--s-kit-multiselect-width': '14rem' }}
						items={SHORT}
						defaultValue={[SHORT[0], SHORT[1], SHORT[2], SHORT[4], SHORT[5]].filter((item) => item !== undefined)}
						getKey={getKey}
						getLabel={getLabel}
						placeholder='Выберите'
					/>
				)}
			</Field>

			<Field label='Режим summary («N из M»)'>
				{(control) => (
					<MultiSelect<Employee>
						{...control}
						data-multiselect='summary'
						items={GROUPED}
						defaultValue={GROUPED.slice(0, 3)}
						getKey={getKey}
						getLabel={getLabel}
						groupBy={getTeam}
						isItemDisabled={isBlocked}
						chipsOverflow='summary'
						placeholder='Выберите'
					/>
				)}
			</Field>

			<Field label='Режим wrap (контрол растёт, на странице «Контролы в ряд» отдельной строкой)'>
				{(control) => (
					<MultiSelect<Employee>
						{...control}
						data-multiselect='wrap'
						items={SHORT}
						defaultValue={SHORT.slice(0, 6)}
						getKey={getKey}
						getLabel={getLabel}
						chipsOverflow='wrap'
						placeholder='Выберите'
					/>
				)}
			</Field>

			<Field label='Со строкой «Все» (значение -1)'>
				{(control) => (
					<MultiSelect<Employee>
						{...control}
						data-multiselect='all'
						items={SHORT}
						getKey={getKey}
						getLabel={getLabel}
						isItemDisabled={isBlocked}
						allKey={ALL_KEY}
						allLabel='Все сотрудники'
						value={allValue()}
						onValueChange={setAllValue}
						placeholder='Выберите'
					/>
				)}
			</Field>
			<p data-multiselect-all-value>Значение: {describeValue(allValue())}</p>

			<Field label='100 000 опций со строкой «Все» (виртуализация)'>
				{(control) => (
					<MultiSelect<Employee>
						{...control}
						data-multiselect='huge'
						items={HUGE}
						getKey={getKey}
						getLabel={getLabel}
						allKey={ALL_KEY}
						allLabel='Все'
						placeholder='Выберите'
					/>
				)}
			</Field>

			<Field label='Внешний поиск (ответ через 300 мс, filter=false, loading, total=60)'>
				{(control) => (
					<MultiSelect<Employee>
						{...control}
						data-multiselect='server'
						items={serverItems()}
						total={60}
						getKey={getKey}
						getLabel={getLabel}
						filter={false}
						loading={serverLoading()}
						onQueryChange={search}
						chipsOverflow='summary'
						placeholder='Введите часть имени'
					/>
				)}
			</Field>

			<Field label='Без поля поиска (typeahead на кнопке)'>
				{(control) => (
					<MultiSelect<Employee>
						{...control}
						data-multiselect='plain'
						items={SHORT}
						getKey={getKey}
						getLabel={getLabel}
						searchable={false}
						placeholder='Выберите'
					/>
				)}
			</Field>

			<Field label='В форме (Enter в поле поиска не отправляет форму)'>
				{() => (
					<form
						data-multiselect-form
						style={{ display: 'flex', gap: '12px', 'align-items': 'center' }}
						onSubmit={(event) => {
							event.preventDefault();
							setSubmits((count) => count + 1);
						}}
					>
						<MultiSelect<Employee>
							data-multiselect='form'
							items={SHORT}
							getKey={getKey}
							getLabel={getLabel}
							placeholder='Выберите'
							aria-label='Сотрудники в форме'
						/>
						<button type='submit'>Отправить</button>
					</form>
				)}
			</Field>

			<Field label='Отключённый и с ошибкой'>
				{() => (
					<div style={{ display: 'flex', gap: '12px' }}>
						<MultiSelect<Employee>
							data-multiselect='disabled'
							items={SHORT}
							defaultValue={SHORT.slice(0, 2)}
							getKey={getKey}
							getLabel={getLabel}
							disabled
							placeholder='Отключён'
							aria-label='Отключённый'
						/>
						<MultiSelect<Employee>
							data-multiselect='invalid'
							items={SHORT}
							getKey={getKey}
							getLabel={getLabel}
							aria-invalid={true}
							placeholder='С ошибкой'
							aria-label='С ошибкой'
						/>
					</div>
				)}
			</Field>

			<Field label='MultiSelect в диалоге (Esc: сначала панель, потом диалог)'>
				{() => (
					<Dialog.Root
						onOpenChange={(open) => {
							if (!open) {
								setDialogCloses((count) => count + 1);
							}
						}}
					>
						<Dialog.Trigger data-dialog-trigger='multiselect'>Открыть диалог</Dialog.Trigger>
						<Dialog.Content data-dialog-demo='multiselect'>
							<Dialog.Title>Диалог с MultiSelect</Dialog.Title>
							<Dialog.Body>
								<MultiSelect<Employee>
									data-multiselect='in-dialog'
									items={SHORT}
									getKey={getKey}
									getLabel={getLabel}
									placeholder='Выберите'
									aria-label='Сотрудники в диалоге'
								/>
							</Dialog.Body>
							<Dialog.Footer>
								<Dialog.Close data-dialog-close>Закрыть</Dialog.Close>
							</Dialog.Footer>
						</Dialog.Content>
					</Dialog.Root>
				)}
			</Field>

			<p data-multiselect-log>{log()}</p>
			<p data-multiselect-submits>Отправок формы: {submits()}</p>
			<p data-multiselect-dialog-closes>Закрытий диалога (MultiSelect): {dialogCloses()}</p>
		</div>
	);
}
