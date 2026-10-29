import { Field } from '@stark/solid-kit/field';
import { Input } from '@stark/solid-kit/input';
import type { JSX } from 'solid-js';

/** Два Field вокруг Input: с подсказкой (md по умолчанию) и с ошибкой (обёртка sm). */
export function DemoFields(): JSX.Element {
	return (
		<div class='field-demos'>
			<Field label='Имя' hint='Как в паспорте' data-field-demo='hint'>
				{(control) => <Input {...control} placeholder='Анна'/>}
			</Field>
			<Field label='Почта' error='Введите адрес в формате name@example.com' size='sm' data-field-demo='error'>
				{(control) => <Input {...control} defaultValue='anna'/>}
			</Field>
		</div>
	);
}
