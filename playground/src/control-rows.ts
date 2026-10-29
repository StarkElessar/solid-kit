export type ControlSize = 'sm' | 'md' | 'lg';

export const CONTROL_SIZES: readonly ControlSize[] = ['sm', 'md', 'lg'];

export interface RowSpec {
	readonly id: string;
	readonly title: string;
	/** Размер на обёртке ряда (`data-s-kit-size`); без него атрибута нет. */
	readonly wrapperSize?: ControlSize;
	/** Локальный `size` контрола с данным номером; `undefined`: проп не передаётся. */
	readonly sizeFor: (index: number) => ControlSize | undefined;
}

/** Пять рядов раздела 5 зонтичного спека. */
export const ROWS: readonly RowSpec[] = [
	{ id: 'row-1', title: '1. Без size и без обёртки (фолбэк на md)', sizeFor: () => undefined },
	{ id: 'row-2', title: '2. Обёртка sm, у контролов size нет', wrapperSize: 'sm', sizeFor: () => undefined },
	{ id: 'row-3', title: '3. Обёртка lg, у контролов size нет', wrapperSize: 'lg', sizeFor: () => undefined },
	{
		id: 'row-4',
		title: '4. Обёртка sm, у части контролов локально size="lg"',
		wrapperSize: 'sm',
		sizeFor: (index) => (index % 2 === 1 ? 'lg' : undefined)
	},
	{ id: 'row-5', title: '5. Явный size у каждого контрола', sizeFor: (index) => CONTROL_SIZES[index % CONTROL_SIZES.length] }
];
