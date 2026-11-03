import styles from './time-columns.module.css';

import { createComputed, createMemo, createSignal, type JSX, Show } from 'solid-js';

import { floorToStep } from '../../utils/time/floor-to-step';
import { isTimeAllowed } from '../../utils/time/is-time-allowed';
import { nowTime } from '../../utils/time/now-time';
import type { TimeParts } from '../../utils/time/time-parts';
import { Button } from '../button';

import { handleTimeColumnsKeyDown } from './handle-time-columns-key-down';
import { TimeColumn } from './time-column';
import type { TimeColumnId } from './time-column-id';
import type { TimeColumnsProps } from './time-columns-props';
import { hour24Of, hourRows, minuteRows, nearestAllowedId, resolveHour } from './time-columns-state';
import type { TimeLimits } from './time-limits';
import type { TimeRow } from './time-row';

const PERIOD_IDS: readonly [0, 1] = [0, 1];

/**
 * Панель выбора времени (спек TimePicker, раздел 5): колонки часов и минут (в 12-часовом виде ещё период) и «Сейчас».
 * Каждый выбор строки даёт целое время через `onChange`; выбор в последней колонке и «Сейчас» сообщают `onFinish`.
 * Стрелки двигают только фокус, значение меняют Enter, Space и клик.
 */
