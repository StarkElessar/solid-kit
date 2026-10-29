import { NumericInput } from '@stark/solid-kit/numeric-input';
import { createSignal, type JSX } from 'solid-js';

/** Поля для проверок в numeric-input-checks.ts и для ручной проверки клавиш: диапазон, дробный шаг, ошибка, недоступное. */
export function DemoNumericInputs(): JSX.Element {
	const [price, setPrice] = createSignal<number | null>(12.5);
	return (
		<div class='numeric-input-demos'>
			<NumericInput data-numeric-demo='plain' aria-label='Количество' defaultValue={3}/>
			<NumericInput data-numeric-demo='range' aria-label='От 0 до 10' min={0} max={10} defaultValue={5}/>
			<NumericInput
				data-numeric-demo='decimal'
				aria-label='Цена'
				step={0.5}
				value={price()}
				onValueChange={(next) => setPrice(next)}
			/>
			<output data-numeric-live>Цена: {price() ?? 'пусто'}</output>
			<NumericInput data-numeric-demo='invalid' aria-label='С ошибкой' aria-invalid='true' max={10} defaultValue={99}/>
			<NumericInput aria-label='Недоступное' disabled defaultValue={1}/>
		</div>
	);
}
