import { browser } from "$app/environment";
import type { Typescale } from "@prisma/client";
import { derived, writable } from "svelte/store";
import { logError } from "../services/errorLogger";
import { authState } from "./auth";
import { fetch } from "./fetch";
import { GetTypescales } from "../functions/getTypescales";

export const loadedTypescaleId = writable<string>("65cccfa9da28ca09248358df");
export const storedTypescales = writable<Typescale[]>([]);
export const loadedTypescale = derived(
	[loadedTypescaleId, storedTypescales],
	([loadedId, typescales]) => typescales.find(({ id }) => id === loadedId)
);

// Side effects of user login
authState.subscribe(async ({ silentLoginReady, isAuthenticated }) => {
	if (browser && silentLoginReady) {
		fetch.subscribe(async (fetch) => {
			try {
				const res = await GetTypescales(isAuthenticated, fetch);

				if (res.data?.typescales) {
					storedTypescales.set(res.data.typescales);
				}
			} catch (error) {
				logError("Error loading typescales", error);
			}
		});
	}
});
