import { Button } from '@stark/solid-kit/button';
import { DatePicker } from '@stark/solid-kit/date-picker';
import { Dialog } from '@stark/solid-kit/dialog';
import { Field } from '@stark/solid-kit/field';
import { createSignal, For, type JSX } from 'solid-js';

const CLIPPERS: ReadonlyArray<readonly [name: string, style: JSX.CSSProperties]> = [
	['transform', { transform: 'translateZ(0)' }],
	['filter', { filter: 'grayscale(0)' }],
	['contain', { contain: 'paint' }],
	['overflow', { overflow: 'hidden' }]
];

function isWeekend(date: string): boolean {
	const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
	return weekday === 0 || weekday === 6;
}

/** Размеры, Field, форма, ограничения, локаль, очистка, предки с обрезкой и диалог для приёмки (страница «Выбор даты»). */
export function DemoDatePickers(): JSX.Element {
	const [value, setValue] = createSignal<string | null>('2026-11-18');
	const [formValue, setFormValue] = createSignal('');
	const [dialogCloses, setDialogCloses] = createSignal(0);
	const [birthday, setBirthday] = createSignal<string | null>(null);

	return (
		<div class='date-picker-demos'>
			<div class='date-picker-row'>
				<div data-date-demo='size-sm'><DatePicker size='sm' defaultValue='2026-11-18' aria-label='Малый'/></div>
				<div data-date-demo='size-md'><DatePicker size='md' defaultValue='2026-11-18' aria-label='Средний'/></div>
				<div data-date-demo='size-lg'><DatePicker size='lg' defaultValue='2026-11-18' aria-label='Большой'/></div>
			</div>

			<div class='date-picker-row'>
				<div data-date-demo='controlled'>
					<DatePicker value={value()} onValueChange={setValue} clearable aria-label='Управляемое'/>
					<p data-date-state>value = {value() ?? 'null'}</p>
				</div>
				<div data-date-demo='field'>
					<Field label='Дата рождения' hint='дд.мм.гггг' error={birthday() === null ? 'Обязательное поле' : undefined}>
						{(control) => <DatePicker {...control} value={birthday()} onValueChange={setBirthday} max='2026-11-03'/>}
					</Field>
				</div>
				<div data-date-demo='limits'>
					<DatePicker min='2026-11-05' max='2027-01-20' isDateDisabled={isWeekend} aria-label='С ограничениями'/>
				</div>
				<div data-date-demo='locale'><DatePicker locale='en-US' defaultValue='2026-11-18' aria-label='English'/></div>
			</div>

			<div class='date-picker-row'>
				<form
					data-date-demo='form'
					onSubmit={(event) => {
						event.preventDefault();
						const entry = new FormData(event.currentTarget).get('when');
						setFormValue(typeof entry === 'string' ? entry : '');
					}}
				>
					<DatePicker name='when' defaultValue='2026-11-18' aria-label='Поле формы'/>
					<Button type='submit'>Отправить</Button>
					<p data-date-state>FormData when = {formValue()}</p>
				</form>
				<div data-date-demo='readonly'><DatePicker readOnly defaultValue='2026-11-18' aria-label='Только чтение'/></div>
				<div data-date-demo='disabled'><DatePicker disabled defaultValue='2026-11-18' aria-label='Недоступное'/></div>
			</div>

			<div class='date-picker-row'>
				<For each={CLIPPERS}>
					{([name, style]) => (
						<div class='date-picker-clipper' data-date-demo={`clip-${name}`} style={style}>
							<span>{name}</span>
							<DatePicker aria-label={`Внутри ${name}`}/>
						</div>
					)}
				</For>
			</div>

			<Dialog.Root onOpenChange={(open) => !open && setDialogCloses((count) => count + 1)}>
				<Dialog.Trigger data-date-dialog-trigger>Диалог с датой</Dialog.Trigger>
				<Dialog.Content data-date-demo='dialog'>
					<Dialog.Title>Выбор даты в диалоге</Dialog.Title>
					<Dialog.Body>
						<DatePicker aria-label='Дата в диалоге'/>
					</Dialog.Body>
					<Dialog.Footer>
						<Dialog.Close variant='plain'>Закрыть</Dialog.Close>
					</Dialog.Footer>
				</Dialog.Content>
			</Dialog.Root>
			<p data-date-state>закрытий диалога: {dialogCloses()}</p>
		</div>
	);
}
