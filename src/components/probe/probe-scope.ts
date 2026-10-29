import { createContext } from 'solid-js';

export interface ProbeScopeValue {
	label: string;
}

/** Контекст кита: по нему критерий 1 проверяет, что у приложения и кита одна копия solid-js. */
export const ProbeScope = createContext<ProbeScopeValue>({ label: 'default' });
