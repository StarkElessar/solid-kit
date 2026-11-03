import { Calendar } from '@stark/solid-kit/calendar';
import { createSignal, type JSX } from 'solid-js';

/** «Сегодня» зафиксировано, чтобы проверки и ручная приёмка не зависели от даты запуска. */
const TODAY = '2026-11-02';

function isWeekend(date: string): boolean {
	const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
	return weekday === 0 || weekday === 6;
}

/** Размеры 28 / 32 / 40, месяцы из 4, 5 и 6 недель, controlled-пара, ограничения и календарь вплотную к обрезающему контейнеру. */
export function DemoCalendars(): JSX.Element {
	const [value, setValue] = createSignal<string | null>('2026-11-18');
	const [focused, setFocused] = createSignal('2026-11-18');

	return (
		<div class='calendar-demos'>
			<div class='calendar-row'>
				<div data-calendar-demo='size-sm'><Calendar today={TODAY} size='sm' defaultValue='2026-11-18'/></div>
				<div data-calendar-demo='size-md'><Calendar today={TODAY} size='md' defaultValue='2026-11-18'/></div>
				<div data-calendar-demo='size-lg'><Calendar today={TODAY} size='lg' defaultValue='2026-11-18'/></div>
			</div>

			<div class='calendar-row'>
				<div data-calendar-demo='weeks-4'><Calendar today={TODAY} defaultFocusedDate='2027-02-10'/></div>
				<div data-calendar-demo='weeks-5'><Calendar today={TODAY} defaultFocusedDate='2026-09-10'/></div>
				<div data-calendar-demo='weeks-6'><Calendar today={TODAY} defaultFocusedDate='2026-03-10'/></div>
			</div>

			<div class='calendar-row'>
				<div data-calendar-demo='controlled'>
					<Calendar
						today={TODAY}
						value={value()}
						onValueChange={setValue}
						focusedDate={focused()}
						onFocusedDateChange={setFocused}
					/>
					<p data-calendar-state>value = {value() ?? 'null'}, focusedDate = {focused()}</p>
				</div>
				<div data-calendar-demo='limits'>
					<Calendar today={TODAY} min='2026-11-05' max='2027-01-20' isDateDisabled={isWeekend} defaultValue='2026-11-18'/>
				</div>
				<figure data-calendar-demo='clip' class='calendar-clip-figure'>
					<div class='calendar-clip'>
						<Calendar today={TODAY} defaultValue='2026-11-18' style={{ '--s-kit-calendar-padding': '0px' }}/>
					</div>
					<figcaption>
						Стенд критерия 7: внешний отступ намеренно 0, контейнер обрезает; кольцо фокуса остаётся внутри ячейки.
					</figcaption>
				</figure>
			</div>
		</div>
	);
}
