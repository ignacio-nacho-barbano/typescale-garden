import type { mockFontsApi } from '../constants/mockFontsApi';

export interface TypeVariant {
	isHeading: boolean;
	name: string;
	desktopSize: number;
	desktopLine: number;
	mobileSize: number;
	mobileLine: number;
	kerning: number;
	uppercase: boolean;
	italics: boolean;
	weight: number;
	mapsTo?: string;
}

export type ApiFont = (typeof mockFontsApi.items)[0];
