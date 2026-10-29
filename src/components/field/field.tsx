import styles from './field.module.css';

import { children, createUniqueId, type JSX, Show, splitProps } from 'solid-js';

export type FieldSize = 'sm' | 'md' | 'lg';

/** Атрибуты, которые Field передаёт контролу: контракт для всех контролов значений. */
export interface FieldControlProps {
	readonly id: string;
	readonly 'aria-describedby': string | undefined;
	readonly 'aria-invalid': true | undefined;
}

export interface FieldProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'class' | 'style' | 'children' | 'id'> {
	label: JSX.Element;
	hint?: JSX.Element | undefined;
	/** Наличие содержимого означает «поле с ошибкой»; ошибка показывается вместо подсказки. */
	error?: JSX.Element | undefined;
	/** id контрола; по умолчанию уникальный. */
	id?: string | undefined;
	size?: FieldSize | undefined;
	class?: string | undefined;
	style?: JSX.CSSProperties | undefined;
	children: (control: FieldControlProps) => JSX.Element;
}

// «пусто»: undefined, null, false и пустая строка (в том числе внутри массива)
function isPresent(resolved: unknown): boolean {
	const items = Array.isArray(resolved) ? resolved : [resolved];
	return items.some((item) => item !== undefined && item !== null && item !== false && item !== '');
}

export function Field(props: FieldProps): JSX.Element {
	const [local, rest] = splitProps(props, ['label', 'hint', 'error', 'id', 'size', 'class', 'style', 'children']);
	const generatedId = createUniqueId();
	const controlId = (): string => local.id ?? generatedId;
	const hintId = (): string => `${controlId()}-hint`;
	const errorId = (): string => `${controlId()}-error`;

	// children() вычисляет JSX один раз: повторное чтение пропса создало бы элемент заново
	const hint = children(() => local.hint);
	const error = children(() => local.error);
	const hasError = (): boolean => isPresent(error());
	const hasHint = (): boolean => !hasError() && isPresent(hint());

	// геттеры: {...control} остаётся реактивным, когда ошибка появляется и пропадает
	const control: FieldControlProps = {
		get id() {
			return controlId();
		},
		get 'aria-describedby'() {
			if (hasError()) {
				return errorId();
			}
			return hasHint() ? hintId() : undefined;
		},
		get 'aria-invalid'() {
			return hasError() ? true : undefined;
		}
	};

	return (
		<div
			{...rest}
			data-s-kit
			data-s-kit-size={local.size}
			data-invalid={hasError() ? '' : undefined}
			class={local.class ? `${styles['root']} ${local.class}` : styles['root']}
			style={local.style}
		>
			<label for={controlId()} class={styles['label']}>{local.label}</label>
			{local.children(control)}
			<Show when={hasError()}>
				<div id={errorId()} class={styles['message']}>{error()}</div>
			</Show>
			<Show when={hasHint()}>
				<div id={hintId()} class={styles['message']}>{hint()}</div>
			</Show>
		</div>
	);
}
