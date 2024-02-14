import { writable } from "svelte/store";
import type { Typescale } from "@prisma/client";
import { isAuthenticated } from "./auth";
import { fetch } from "./fetch";
import { browser } from "$app/environment";

export const loadedTypescale = writable<Typescale>();
export const storedTypescales = writable<Typescale[]>([]);

isAuthenticated.subscribe(async (authenticated) => {
	fetch.subscribe(async (fetch) => {
		if (browser && authenticated) {
			try {
				const res = await fetch.get<{ typescales: Typescale[] }>("/typescales/saved");

				if (res.data?.typescales) {
					storedTypescales.set(res.data.typescales);
				}
			} catch (error) {
				console.error("Error loading typescales", error);
			}
		}
	});
});

storedTypescales.subscribe((typescales) => {
	// This should always be true, but just in case
	// if default typographies change, this should change as well
	if (typescales.length >= 3) {
		loadedTypescale.set(typescales.at(-3)!);
	}
});
