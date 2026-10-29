import { type Accessor, createSignal } from 'solid-js';

export interface ControllableSignalOptions<T> {
	/** Имя компонента для предупреждений в dev-сборке. */
	name: string;
	/** Контролируемое значение из пропсов; `undefined` означает «не контролируется». */
	value: () => T | undefined;
	/** Начальное значение неконтролируемого режима. */
	defaultValue: () => T;
	onChange?: ((next: T) => void) | undefined;
}

/**
 * Общий хелпер controlled/uncontrolled. Режим фиксируется при первом вычислении:
 * переходы между режимами не поддерживаются и предупреждают в dev-сборке (раздел 7 спека).
 */
export function createControllableSignal<T>(options: ControllableSignalOptions<T>): [get: Accessor<T>, set: (next: T) => void] {
	const initial = options.value();
	const controlled = initial !== undefined;
	const [internal, setInternal] = createSignal<T>(initial === undefined ? options.defaultValue() : initial);

	let lastControlled = initial;
	let warned = false;
	const warnOnce = (message: string): void => {
		if (!import.meta.env.DEV || warned) {
			return;
		}
		warned = true;
		console.warn(`[solid-kit] ${options.name}: ${message}`);
	};

	const get: Accessor<T> = () => {
		const current = options.value();
		if (controlled) {
			if (current !== undefined) {
				lastControlled = current;
				return current;
			}
			warnOnce('the value switched from controlled to uncontrolled; the last controlled value is kept.');
			return lastControlled as T;
		}
		if (current !== undefined) {
			warnOnce('a value appeared on an uncontrolled component and is ignored.');
		}
		return internal();
	};

	const set = (next: T): void => {
		if (!controlled) {
			setInternal(() => next);
		}
		options.onChange?.(next);
	};

	return [get, set];
}
