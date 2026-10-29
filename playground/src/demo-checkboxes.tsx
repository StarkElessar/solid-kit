import { Checkbox } from '@stark/solid-kit/checkbox';
import type { JSX } from 'solid-js';

/** Четыре состояния для проверок в checkbox-checks.ts плюс недоступный флажок. */
export function DemoCheckboxes(): JSX.Element {
	return (
		<div class='checkbox-demos'>
			<Checkbox data-checkbox-demo='unchecked'>Не выбран</Checkbox>
			<Checkbox data-checkbox-demo='checked' defaultChecked>Выбран</Checkbox>
			<Checkbox data-checkbox-demo='indeterminate' indeterminate>Частично</Checkbox>
			<Checkbox data-checkbox-demo='invalid' aria-invalid={true}>С ошибкой</Checkbox>
			<Checkbox disabled defaultChecked>Недоступен</Checkbox>
		</div>
	);
}
