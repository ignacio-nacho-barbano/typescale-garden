import { writable } from 'svelte/store';

export interface Palette {
	base: string;
	accent: string;
	primary: string;
	textMainLight: string;
	textSecondaryLight: string;
	textDarkPrimary?: string;
	textDarkSecondary?: string;
}

export const base = writable('#ffffff');
export const accent = writable('#1be0ee');
export const primary = writable('#17495e');
export const textMainLight = writable('#c6e7ec');
export const textSecondaryLight = writable('#50b2b9');
export const textMainDark = writable('#c6e7ec');
export const textSecondaryDark = writable('#50b2b9');
