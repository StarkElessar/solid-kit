import { Button } from '@stark/solid-kit/button';
import { DateTimePicker } from '@stark/solid-kit/date-time-picker';
import { Dialog } from '@stark/solid-kit/dialog';
import { Field } from '@stark/solid-kit/field';
import { createSignal, For, type JSX } from 'solid-js';

const CLIPPERS: ReadonlyArray<readonly [name: string, style: JSX.CSSProperties]> = [
	['transform', { transform: 'translateZ(0)' }],
	['filter', { filter: 'grayscale(0)' }],
	['contain', { contain: 'paint' }],
	['overflow', { overflow: 'hidden' }]
];

function isLunch(time: string): boolean {
	return time.startsWith('13:');
}

function isWeekend(date: string): boolean {
	const weekday = new Date(`${date}T00:00`).getDay();
	return weekday === 0 || weekday === 6;
}

/** Размеры, Field, форма, ограничения, 12 часов, очистка, предки с обрезкой и диалог для приёмки (страница «Выбор даты и времени»). */
export function DemoDateTimePickers(): JSX.Element {
	const [value, setValue] = createSignal<string | null>('2030-11-14T09:30');
	const [formValue, setFormValue] = createSignal('');
	const [dialogCloses, setDialogCloses] = createSignal(0);
	const [deadline, setDeadline] = createSignal<string | null>(null);

	return (
		<div class='date-picker-demos'>
			<div class='date-picker-row'>
				<div data-datetime-demo='size-sm'><DateTimePicker size='sm' defaultValue='2030-11-14T14:30' aria-label='Малый'/></div>
				<div data-datetime-demo='size-md'><DateTimePicker size='md' defaultValue='2030-11-14T14:30' aria-label='Средний'/></div>
				<div data-datetime-demo='size-lg'><DateTimePicker size='lg' defaultValue='2030-11-14T14:30' aria-label='Большой'/></div>
			</div>

			<div class='date-picker-row'>
				<div data-datetime-demo='controlled'>
					<DateTimePicker value={value()} onValueChange={setValue} clearable aria-label='Управляемое'/>
					<p data-datetime-state>value = {value() ?? 'null'}</p>
				</div>
				<div data-datetime-demo='field'>
					<Field label='Срок сдачи' hint='дд.мм.гггг чч:мм' error={deadline() === null ? 'Обязательное поле' : undefined}>
						{(control) => <DateTimePicker {...control} value={deadline()} onValueChange={setDeadline}/>}
					</Field>
				</div>
				<div data-datetime-demo='limits'>
					<DateTimePicker
						defaultValue='2030-11-12T10:00'
						min='2030-11-05T09:00'
						max='2030-11-25T18:00'
						minuteStep={15}
						isDateDisabled={isWeekend}
						isTimeDisabled={isLunch}
						aria-label='С ограничениями'
					/>
				</div>
				<div data-datetime-demo='english'>
					<DateTimePicker locale='en-US' clearable defaultValue='2030-11-14T14:30' aria-label='English'/>
				</div>
			</div>

			<div class='date-picker-row'>
				<form
					data-datetime-demo='form'
					onSubmit={(event) => {
						event.preventDefault();
						const entry = new FormData(event.currentTarget).get('at');
						setFormValue(typeof entry === 'string' ? entry : '');
					}}
				>
					<DateTimePicker name='at' defaultValue='2030-11-18T18:00' aria-label='Поле формы'/>
					<Button type='submit'>Отправить</Button>
					<p data-datetime-state>FormData at = {formValue()}</p>
				</form>
				<div data-datetime-demo='readonly'>
					<DateTimePicker readOnly defaultValue='2030-11-14T14:30' aria-label='Только чтение'/>
				</div>
				<div data-datetime-demo='disabled'><DateTimePicker disabled defaultValue='2030-11-14T14:30' aria-label='Недоступное'/></div>
			</div>

			<div class='date-picker-row'>
				<For each={CLIPPERS}>
					{([name, style]) => (
						<div class='date-picker-clipper' data-datetime-demo={`clip-${name}`} style={style}>
							<span>{name}</span>
							<DateTimePicker aria-label={`Внутри ${name}`}/>
						</div>
					)}
				</For>
			</div>

			<Dialog.Root onOpenChange={(open) => !open && setDialogCloses((count) => count + 1)}>
				<Dialog.Trigger data-datetime-dialog-trigger>Диалог с датой и временем</Dialog.Trigger>
				<Dialog.Content data-datetime-demo='dialog'>
					<Dialog.Title>Выбор даты и времени в диалоге</Dialog.Title>
					<Dialog.Body>
						<DateTimePicker aria-label='Дата и время в диалоге'/>
					</Dialog.Body>
					<Dialog.Footer>
						<Dialog.Close variant='plain'>Закрыть</Dialog.Close>
					</Dialog.Footer>
				</Dialog.Content>
			</Dialog.Root>
			<p data-datetime-state>закрытий диалога: {dialogCloses()}</p>
		</div>
	);
}
