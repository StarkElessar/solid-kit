import { RadioGroup } from '@stark/solid-kit/radio-group';
import type { JSX } from 'solid-js';

/** Вертикальная группа с выбором, группа с ошибкой и недоступная группа для проверок в radio-checks.ts. */
export function DemoRadioGroups(): JSX.Element {
	return (
		<div class='radio-demos'>
			<RadioGroup.Root data-radio-group aria-label='Тариф' defaultValue='pro'>
				<RadioGroup.Item value='basic' data-radio-demo='unchecked'>Базовый</RadioGroup.Item>
				<RadioGroup.Item value='pro' data-radio-demo='checked'>Расширенный</RadioGroup.Item>
				<RadioGroup.Item value='max'>Максимальный</RadioGroup.Item>
			</RadioGroup.Root>
			<RadioGroup.Root data-radio-group aria-label='Группа с ошибкой' aria-invalid={true}>
				<RadioGroup.Item value='yes' data-radio-demo='invalid'>Да</RadioGroup.Item>
				<RadioGroup.Item value='no'>Нет</RadioGroup.Item>
			</RadioGroup.Root>
			<RadioGroup.Root aria-label='Недоступная группа' disabled defaultValue='a'>
				<RadioGroup.Item value='a'>Недоступен</RadioGroup.Item>
				<RadioGroup.Item value='b'>Тоже недоступен</RadioGroup.Item>
			</RadioGroup.Root>
		</div>
	);
}
