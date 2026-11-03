import { createSignal, For, type JSX, onCleanup, onMount } from 'solid-js';
import { Dynamic } from 'solid-js/web';

import { CalendarPage } from './calendar-page';
import { ControlsRowPage } from './controls-row-page';
import { DatePickerPage } from './date-picker-page';
import { DateTimePickerPage } from './date-time-picker-page';
import { GridPage } from './grid-page';
import { ListsPage } from './lists-page';
import { PanelsPage } from './panels-page';
import { ThemesPage } from './themes-page';
import { TimePickerPage } from './time-picker-page';

const PAGE_IDS = [
	'themes', 'controls-row', 'panels', 'lists', 'grid', 'calendar', 'date-picker', 'time-picker', 'date-time-picker'
] as const;

type PageId = (typeof PAGE_IDS)[number];

const PAGES: Record<PageId, { readonly title: string; readonly component: () => JSX.Element }> = {
	themes: { title: 'Темы', component: ThemesPage },
	'controls-row': { title: 'Контролы в ряд', component: ControlsRowPage },
	panels: { title: 'Панели', component: PanelsPage },
	lists: { title: 'Списки', component: ListsPage },
	grid: { title: 'Грид', component: GridPage },
	calendar: { title: 'Календарь', component: CalendarPage },
	'date-picker': { title: 'Выбор даты', component: DatePickerPage },
	'time-picker': { title: 'Выбор времени', component: TimePickerPage },
	'date-time-picker': { title: 'Выбор даты и времени', component: DateTimePickerPage }
};

function readHash(): PageId {
	const id = window.location.hash.slice(1);
	return PAGE_IDS.find((candidate) => candidate === id) ?? 'themes';
}

export function App(): JSX.Element {
	const [page, setPage] = createSignal<PageId>(readHash());

	onMount(() => {
		const update = (): void => {
			setPage(readHash());
		};
		window.addEventListener('hashchange', update);
		onCleanup(() => {
			window.removeEventListener('hashchange', update);
		});
	});

	return (
		<>
			<nav class='nav'>
				<For each={PAGE_IDS}>
					{(id) => (
						<a href={`#${id}`} aria-current={page() === id ? 'page' : undefined}>
							{PAGES[id].title}
						</a>
					)}
				</For>
			</nav>
			<Dynamic component={PAGES[page()].component}/>
		</>
	);
}