export function TimeColumns(props: TimeColumnsProps): JSX.Element {
	let root: HTMLDivElement | undefined;
	const initial = nowTime();

	const limits = createMemo<TimeLimits>(() => ({
		min: props.min,
		max: props.max,
		isDisabled: props.isTimeDisabled,
		step: props.minuteStep
	}));
	const hours = createMemo(() => hourRows(props.hour12));
	const minutes = createMemo(() => minuteRows(props.minuteStep));
	const periods = createMemo<TimeRow[]>(() => PERIOD_IDS.map((id) => ({ id, label: props.periodNames[id] })));
	const columns = createMemo<TimeColumnId[]>(() => (props.hour12 ? ['hour', 'minute', 'period'] : ['hour', 'minute']));
	const rowsOf = (column: TimeColumnId): readonly TimeRow[] => {
		if (column === 'hour') {
			return hours();
		}
		return column === 'minute' ? minutes() : periods();
	};

	const hourId = (time: TimeParts): number => (props.hour12 ? time.hour % 12 : time.hour);
	const periodId = (time: TimeParts): 0 | 1 => (time.hour >= 12 ? 1 : 0);
	// от чего отсчитываются прокрутка и фокус: набранное, иначе выбранное, иначе текущее время
	const base = createMemo(() => props.highlighted ?? props.value ?? initial);

	// начальные значения ставит createComputed ниже, до первой отрисовки
	const [focusHour, setFocusHour] = createSignal(0);
	const [focusMinute, setFocusMinute] = createSignal(0);
	const [focusPeriod, setFocusPeriod] = createSignal(0);
	createComputed(() => {
		const time = base();
		setFocusHour(hourId(time));
		setFocusMinute(floorToStep(time.minute, props.minuteStep));
		setFocusPeriod(periodId(time));
	});

	const currentHour = (): number => props.value?.hour ?? 0;
	const currentMinute = (): number => props.value?.minute ?? 0;
	const currentPeriod = (): 0 | 1 => (props.value ? periodId(props.value) : 0);

	const isHourAllowed = (id: number): boolean => {
		return resolveHour(hour24Of(id, props.hour12, currentPeriod()), currentMinute(), limits()) !== null;
	};
	const isMinuteAllowed = (id: number): boolean => {
		return isTimeAllowed({ hour: currentHour(), minute: id }, props.min, props.max, props.isTimeDisabled);
	};
	const isPeriodAllowed = (id: number): boolean => {
		return resolveHour((currentHour() % 12) + 12 * id, currentMinute(), limits()) !== null;
	};
	const allowedIn: Record<TimeColumnId, (id: number) => boolean> = {
		hour: isHourAllowed,
		minute: isMinuteAllowed,
		period: isPeriodAllowed
	};
	const isAllowed = (column: TimeColumnId, id: number): boolean => allowedIn[column](id);
	const focusIdOf = (column: TimeColumnId): number => {
		if (column === 'hour') {
			return focusHour();
		}
		return column === 'minute' ? focusMinute() : focusPeriod();
	};
	const rovingId = (column: TimeColumnId): number => nearestAllowedId(rowsOf(column), focusIdOf(column), allowedIn[column]);
	const setFocusId = (column: TimeColumnId, id: number): void => {
		if (column === 'hour') {
			setFocusHour(id);
		}
		else if (column === 'minute') {
			setFocusMinute(id);
		}
		else {
			setFocusPeriod(id);
		}
	};

	const focusColumn = (column: TimeColumnId): void => {
		queueMicrotask(() => {
			root?.querySelector<HTMLElement>(`[data-time-column="${column}"] [tabindex="0"]`)?.focus();
		});
	};
	// выбор мышью оставляет фокус в поле (печать не прерывается), выбор с клавиатуры ведёт к следующей колонке
	const advanceTo = (column: TimeColumnId): void => {
		if (root?.contains(document.activeElement)) {
			focusColumn(column);
		}
	};

	const pickHour = (id: number): void => {
		const time = resolveHour(hour24Of(id, props.hour12, currentPeriod()), currentMinute(), limits());
		if (!time) {
			return;
		}
		setFocusHour(id);
		props.onChange(time);
		advanceTo('minute');
	};
	const pickMinute = (minute: number): void => {
		const time = { hour: currentHour(), minute };
		if (!isMinuteAllowed(minute)) {
			return;
		}
		setFocusMinute(minute);
		props.onChange(time);
		if (props.hour12) {
			advanceTo('period');
		}
		else {
			props.onFinish();
		}
	};
	const pickPeriod = (id: number): void => {
		const time = resolveHour((currentHour() % 12) + 12 * id, currentMinute(), limits());
		if (!time) {
			return;
		}
		setFocusPeriod(id);
		props.onChange(time);
		props.onFinish();
	};

	const nowParts = (): TimeParts => {
		const now = nowTime();
		return { hour: now.hour, minute: floorToStep(now.minute, props.minuteStep) };
	};
	const nowAllowed = (): boolean => isTimeAllowed(nowParts(), props.min, props.max, props.isTimeDisabled);
	const pickNow = (): void => {
		const time = nowParts();
		if (isTimeAllowed(time, props.min, props.max, props.isTimeDisabled)) {
			props.onChange(time);
			props.onFinish();
		}
	};

	const selectedHour = (): number | null => (props.value ? hourId(props.value) : null);
	const selectedMinute = (): number | null => props.value?.minute ?? null;
	const selectedPeriod = (): number | null => (props.value ? periodId(props.value) : null);
	const highlightedHour = (): number | null => (props.highlighted ? hourId(props.highlighted) : null);
	const highlightedMinute = (): number | null => props.highlighted?.minute ?? null;

	return (
		<div
			ref={root}
			data-s-kit
			data-s-kit-size={props.size}
			data-s-kit-focus-inset
			class={props.class ? `${styles['root']} ${props.class}` : styles['root']}
			style={props.style}
			onKeyDown={(event) => {
				handleTimeColumnsKeyDown(event, {
					columns,
					rows: rowsOf,
					focusId: rovingId,
					isAllowed,
					setFocusId,
					focusColumn
				});
			}}
		>
			<div class={styles['columns']}>
				<TimeColumn
					id='hour'
					label={props.labels.hours}
					rows={hours()}
					selectedId={selectedHour()}
					highlightedId={highlightedHour()}
					focusId={rovingId('hour')}
					anchorId={hourId(base())}
					isAllowed={isHourAllowed}
					focusTarget
					onPick={pickHour}
				/>
				<TimeColumn
					id='minute'
					label={props.labels.minutes}
					rows={minutes()}
					selectedId={selectedMinute()}
					highlightedId={highlightedMinute()}
					focusId={rovingId('minute')}
					anchorId={floorToStep(base().minute, props.minuteStep)}
					isAllowed={isMinuteAllowed}
					focusTarget={false}
					onPick={pickMinute}
				/>
				<Show when={props.hour12}>
					<TimeColumn
						id='period'
						label={props.labels.period}
						rows={periods()}
						selectedId={selectedPeriod()}
						highlightedId={null}
						focusId={rovingId('period')}
						anchorId={null}
						isAllowed={isPeriodAllowed}
						focusTarget={false}
						onPick={pickPeriod}
					/>
				</Show>
			</div>
			<Show when={props.showNow}>
				<div class={styles['footer']}>
					<Button variant='tinted' disabled={!nowAllowed()} onClick={pickNow}>
						{props.labels.now}
					</Button>
				</div>
			</Show>
		</div>
	);
}
