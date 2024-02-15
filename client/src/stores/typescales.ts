import { browser } from "$app/environment";
import type { Typescale } from "@prisma/client";
import { derived, writable } from "svelte/store";
import { isAuthenticated } from "./auth";
import { fetch } from "./fetch";

export const loadedTypescaleId = writable<string>("65cccfa9da28ca09248358df");
export const storedTypescales = writable<Typescale[]>([]);
export const loadedTypescale = derived(
	[loadedTypescaleId, storedTypescales],
	([loadedId, typescales]) => typescales.find(({ id }) => id === loadedId)
);

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
