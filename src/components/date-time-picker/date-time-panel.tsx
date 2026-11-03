import styles from './date-time-picker.module.css';

import { type JSX, Show } from 'solid-js';

import { formatIsoDate } from '../../utils/date/format-iso-date';
import { parseIsoDate } from '../../utils/date/parse-iso-date';
import { Button } from '../button';
import { Calendar } from '../calendar';
import { TimeColumns } from '../time-picker/time-columns';

import type { DateTimePanelProps } from './date-time-panel-props';

/**
 * Панель DateTimePicker (спек DateTimePicker, раздел 5): календарь и колонки времени в ряд и общий подвал «Сейчас».
 * Только раскладка: что выбрано и что допустимо, решает DateTimePicker.
 */
export function DateTimePanel(props: DateTimePanelProps): JSX.Element {
	const selectedDateIso = (): string | null => (props.value ? formatIsoDate(props.value.date) : null);

	return (
		<div class={styles['panel']} data-s-kit data-s-kit-size={props.size} data-s-kit-focus-inset>
			<div class={styles['content']}>
				<Calendar
					value={selectedDateIso()}
					onValueChange={(next) => {
						const date = next === null ? null : parseIsoDate(next);
						if (date) {
							props.onDateSelect(date);
						}
					}}
					focusedDate={props.focusedDate}
					onFocusedDateChange={props.onFocusedDateChange}
					min={props.minDate}
					max={props.maxDate}
					isDateDisabled={props.isDateDisabled}
					locale={props.locale}
					firstDayOfWeek={props.firstDayOfWeek}
					showToday={false}
					size={props.size}
					labels={props.calendarLabels}
				/>
				<TimeColumns
					class={styles['time']}
					value={props.value?.time ?? null}
					highlighted={props.highlightedTime}
					onChange={props.onTimeSelect}
					onFinish={props.onFinish}
					hour12={props.hour12}
					minuteStep={props.minuteStep}
					min={props.minTime}
					max={props.maxTime}
					isTimeDisabled={props.isTimeDisabled}
					showNow={false}
					periodNames={props.periodNames}
					labels={props.labels}
					size={props.size}
				/>
			</div>
			<Show when={props.showNow}>
				<div class={styles['footer']}>
					<Button variant='tinted' disabled={!props.nowAllowed} onClick={props.onNow}>
						{props.labels.now}
					</Button>
				</div>
			</Show>
		</div>
	);
}
