import styles from './time-picker.module.css';

import { createEffect, createMemo, createSignal, type JSX, on, splitProps } from 'solid-js';

import { PickerField } from '../../internal/picker-field/picker-field';
import { createControllableSignal } from '../../utils/create-controllable-signal';
import { compareTimes } from '../../utils/time/compare-times';
import { formatIsoTime } from '../../utils/time/format-iso-time';
import { formatTimeText } from '../../utils/time/format-time-text';
import { isTimeAllowed } from '../../utils/time/is-time-allowed';
import { parseTimeText } from '../../utils/time/parse-time-text';
import { readTimeProp } from '../../utils/time/read-time-prop';
import type { TimeParts } from '../../utils/time/time-parts';
import { timePattern } from '../../utils/time/time-pattern';

import { DEFAULT_TIME_PICKER_LABELS } from './default-time-picker-labels';
import { TimeColumns } from './time-columns';
import { TimePickerIcon } from './time-picker-icon';
import type { TimePickerProps } from './time-picker-props';
import { timePlaceholder } from './time-placeholder';

const DEFAULT_LOCALE = 'ru';

interface TimeRange {
	min?: TimeParts | undefined;
	max?: TimeParts | undefined;
}

/**
 * Поле времени (спек TimePicker): текст по образцу локали, значок часов и колонки часов и минут в панели. Клик по полю и клик
 * по значку открывают панель. Набранный текст принимается по Enter и при уходе из поля; колонки показывают набранное сразу.
 */
export function TimePicker(props: TimePickerProps): JSX.Element {
	const [local, rest] = splitProps(props, [
		'value', 'defaultValue', 'onValueChange', 'open', 'defaultOpen', 'onOpenChange', 'min', 'max', 'isTimeDisabled', 'minuteStep',
		'locale', 'hour12', 'showNow', 'placeholder', 'labels', 'size', 'class'
	]);

	const locale = (): string => local.locale ?? DEFAULT_LOCALE;
	const pattern = createMemo(() => timePattern(locale(), local.hour12));
	const labels = createMemo(() => ({ ...DEFAULT_TIME_PICKER_LABELS, ...local.labels }));
	const range = createMemo<TimeRange>(() => {
		const min = readTimeProp('TimePicker', 'min', local.min);
		const max = readTimeProp('TimePicker', 'max', local.max);
		if (min && max && compareTimes(min, max) > 0) {
			if (import.meta.env.DEV) {
				console.warn(`[solid-kit] TimePicker: min "${local.min}" is later than max "${local.max}", both are ignored.`);
			}
			return {};
		}
		return { min, max };
	});

	const [valueIso, setValueIso] = createControllableSignal<string | null>({
		name: 'TimePicker',
		value: () => local.value,
		defaultValue: () => local.defaultValue ?? null,
		onChange: (next) => local.onValueChange?.(next)
	});
	const selected = createMemo(() => readTimeProp('TimePicker', 'value', valueIso()) ?? null);
	const [open, setOpen] = createControllableSignal<boolean>({
		name: 'TimePicker',
		value: () => local.open,
		defaultValue: () => local.defaultOpen ?? false,
		onChange: (next) => local.onOpenChange?.(next)
	});

	const valueText = (): string => {
		const parts = selected();
		return parts ? formatTimeText(parts, locale(), local.hour12) : '';
	};
	const [text, setText] = createSignal(valueText());
	// набираемый текст не затирается внешним изменением значения, пока пользователь печатает
	let dirty = false;

	const syncText = (): void => {
		dirty = false;
		setText(valueText());
	};
	createEffect(on([valueIso, locale, () => local.hour12], () => {
		if (!dirty) {
			syncText();
		}
	}, { defer: true }));

	const allowed = (parts: TimeParts): boolean => isTimeAllowed(parts, range().min, range().max, local.isTimeDisabled);
	const typedTime = (source: string): TimeParts | null => {
		const parts = parseTimeText(source, locale(), local.hour12);
		return parts && allowed(parts) ? parts : null;
	};
	// набранное допустимое время колонки показывают сразу, значение при этом не меняется
	const highlighted = createMemo(() => typedTime(text()));

	const accept = (next: string | null): void => {
		if (next !== valueIso()) {
			setValueIso(next);
		}
		syncText();
	};

	const handleTextChange = (next: string): void => {
		dirty = true;
		setText(next);
	};
	const commit = (source: string): void => {
		if (!dirty) {
			return;
		}
		if (source.trim() === '') {
			accept(null);
			return;
		}
		const parts = typedTime(source);
		if (parts) {
			accept(formatIsoTime(parts));
		}
		else {
			syncText();
		}
	};

	return (
		<PickerField
			{...rest}
			class={`${styles['root']}${pattern().hour12 ? ` ${styles['hour12']}` : ''}${local.class ? ` ${local.class}` : ''}`}
			size={local.size}
			text={text()}
			onTextChange={handleTextChange}
			onCommit={commit}
			onRevert={syncText}
			open={open()}
			onOpenChange={setOpen}
			panelTab='move'
			icon={<TimePickerIcon/>}
			openLabel={labels().openPicker}
			panelLabel={labels().panel}
			clearLabel={labels().clear}
			onClear={() => {
				accept(null);
			}}
			hiddenValue={valueIso() ?? ''}
			placeholder={local.placeholder ?? timePlaceholder(locale(), local.hour12, labels())}
		>
			{(panel) => (
				<TimeColumns
					value={selected()}
					highlighted={highlighted()}
					onChange={(time) => {
						accept(formatIsoTime(time));
					}}
					onFinish={panel.close}
					hour12={pattern().hour12}
					minuteStep={local.minuteStep ?? 1}
					min={range().min}
					max={range().max}
					isTimeDisabled={local.isTimeDisabled}
					showNow={local.showNow !== false}
					periodNames={[pattern().am, pattern().pm]}
					labels={labels()}
					size={local.size}
				/>
			)}
		</PickerField>
	);
}
