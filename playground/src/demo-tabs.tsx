import { Tabs } from '@stark/solid-kit/tabs';
import { For, type JSX } from 'solid-js';

const SCROLL_TABS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

/** Обычные вкладки с недоступной и узкая полоса с восемью вкладками (прокрутка) для проверок в tabs-checks.ts. */
export function DemoTabs(): JSX.Element {
	return (
		<div class='tabs-demos'>
			<Tabs.Root defaultValue='overview'>
				<Tabs.List data-tabs-demo='basic' aria-label='Разделы'>
					<Tabs.Tab value='overview'>Обзор</Tabs.Tab>
					<Tabs.Tab value='details'>Детали</Tabs.Tab>
					<Tabs.Tab value='log'>Журнал</Tabs.Tab>
					<Tabs.Tab value='archive' disabled>Архив</Tabs.Tab>
				</Tabs.List>
				<Tabs.Panel value='overview'>Содержимое раздела «Обзор»</Tabs.Panel>
				<Tabs.Panel value='details'>Содержимое раздела «Детали»</Tabs.Panel>
				<Tabs.Panel value='log'>Содержимое раздела «Журнал»</Tabs.Panel>
				<Tabs.Panel value='archive'>Содержимое раздела «Архив»</Tabs.Panel>
			</Tabs.Root>
			<Tabs.Root defaultValue='tab-1'>
				<Tabs.List data-tabs-demo='scroll' aria-label='Много вкладок' style={{ 'inline-size': '16rem' }}>
					<For each={SCROLL_TABS}>{(number) => <Tabs.Tab value={`tab-${number}`}>{`Вкладка ${number}`}</Tabs.Tab>}</For>
				</Tabs.List>
				<For each={SCROLL_TABS}>
					{(number) => <Tabs.Panel value={`tab-${number}`}>{`Содержимое вкладки ${number}`}</Tabs.Panel>}
				</For>
			</Tabs.Root>
		</div>
	);
}
