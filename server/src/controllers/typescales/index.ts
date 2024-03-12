import { Request, Response } from "express";
import { prisma } from "../../../prisma";
import { parseFloatProps } from "../../functions";

export async function getDefaultTypescales(req: Request, res: Response) {
	try {
		const typescales = await prisma.typescale.findMany({ where: { authorId: "typescale-garden" } });

		res.status(200).json({
			typescales
		});
	} catch (error) {
		res
			.status(500)
			.json({ message: "The server was unable to request the default typescales", error });
	}
}

export async function getUserTypescales(req: Request, res: Response) {
	try {
		const typescales = await prisma.typescale.findMany({
			// @ts-ignore
			where: { authorId: { in: [req.auth?.payload.sub, "typescale-garden"] } },
			orderBy: {
				lastModifiedAt: "desc"
			}
		});

		res.status(200).json({
			typescales
		});
	} catch (error) {
		// add rollbar
		res.status(500).json({ message: "Unable to gather default typescales from database" });
	}
}

export async function postNewTypescale(req: Request, res: Response) {
	try {
		// add limits
		const { data } = req.body;
		data.authorId = req.auth?.payload.sub;

		try {
			const typescales = await prisma.typescale.findMany({
				where: { authorId: data.authorId }
			});

			const maxTypescales = 5;

			if (typescales.length >= maxTypescales) {
				res.status(401).json({ message: "You have reached the maximum amount of typescales" });

				return;
			}
		} catch (e) {
			console.error("Error when counting typescales", e);

			return;
		}

		parseFloatProps(data.base);

		await prisma.typescale.create({ data });

		await getUserTypescales(req, res);
	} catch (error) {
		res.status(501).json({ message: "Server could not save the typescale", error });
	}
}

// WRITE THIS
export async function putTypescale(req: Request, res: Response) {
	try {
		const { data } = req.body;
		const id = req.params.typescaleId;
		const authorId = req.auth?.payload.sub;
		data.authorId = authorId;

		parseFloatProps(data.base);

		await prisma.typescale.update({ where: { authorId, id }, data });

		await getUserTypescales(req, res);
	} catch (error) {
		res.status(501).json({ message: "Server could not save the typescale", error });
	}
}
export async function deleteTypescale(req: Request, res: Response) {
	try {
		const id = req.params.typescaleId;
		const authorId = req.auth?.payload.sub;

		try {
			const typescales = await prisma.typescale.delete({ where: { id, authorId } });

			// if (!typescales.id) {
			// 	res.status(401).json({ message: "The typescale could not be deleted" });

			// 	return;
			// }
		} catch (e) {
			console.log("no existing typescales");

			return;
		}

		await getUserTypescales(req, res);
	} catch (error) {
		res.status(501).json({ message: "Server could not save the typescale", error });
	}
}
