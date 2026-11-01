/** Элемент ряда страниц: кнопка страницы или многоточие (не интерактивно). */
export type PagerItem = { kind: 'page'; page: number } | { kind: 'gap' };
