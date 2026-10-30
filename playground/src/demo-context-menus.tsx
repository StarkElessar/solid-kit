import { Button } from '@stark/solid-kit/button';
import { ContextMenu, type ContextMenuPoint } from '@stark/solid-kit/context-menu';
import { Dialog } from '@stark/solid-kit/dialog';
import { createSignal, type JSX } from 'solid-js';

/** Содержимое меню: пункты, подменю на два уровня, недоступный и опасный пункты. Команда пишется в журнал. */
function MenuItems(props: { log: (command: string) => void }): JSX.Element {
	return (
		<>
			<ContextMenu.Item
				data-menu-item='rename'
				onSelect={() => {
					props.log('Переименовать');
				}}
			>Переименовать</ContextMenu.Item>
			<ContextMenu.Sub>
				<ContextMenu.SubTrigger data-menu-item='move'>Переместить в</ContextMenu.SubTrigger>
				<ContextMenu.SubContent data-menu-sub='move'>
					<ContextMenu.Item
						onSelect={() => {
							props.log('Папка A');
						}}
					>Папка A</ContextMenu.Item>
					<ContextMenu.Item
						onSelect={() => {
							props.log('Папка B');
						}}
					>Папка B</ContextMenu.Item>
					<ContextMenu.Sub>
						<ContextMenu.SubTrigger>Архив</ContextMenu.SubTrigger>
						<ContextMenu.SubContent>
							<ContextMenu.Item
								onSelect={() => {
									props.log('Архив 2024');
								}}
							>2024</ContextMenu.Item>
						</ContextMenu.SubContent>
					</ContextMenu.Sub>
				</ContextMenu.SubContent>
			</ContextMenu.Sub>
			<ContextMenu.Item disabled>Недоступный пункт</ContextMenu.Item>
			<ContextMenu.Item
				closeOnSelect={false}
				onSelect={() => {
					props.log('Отметить (меню остаётся)');
				}}
			>Отметить, не закрывая</ContextMenu.Item>
			<ContextMenu.Item
				onSelect={() => {
					props.log('Очень длинное название пункта меню, которое не помещается в максимальную ширину');
				}}
			>
				Очень длинное название пункта меню, которое не помещается в максимальную ширину
			</ContextMenu.Item>
			<ContextMenu.Separator/>
			<ContextMenu.Item
				variant='danger'
				data-menu-item='delete'
				onSelect={() => {
					props.log('Удалить');
				}}
			>Удалить</ContextMenu.Item>
		</>
	);
}

/** Три сценария: область с меню, меню в диалоге (Esc три раза), меню в заданной снаружи точке. */
export function DemoContextMenus(): JSX.Element {
	const [last, setLast] = createSignal('нет');
	const [outsideOpen, setOutsideOpen] = createSignal(false);
	const [point, setPoint] = createSignal<ContextMenuPoint | null>(null);

	return (
		<div class='menu-demos'>
			<ContextMenu.Root>
				<ContextMenu.Trigger class='menu-area' data-menu-area='basic'>
					Правый клик в этой области (или Shift+F10 на кнопке ниже)
					<Button type='button' data-menu-area-button>Кнопка внутри области</Button>
				</ContextMenu.Trigger>
				<ContextMenu.Content data-menu-content='basic' aria-label='Действия'>
					<MenuItems log={setLast}/>
				</ContextMenu.Content>
			</ContextMenu.Root>

			<Dialog.Root>
				<Dialog.Trigger data-menu-dialog-trigger>Диалог с контекстным меню</Dialog.Trigger>
				<Dialog.Content>
					<Dialog.Title>Меню внутри диалога</Dialog.Title>
					<Dialog.Body>
						<ContextMenu.Root>
							<ContextMenu.Trigger class='menu-area' data-menu-area='dialog'>
								Правый клик здесь: Esc закрывает подменю, меню и диалог по очереди
							</ContextMenu.Trigger>
							<ContextMenu.Content aria-label='Действия в диалоге'>
								<MenuItems log={setLast}/>
							</ContextMenu.Content>
						</ContextMenu.Root>
					</Dialog.Body>
					<Dialog.Footer>
						<Dialog.Close>Закрыть</Dialog.Close>
					</Dialog.Footer>
				</Dialog.Content>
			</Dialog.Root>

			<ContextMenu.Root
				open={outsideOpen()}
				onOpenChange={setOutsideOpen}
				anchorPoint={point()}
			>
				<Button
					type='button'
					data-menu-outside-trigger
					onContextMenu={(event) => {
						event.preventDefault();
						setPoint({ x: event.clientX, y: event.clientY });
						setOutsideOpen(true);
					}}
				>
					Меню в заданной снаружи точке (правый клик)
				</Button>
				<ContextMenu.Content aria-label='Меню снаружи'>
					<MenuItems log={setLast}/>
				</ContextMenu.Content>
			</ContextMenu.Root>

			<p>
				Последняя команда: <output data-menu-log>{last()}</output>
			</p>
		</div>
	);
}
