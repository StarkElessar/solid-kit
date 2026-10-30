import { Button } from '@stark/solid-kit/button';
import { Checkbox } from '@stark/solid-kit/checkbox';
import { Dialog } from '@stark/solid-kit/dialog';
import { Input } from '@stark/solid-kit/input';
import { Popover } from '@stark/solid-kit/popover';
import { Switch } from '@stark/solid-kit/switch';
import { createSignal, For, type JSX } from 'solid-js';

const LONG_LINES = Array.from({ length: 30 }, (_, index) => index + 1);

/** Три диалога для проверок и ручной приёмки: обычный с контролами у края тела, с Popover внутри и с длинным телом. */
export function DemoDialogs(): JSX.Element {
	const [closes, setCloses] = createSignal(0);
	const [formSubmits, setFormSubmits] = createSignal(0);

	return (
		<div class='dialog-demos'>
			<Dialog.Root>
				<Dialog.Trigger data-dialog-trigger='basic'>Диалог с контролами</Dialog.Trigger>
				<Dialog.Content data-dialog-demo='basic'>
					<Dialog.Title>Удалить запись?</Dialog.Title>
					<Dialog.Description>Действие нельзя отменить.</Dialog.Description>
					<Dialog.Body data-dialog-body>
						<Input aria-label='Название' defaultValue='Контрол вплотную к краю тела'/>
						<Checkbox>Не спрашивать снова</Checkbox>
						<Switch>Уведомлять по почте</Switch>
					</Dialog.Body>
					<Dialog.Footer>
						<Dialog.Close variant='plain' data-dialog-close>Отмена</Dialog.Close>
						<Button variant='danger'>Удалить</Button>
					</Dialog.Footer>
				</Dialog.Content>
			</Dialog.Root>

			<Dialog.Root
				onOpenChange={(open) => {
					if (!open) {
						setCloses((count) => count + 1);
					}
				}}
			>
				<Dialog.Trigger data-dialog-trigger='popover'>Диалог с Popover</Dialog.Trigger>
				<Dialog.Content data-dialog-demo='popover'>
					<Dialog.Title>Диалог с панелью</Dialog.Title>
					<Dialog.Body>
						<Popover.Root>
							<Popover.Trigger>Открыть панель</Popover.Trigger>
							<Popover.Content>
								<form
									data-popover-form
									onSubmit={(event) => {
										event.preventDefault();
										setFormSubmits((count) => count + 1);
									}}
								>
									<Input aria-label='Поле в панели' placeholder='Поле в панели'/>
									<Button type='submit'>Сохранить</Button>
								</form>
							</Popover.Content>
						</Popover.Root>
					</Dialog.Body>
					<Dialog.Footer>
						<Dialog.Close variant='plain'>Закрыть</Dialog.Close>
					</Dialog.Footer>
				</Dialog.Content>
			</Dialog.Root>

			<Dialog.Root closeOnBackdropClick={false}>
				<Dialog.Trigger data-dialog-trigger='long'>Диалог с длинным телом (без закрытия по подложке)</Dialog.Trigger>
				<Dialog.Content data-dialog-demo='long'>
					<Dialog.Title>Длинное тело</Dialog.Title>
					<Dialog.Body>
						<For each={LONG_LINES}>{(line) => <p>{`Строка ${line} длинного тела диалога.`}</p>}</For>
					</Dialog.Body>
					<Dialog.Footer>
						<Dialog.Close>Готово</Dialog.Close>
					</Dialog.Footer>
				</Dialog.Content>
			</Dialog.Root>

			<output data-counter='dialog-closes'>
				onOpenChange(false) диалога с панелью: <span data-counter='dialog-closes-count'>{closes()}</span>; отправок формы панели:
				<span data-counter='popover-form-submits'>{formSubmits()}</span>
			</output>
		</div>
	);
}
