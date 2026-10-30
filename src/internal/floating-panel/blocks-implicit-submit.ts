/**
 * Enter в поле внутри панели, чья форма-владелец лежит снаружи панели (панель смонтирована в хосте, который сам внутри `<form>`),
 * иначе отправил бы эту форму (критерий 6 (в) зонтичного спека). Кнопки и `textarea` не трогаются.
 */
export function blocksImplicitSubmit(event: KeyboardEvent, panel: HTMLElement): boolean {
	const target = event.target;
	if (event.key !== 'Enter' || !(target instanceof HTMLInputElement || target instanceof HTMLSelectElement)) {
		return false;
	}
	return target.form !== null && !panel.contains(target.form);
}
