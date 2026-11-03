import styles from './date-picker.module.css';

import { createComputed, createEffect, createMemo, createSignal, type JSX, on, splitProps } from 'solid-js';

import { PickerField } from '../../internal/picker-field/picker-field';
import { createControllableSignal } from '../../utils/create-controllable-signal';
import type { DateParts } from '../../utils/date/date-parts';
import { formatDateText } from '../../utils/date/format-date-text';
import { formatIsoDate } from '../../utils/date/format-iso-date';
import { isDateAllowed } from '../../utils/date/is-date-allowed';
import { parseDateText } from '../../utils/date/parse-date-text';
import { readDateProp } from '../../utils/date/read-date-prop';
import { todayIso } from '../../utils/date/today-iso';
import { Calendar } from '../calendar';

import { DatePickerIcon } from './date-picker-icon';
import type { DatePickerProps } from './date-picker-props';
import { datePlaceholder } from './date-placeholder';
import { DEFAULT_DATE_PICKER_LABELS } from './default-date-picker-labels';

const DEFAULT_LOCALE = 'ru';

/**
 * Поле даты (спек DatePicker): текст по образцу локали, значок и календарь в панели. Клик по полю и клик по значку открывают
 * календарь. Набранный текст принимается по Enter и при уходе из поля; календарь показывает набранное сразу.
 */
export function DatePicker(props: DatePickerProps): JSX.Element {
	const [local, rest] = splitProps(props, [
		'value', 'defaultValue', 'onValueChange', 'open', 'defaultOpen', 'onOpenChange', 'min', 'max', 'isDateDisabled', 'locale',
		'firstDayOfWeek', 'selectOnToday', 'placeholder', 'labels', 'calendarLabels', 'size', 'class'
	]);

	const locale = (): string => local.locale ?? DEFAULT_LOCALE;
	const labels = createMemo(() => ({ ...DEFAULT_DATE_PICKER_LABELS, ...local.labels }));
	const min = createMemo(() => readDateProp('DatePicker', 'min', local.min));
	const max = createMemo(() => readDateProp('DatePicker', 'max', local.max));

	const [valueIso, setValueIso] = createControllableSignal<string | null>({
		name: 'DatePicker',
		value: () => local.value,
		defaultValue: () => local.defaultValue ?? null,
		onChange: (next) => local.onValueChange?.(next)
	});
	const selected = createMemo(() => readDateProp('DatePicker', 'value', valueIso()) ?? null);
	const [open, setOpen] = createControllableSignal<boolean>({
		name: 'DatePicker',
		value: () => local.open,
		defaultValue: () => local.defaultOpen ?? false,
		onChange: (next) => local.onOpenChange?.(next)
	});

	const valueText = (): string => {
		const parts = selected();
		return parts ? formatDateText(parts, locale()) : '';
	};
	const [text, setText] = createSignal(valueText());
	// набираемый текст не затирается внешним изменением значения, пока пользователь печатает
	let dirty = false;

	const syncText = (): void => {
		dirty = false;
		setText(valueText());
	};
	createEffect(on([valueIso, locale], () => {
		if (!dirty) {
			syncText();
		}
	}, { defer: true }));

	const allowed = (parts: DateParts): boolean => isDateAllowed(parts, min(), max(), local.isDateDisabled);
	const typedDate = (source: string): DateParts | null => {
		const parts = parseDateText(source, locale());
		return parts && allowed(parts) ? parts : null;
	};

	const [focused, setFocused] = createSignal(todayIso());
	// фокус календаря при открытии: набранная допустимая дата, иначе выбранная, иначе сегодня (вычисляется до рендера панели)
	createComputed(on(open, (isOpen) => {
		if (isOpen) {
			const parts = typedDate(text()) ?? selected();
			setFocused(parts ? formatIsoDate(parts) : todayIso());
		}
	}));

	const accept = (next: string | null): void => {
		if (next !== valueIso()) {
			setValueIso(next);
		}
		syncText();
	};

	const handleTextChange = (next: string): void => {
		dirty = true;
		setText(next);
		const parts = typedDate(next);
		if (parts) {
			setFocused(formatIsoDate(parts));
		}
	};
	const commit = (source: string): void => {
		if (!dirty) {
			return;
		}
		if (source.trim() === '') {
			accept(null);
			return;
		}
		const parts = typedDate(source);
		if (parts) {
			accept(formatIsoDate(parts));
		}
		else {
			syncText();
		}
	};

	return (
		<PickerField
			{...rest}
			class={local.class ? `${styles['root']} ${local.class}` : styles['root']}
			size={local.size}
			text={text()}
			onTextChange={handleTextChange}
			onCommit={commit}
			onRevert={syncText}
			open={open()}
			onOpenChange={setOpen}
			icon={<DatePickerIcon/>}
			openLabel={labels().openCalendar}
			panelLabel={labels().calendar}
			clearLabel={labels().clear}
			onClear={() => {
				accept(null);
			}}
			hiddenValue={valueIso() ?? ''}
			placeholder={local.placeholder ?? datePlaceholder(locale(), labels())}
		>
			{(panel) => (
				<Calendar
					value={valueIso()}
					onValueChange={(next) => {
						accept(next);
						panel.close();
					}}
					focusedDate={focused()}
					onFocusedDateChange={setFocused}
					min={local.min}
					max={local.max}
					isDateDisabled={local.isDateDisabled}
					locale={locale()}
					firstDayOfWeek={local.firstDayOfWeek}
					selectOnToday={local.selectOnToday}
					size={local.size}
					labels={local.calendarLabels}
				/>
			)}
		</PickerField>
	);
}
