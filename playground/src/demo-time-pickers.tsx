import { Button } from '@stark/solid-kit/button';
import { Dialog } from '@stark/solid-kit/dialog';
import { Field } from '@stark/solid-kit/field';
import { TimePicker } from '@stark/solid-kit/time-picker';
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

/** Размеры, Field, форма, ограничения, 12 часов, очистка, предки с обрезкой и диалог для приёмки (страница «Выбор времени»). */
export function DemoTimePickers(): JSX.Element {
	const [value, setValue] = createSignal<string | null>('09:30');
	const [formValue, setFormValue] = createSignal('');
	const [dialogCloses, setDialogCloses] = createSignal(0);
	const [departure, setDeparture] = createSignal<string | null>(null);

	return (
		<div class='date-picker-demos'>
			<div class='date-picker-row'>
				<div data-time-demo='size-sm'><TimePicker size='sm' defaultValue='14:30' aria-label='Малый'/></div>
				<div data-time-demo='size-md'><TimePicker size='md' defaultValue='14:30' aria-label='Средний'/></div>
				<div data-time-demo='size-lg'><TimePicker size='lg' defaultValue='14:30' aria-label='Большой'/></div>
			</div>

			<div class='date-picker-row'>
				<div data-time-demo='controlled'>
					<TimePicker value={value()} onValueChange={setValue} clearable aria-label='Управляемое'/>
					<p data-time-state>value = {value() ?? 'null'}</p>
				</div>
				<div data-time-demo='field'>
					<Field label='Время отправления' hint='чч:мм' error={departure() === null ? 'Обязательное поле' : undefined}>
						{(control) => <TimePicker {...control} value={departure()} onValueChange={setDeparture}/>}
					</Field>
				</div>
				<div data-time-demo='limits'>
					<TimePicker min='09:00' max='18:00' minuteStep={15} isTimeDisabled={isLunch} aria-label='С ограничениями'/>
				</div>
				<div data-time-demo='english'><TimePicker locale='en-US' clearable defaultValue='14:30' aria-label='English'/></div>
			</div>

			<div class='date-picker-row'>
				<form
					data-time-demo='form'
					onSubmit={(event) => {
						event.preventDefault();
						const entry = new FormData(event.currentTarget).get('at');
						setFormValue(typeof entry === 'string' ? entry : '');
					}}
				>
					<TimePicker name='at' defaultValue='18:00' aria-label='Поле формы'/>
					<Button type='submit'>Отправить</Button>
					<p data-time-state>FormData at = {formValue()}</p>
				</form>
				<div data-time-demo='readonly'><TimePicker readOnly defaultValue='14:30' aria-label='Только чтение'/></div>
				<div data-time-demo='disabled'><TimePicker disabled defaultValue='14:30' aria-label='Недоступное'/></div>
			</div>

			<div class='date-picker-row'>
				<For each={CLIPPERS}>
					{([name, style]) => (
						<div class='date-picker-clipper' data-time-demo={`clip-${name}`} style={style}>
							<span>{name}</span>
							<TimePicker aria-label={`Внутри ${name}`}/>
						</div>
					)}
				</For>
			</div>

			<Dialog.Root onOpenChange={(open) => !open && setDialogCloses((count) => count + 1)}>
				<Dialog.Trigger data-time-dialog-trigger>Диалог со временем</Dialog.Trigger>
				<Dialog.Content data-time-demo='dialog'>
					<Dialog.Title>Выбор времени в диалоге</Dialog.Title>
					<Dialog.Body>
						<TimePicker aria-label='Время в диалоге'/>
					</Dialog.Body>
					<Dialog.Footer>
						<Dialog.Close variant='plain'>Закрыть</Dialog.Close>
					</Dialog.Footer>
				</Dialog.Content>
			</Dialog.Root>
			<p data-time-state>закрытий диалога: {dialogCloses()}</p>
		</div>
	);
}
