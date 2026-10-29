import { createSignal, For, type JSX, onCleanup, onMount } from 'solid-js';
import { Dynamic } from 'solid-js/web';

import { ControlsRowPage } from './controls-row-page';
import { ThemesPage } from './themes-page';

const PAGE_IDS = ['themes', 'controls-row'] as const;

type PageId = (typeof PAGE_IDS)[number];

const PAGES: Record<PageId, { readonly title: string; readonly component: () => JSX.Element }> = {
	themes: { title: 'Темы', component: ThemesPage },
	'controls-row': { title: 'Контролы в ряд', component: ControlsRowPage }
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
