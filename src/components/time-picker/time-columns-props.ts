import type { JSX } from 'solid-js';

import type { TimeParts } from '../../utils/time/time-parts';

import type { TimeColumnsLabels } from './time-columns-labels';

export interface TimeColumnsProps {
	/** Выбранное время; `null` значит «не выбрано». */
	value: TimeParts | null;
	/** Набранное, но ещё не принятое время: колонки прокручиваются и подсвечивают его, значение не меняется. */
	highlighted?: TimeParts | null | undefined;
	/** Каждый выбор строки даёт целое время. */
	onChange: (time: TimeParts) => void;
	/** Выбор в последней колонке (минуты или период) и «Сейчас»: панель можно закрывать. */
	onFinish: () => void;

	hour12: boolean;
	minuteStep: number;
	min?: TimeParts | undefined;
	max?: TimeParts | undefined;
	isTimeDisabled?: ((time: string) => boolean) | undefined;

	showNow: boolean;
	/** Названия AM и PM для колонки периода. */
	periodNames: readonly [string, string];
	labels: TimeColumnsLabels;
	size?: 'sm' | 'md' | 'lg' | undefined;
	class?: string | undefined;
	style?: JSX.CSSProperties | undefined;
}
