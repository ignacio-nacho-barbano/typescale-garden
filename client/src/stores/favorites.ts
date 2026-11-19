import { browser } from "$app/environment";
import { derived, get, writable } from "svelte/store";
import { getFromLocalStorage, saveInLocalStorage } from "../functions/localStorage";
import { logError } from "../services/errorLogger";
import { authState } from "./auth";
import { fetch } from "./fetch";

/**
 * Font families the user starred in the font picker.
 *
 * localStorage is the source for everyone, so favorites work signed out and survive a
 * reload. A signed-in user's list is also kept on the Worker (`/api/favorites`): on
 * sign-in the local list is merged into the account's in one POST (which only adds),
 * and every toggle after that is mirrored. A failed sync is logged and otherwise
 * ignored — the local list stays authoritative for this browser, and the next sign-in
 * merges it again.
 */
const STORAGE_KEY = "tsg-favorite-fonts";

const sortFamilies = (families: string[]) =>
	[...new Set(families)].sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" }));

const readLocal = (): string[] => {
	try {
		const parsed = JSON.parse(getFromLocalStorage(STORAGE_KEY) || "[]");

		return Array.isArray(parsed) ? sortFamilies(parsed.filter((f) => typeof f === "string")) : [];
	} catch {
		return [];
	}
};

export const favoriteFonts = writable<string[]>(browser ? readLocal() : []);

if (browser) {
	favoriteFonts.subscribe((families) => saveInLocalStorage(STORAGE_KEY, JSON.stringify(families)));
}

/** True once this session's sign-in merge has answered, so toggles may be mirrored. */
let synced = false;

type FavoritesResponse = { data: { favorites: string[] } };

const syncOnSignIn = derived([authState, fetch], (values) => values);

if (browser) {
	let started = false;

	syncOnSignIn.subscribe(async ([{ isAuthenticated }, api]) => {
		if (!isAuthenticated || started) {
			return;
		}
		started = true;

		try {
			const local = get(favoriteFonts);
			const res: FavoritesResponse = local.length
				? await api.post("/favorites", { families: local })
				: await api.get("/favorites");

			// Toggles made while the request was in flight are already in the store;
			// keep them rather than letting the server's older answer drop them.
			favoriteFonts.update((current) => sortFamilies([...current, ...res.data.favorites]));
			synced = true;
		} catch (error) {
			logError("Error syncing favorite fonts", error);
		}
	});
}

export const toggleFavoriteFont = (family: string) => {
	const isFavorite = get(favoriteFonts).includes(family);

	favoriteFonts.update((current) =>
		isFavorite ? current.filter((f) => f !== family) : sortFamilies([...current, family])
	);

	if (!synced || !get(authState).isAuthenticated) {
		return;
	}

	const api = get(fetch);
	const request = isFavorite
		? api.delete(`/favorites/${encodeURIComponent(family)}`)
		: api.post("/favorites", { families: [family] });

	request.catch((error) => logError("Error saving favorite font", error));
};
