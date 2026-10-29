import { Switch } from '@stark/solid-kit/switch';
import type { JSX } from 'solid-js';

/** Выключенный и включённый переключатели для проверок в switch-checks.ts плюс недоступные. */
export function DemoSwitches(): JSX.Element {
	return (
		<div class='switch-demos'>
			<Switch data-switch-demo='off'>Выключен</Switch>
			<Switch data-switch-demo='on' defaultChecked>Включён</Switch>
			<Switch disabled>Недоступен</Switch>
			<Switch disabled defaultChecked>Недоступен включённый</Switch>
		</div>
	);
}
