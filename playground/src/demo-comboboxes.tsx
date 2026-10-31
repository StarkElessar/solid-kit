import { Combobox } from '@stark/solid-kit/combobox';
import { Dialog } from '@stark/solid-kit/dialog';
import { Field } from '@stark/solid-kit/field';
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

/** Демонстрации Combobox для проверок и ручной приёмки (страница «Списки»). Каждое поле помечено `data-combobox`. */
export function DemoComboboxes(): JSX.Element {
	const [log, setLog] = createSignal('');
	const [submits, setSubmits] = createSignal(0);
	const [dialogCloses, setDialogCloses] = createSignal(0);
	const [serverItems, setServerItems] = createSignal<readonly Employee[]>([]);
	const [serverLoading, setServerLoading] = createSignal(false);

	let timer: ReturnType<typeof setTimeout> | undefined;
	onCleanup(() => {
		clearTimeout(timer);
	});

	// «сервер»: ответ приходит через задержку, `reset` (текст вернулся к подписи) поиска не запускает
	const search = (query: string, reason: 'input' | 'reset'): void => {
		if (reason === 'reset') {
			return;
		}
		clearTimeout(timer);
		setServerLoading(true);
		timer = setTimeout(() => {
			const needle = query.toLocaleLowerCase();
			const found = GROUPED.filter((employee) => employee.name.toLocaleLowerCase().includes(needle)).slice(0, 12);
			setServerItems(query === '' ? [] : found);
			setServerLoading(false);
		}, SERVER_DELAY_MS);
	};

	return (
		<div class='select-demos'>
			<Field label='Сотрудник (короткий список, клиентский фильтр, Field)' hint='Подсказка под полем'>
				{(control) => (
					<Combobox<Employee>
						{...control}
						data-combobox='short'
						items={SHORT}
						getKey={getKey}
						getLabel={getLabel}
						isItemDisabled={isBlocked}
						placeholder='Начните вводить'
						onValueChange={(value) => setLog(`short: ${value?.name ?? '—'}`)}
					/>
				)}
			</Field>

			<Field label='С группами и отключёнными (60 элементов)'>
				{(control) => (
					<Combobox<Employee>
						{...control}
						data-combobox='grouped'
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
					<Combobox<Employee>
						{...control}
						data-combobox='huge'
						items={HUGE}
						getKey={getKey}
						getLabel={getLabel}
						placeholder='Сотрудник'
					/>
				)}
			</Field>

			<Field label='Внешний поиск (ответ через 300 мс, filter=false, loading)'>
				{(control) => (
					<Combobox<Employee>
						{...control}
						data-combobox='server'
						items={serverItems()}
						getKey={getKey}
						getLabel={getLabel}
						filter={false}
						loading={serverLoading()}
						onQueryChange={search}
						placeholder='Введите часть имени'
					/>
				)}
			</Field>

			<Field label='В форме (Enter с активной опцией не отправляет форму)'>
				{() => (
					<form
						data-combobox-form
						style={{ display: 'flex', gap: '12px', 'align-items': 'center' }}
						onSubmit={(event) => {
							event.preventDefault();
							setSubmits((count) => count + 1);
						}}
					>
						<Combobox<Employee>
							data-combobox='form'
							items={SHORT}
							getKey={getKey}
							getLabel={getLabel}
							placeholder='Сотрудник'
							aria-label='Сотрудник в форме'
						/>
						<button type='submit'>Отправить</button>
					</form>
				)}
			</Field>

			<Field label='Отключённый и с ошибкой'>
				{() => (
					<div style={{ display: 'flex', gap: '12px' }}>
						<Combobox<Employee>
							data-combobox='disabled'
							items={SHORT}
							getKey={getKey}
							getLabel={getLabel}
							disabled
							placeholder='Отключён'
							aria-label='Отключённый'
						/>
						<Combobox<Employee>
							data-combobox='invalid'
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

			<Field label='Combobox в диалоге (Esc: сначала панель, потом диалог)'>
				{() => (
					<Dialog.Root
						onOpenChange={(open) => {
							if (!open) {
								setDialogCloses((count) => count + 1);
							}
						}}
					>
						<Dialog.Trigger data-dialog-trigger='combobox'>Открыть диалог</Dialog.Trigger>
						<Dialog.Content data-dialog-demo='combobox'>
							<Dialog.Title>Диалог с Combobox</Dialog.Title>
							<Dialog.Body>
								<Combobox<Employee>
									data-combobox='in-dialog'
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

			<p data-combobox-log>{log()}</p>
			<p data-combobox-submits>Отправок формы: {submits()}</p>
			<p data-combobox-dialog-closes>Закрытий диалога (Combobox): {dialogCloses()}</p>
		</div>
	);
}
