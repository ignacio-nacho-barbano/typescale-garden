import { Request, Response } from "express";
import {
	BadTypescaleError,
	countByAuthor,
	deleteTypescale as deleteRow,
	describeError,
	findByAuthors,
	insertTypescale,
	updateTypescale
} from "../../db/d1";

const DEFAULT_AUTHOR = "typescale-garden";

export async function getDefaultTypescales(req: Request, res: Response) {
	try {
		res.status(200).json({
			typescales: await findByAuthors([DEFAULT_AUTHOR])
		});
	} catch (error) {
		res.status(500).json({
			message: "The server was unable to request the default typescales",
			error: describeError(error)
		});
	}
}

export async function getUserTypescales(req: Request, res: Response) {
	try {
		const authorId = req.auth?.payload.sub || "none";

		res.status(200).json({
			typescales: await findByAuthors([authorId, DEFAULT_AUTHOR], true)
		});
	} catch (error) {
		res.status(500).json({
			message: "Unable to gather default typescales from database",
			error: describeError(error)
		});
	}
}

export async function postNewTypescale(req: Request, res: Response) {
	try {
		const { data } = req.body;
		const authorId = req.auth?.payload.sub as string;
		const permissions = (req.auth?.payload?.permissions as string[]) || [];

		const count = await countByAuthor(authorId);
		const maxTypescales = permissions?.includes("store:typescales-premium") ? 100 : 5;

		if (count >= maxTypescales) {
			res.status(401).json({ message: "You have reached the maximum amount of typescales" });
			return;
		}

		await insertTypescale(authorId, data ?? {});

		await getUserTypescales(req, res);
	} catch (error) {
		if (error instanceof BadTypescaleError) {
			res.status(400).json({ message: "The typescale sent was not valid", error: error.message });
			return;
		}
		res
			.status(500)
			.json({ message: "Server could not save the typescale", error: describeError(error) });
	}
}

export async function putTypescale(req: Request, res: Response) {
	try {
		const { data } = req.body;
		const id = req.params.typescaleId;
		const authorId = req.auth?.payload.sub as string;

		// A miss means the id does not exist or belongs to another user; either
		// way the caller has nothing to update.
		if (!(await updateTypescale(id, authorId, data ?? {}))) {
			res.status(404).json({ message: "No typescale of yours matches that id" });
			return;
		}

		await getUserTypescales(req, res);
	} catch (error) {
		if (error instanceof BadTypescaleError) {
			res.status(400).json({ message: "The typescale sent was not valid", error: error.message });
			return;
		}
		res
			.status(500)
			.json({ message: "Server could not save the typescale", error: describeError(error) });
	}
}

export async function deleteTypescale(req: Request, res: Response) {
	try {
		const id = req.params.typescaleId;
		const authorId = req.auth?.payload.sub as string;

		if (!(await deleteRow(id, authorId))) {
			res.status(404).json({ message: "No typescale of yours matches that id" });
			return;
		}

		await getUserTypescales(req, res);
	} catch (error) {
		res
			.status(500)
			.json({ message: "Server could not delete the typescale", error: describeError(error) });
	}
}
