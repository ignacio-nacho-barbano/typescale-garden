import { browser } from "$app/environment";
import type { Typescale } from "@prisma/client";
import { derived, writable } from "svelte/store";
import { isAuthenticated } from "./auth";
import { fetch } from "./fetch";
import { logError } from "../services/errorLogger";
import { PUB_APP_ENV } from "$env/static/public";

export const loadedTypescaleId = writable<string>("65cccfa9da28ca09248358df");
export const storedTypescales = writable<Typescale[]>([]);
export const loadedTypescale = derived(
	[loadedTypescaleId, storedTypescales],
	([loadedId, typescales]) => typescales.find(({ id }) => id === loadedId)
);

// Side effects of user login
isAuthenticated.subscribe(async (authenticated) => {
	fetch.subscribe(async (fetch) => {
		// REMOVE ENV WHEN PUBLISHING THIS FEATURE
		if (browser && authenticated && PUB_APP_ENV === "dev") {
			try {
				const res = await fetch.get<{ typescales: Typescale[] }>("/typescales/saved");

				if (res.data?.typescales) {
					storedTypescales.set(res.data.typescales);
				}
			} catch (error) {
				logError("Error loading typescales", error);
			}
		}
	});
});
