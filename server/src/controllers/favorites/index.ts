import { Request, Response } from "express";
import { describeError } from "../../db/d1";
import {
	BadFavoritesError,
	MAX_FAVORITE_FONTS,
	TooManyFavoritesError,
	addFavorites,
	listFavorites,
	normalizeFamily,
	removeFavorite
} from "../../db/favorites";

// Every handler answers with the caller's whole list, like the typescales controller
// does, so the client never has to reconcile a partial answer.

const authorOf = (req: Request) => req.auth?.payload.sub as string;

export async function getFavorites(req: Request, res: Response) {
	try {
		res.status(200).json({ favorites: await listFavorites(authorOf(req)) });
	} catch (error) {
		res.status(500).json({ message: "Unable to read favorite fonts", error: describeError(error) });
	}
}

export async function postFavorites(req: Request, res: Response) {
	try {
		const { families } = req.body ?? {};

		if (!Array.isArray(families) || families.length > MAX_FAVORITE_FONTS) {
			throw new BadFavoritesError(`families must be an array of at most ${MAX_FAVORITE_FONTS}`);
		}

		await addFavorites(authorOf(req), families.map(normalizeFamily));
		await getFavorites(req, res);
	} catch (error) {
		if (error instanceof BadFavoritesError) {
			res.status(400).json({ message: "The favorites sent were not valid", error: error.message });
			return;
		}
		if (error instanceof TooManyFavoritesError) {
			res.status(409).json({ message: error.message });
			return;
		}
		res.status(500).json({ message: "Unable to save favorite fonts", error: describeError(error) });
	}
}

export async function deleteFavorite(req: Request, res: Response) {
	try {
		await removeFavorite(authorOf(req), normalizeFamily(req.params.family));
		await getFavorites(req, res);
	} catch (error) {
		if (error instanceof BadFavoritesError) {
			res.status(400).json({ message: "Not a valid font family", error: error.message });
			return;
		}
		res
			.status(500)
			.json({ message: "Unable to remove the favorite font", error: describeError(error) });
	}
}
