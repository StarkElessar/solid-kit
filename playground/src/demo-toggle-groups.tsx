import { ToggleGroup } from '@stark/solid-kit/toggle-group';
import { createSignal, type JSX } from 'solid-js';

/** Два управляемых примера: щелчок мышью меняет значение, которое тут же показано текстом. Для проверок в toggle-group-checks.ts. */
export function DemoToggleGroups(): JSX.Element {
	const [single, setSingle] = createSignal<string | null>('week');
	const [multi, setMulti] = createSignal<readonly string[]>(['day', 'month']);

	return (
		<div class='toggle-demos'>
			<div class='toggle-demo'>
				<ToggleGroup.Root data-toggle-demo='single' aria-label='Один' value={single()} onValueChange={(next) => setSingle(next)}>
					<ToggleGroup.Item value='day'>День</ToggleGroup.Item>
					<ToggleGroup.Item value='week'>Неделя</ToggleGroup.Item>
					<ToggleGroup.Item value='month'>Месяц</ToggleGroup.Item>
				</ToggleGroup.Root>
				<output data-toggle-output='single'>single: {single() ?? 'ничего'}</output>
			</div>
			<div class='toggle-demo'>
				<ToggleGroup.Root
					data-toggle-demo='multi'
					aria-label='Несколько'
					mode='multi'
					value={multi()}
					onValueChange={(next) => setMulti(next)}
				>
					<ToggleGroup.Item value='day'>День</ToggleGroup.Item>
					<ToggleGroup.Item value='week'>Неделя</ToggleGroup.Item>
					<ToggleGroup.Item value='month'>Месяц</ToggleGroup.Item>
				</ToggleGroup.Root>
				<output data-toggle-output='multi'>multi: {multi().join(', ') || 'ничего'}</output>
			</div>
		</div>
	);
}
