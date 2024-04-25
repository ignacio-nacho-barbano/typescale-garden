export as namespace GoogleFonts;

export interface WebfontFamily {
	category?: string | undefined;
	kind: string;
	family: string;
	subsets: string[];
	variants: string[];
	version: string;
	lastModified: string;
	files: { [variant: string]: string };
}

export interface WebfontList {
	kind: string;
	items: WebfontFamily[];
}
