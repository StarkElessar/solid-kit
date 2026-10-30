import { Button } from '@stark/solid-kit/button';
import { ContextMenu } from '@stark/solid-kit/context-menu';
import { Input } from '@stark/solid-kit/input';
import { Popover } from '@stark/solid-kit/popover';
import { createSignal, For, type JSX } from 'solid-js';

const CLIPPERS: ReadonlyArray<readonly [name: string, style: JSX.CSSProperties]> = [
	['transform', { transform: 'translateZ(0)' }],
	['filter', { filter: 'grayscale(0)' }],
	['contain', { contain: 'paint' }],
	['overflow', { overflow: 'hidden' }]
];

/** Содержимое панели для проверок: текст (клик и двойной клик), кнопка (hit-test) и счётчик нажатий кнопки. */
function PanelBody(props: { onPress?: () => void }): JSX.Element {
	return (
		<div class='panel-body'>
			<span data-panel-text>Текст в панели</span>
			<Button data-panel-button onClick={() => props.onPress?.()}>Кнопка в панели</Button>
		</div>
	);
}

/** Сценарии (б), (в), (д) критерия 6 на Popover и мини-вариант (а) на ContextMenu: панель не зависит от окружения инициатора. */
export function DemoPopoverScenarios(): JSX.Element {
	const [pressed, setPressed] = createSignal(0);
	const [cardClicks, setCardClicks] = createSignal(0);
	const [cardDoubleClicks, setCardDoubleClicks] = createSignal(0);
	const [submits, setSubmits] = createSignal(0);

	return (
		<div class='scenario-demos'>
			<div class='scenario' data-scenario='b' style={{ 'pointer-events': 'none' }}>
				<span>(б) предок с pointer-events: none; сам инициатор включён обратно</span>
				<Popover.Root>
					<Popover.Trigger data-scenario-trigger style={{ 'pointer-events': 'auto' }}>
						Инициатор под pointer-events: none
					</Popover.Trigger>
					<Popover.Content>
						<PanelBody onPress={() => setPressed((count) => count + 1)}/>
					</Popover.Content>
				</Popover.Root>
				<output data-counter='b-pressed'>нажатий кнопки в панели: {pressed()}</output>
			</div>

			<label class='scenario' data-scenario='c-label'>
				<span>(в) Popover внутри label: клик по содержимому панели не переключает флажок</span>
				<input type='checkbox' data-label-input/>
				<Popover.Root>
					<Popover.Trigger data-scenario-trigger>Панель внутри label</Popover.Trigger>
					<Popover.Content>
						<PanelBody/>
					</Popover.Content>
				</Popover.Root>
			</label>

			<div
				class='scenario'
				data-scenario='c-card'
				onClick={() => setCardClicks((count) => count + 1)}
				onDblClick={() => setCardDoubleClicks((count) => count + 1)}
			>
				<span>(в) Popover внутри кликабельной карточки: клик и двойной клик по панели карточку не задевают</span>
				<Popover.Root>
					<Popover.Trigger data-scenario-trigger>Панель внутри карточки</Popover.Trigger>
					<Popover.Content>
						<PanelBody/>
					</Popover.Content>
				</Popover.Root>
				<output data-counter='c-card'>
					клики карточки: <span data-counter='c-card-clicks'>{cardClicks()}</span>, двойные:
					<span data-counter='c-card-double'>{cardDoubleClicks()}</span>
				</output>
			</div>

			<form
				class='scenario'
				data-scenario='c-form'
				onSubmit={(event) => {
					event.preventDefault();
					setSubmits((count) => count + 1);
				}}
			>
				<span>(в) Popover внутри form: Enter в поле панели не отправляет чужую форму</span>
				<Popover.Root>
					<Popover.Trigger data-scenario-trigger>Панель внутри формы</Popover.Trigger>
					<Popover.Content>
						<Input data-panel-input aria-label='Поле в панели формы' placeholder='Нажмите Enter'/>
					</Popover.Content>
				</Popover.Root>
				<output data-counter='c-submits'>отправок формы: <span data-counter='c-submits-count'>{submits()}</span></output>
			</form>

			<div class='clippers'>
				<For each={CLIPPERS}>
					{([name, style]) => (
						<div class='clipper' data-scenario={`d-${name}`} style={style}>
							<span>(д) {name}</span>
							<Popover.Root>
								<Popover.Trigger data-scenario-trigger>Панель из {name}</Popover.Trigger>
								<Popover.Content style={{ 'min-block-size': '140px' }}>
									<PanelBody/>
								</Popover.Content>
							</Popover.Root>
						</div>
					)}
				</For>
			</div>

			<table class='cell-table'>
				<tbody>
					<tr>
						<td data-scenario='a-cell'>
							<ContextMenu.Root>
								<ContextMenu.Trigger data-scenario-area>
									Ячейка: text-align right, nowrap, overflow hidden
								</ContextMenu.Trigger>
								<ContextMenu.Content data-scenario-menu aria-label='Меню ячейки'>
									<ContextMenu.Item>Скопировать значение ячейки целиком</ContextMenu.Item>
									<ContextMenu.Item>Фильтровать по значению</ContextMenu.Item>
								</ContextMenu.Content>
							</ContextMenu.Root>
						</td>
					</tr>
				</tbody>
			</table>
		</div>
	);
}
