import { writable, type Writable } from 'svelte/store';
import { notificationsQueue, showNotification } from './notifications';

export const secondaryNav: Writable<'parameters' | 'contrast' | 'export'> = writable('parameters');
export const testingColors = writable(false);
export const exportNav: Writable<'css' | 'tokens'> = writable('css');

testingColors.subscribe(() => {
	showNotification('Testing Colors');
});
