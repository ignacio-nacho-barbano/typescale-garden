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
			where: { authorId: { in: [req.auth?.payload.sub || "none", "typescale-garden"] } },
			orderBy: {
				lastModifiedAt: "desc"
			}
		});

		res.status(200).json({
			typescales
		});
	} catch (error) {
		res.status(500).json({ message: "Unable to gather default typescales from database" });
	}
}

export async function postNewTypescale(req: Request, res: Response) {
	try {
		const { data } = req.body;
		data.authorId = req.auth?.payload.sub;
		const permissions = (req.auth?.payload?.permissions as string[]) || [];
		const typescales = await prisma.typescale.findMany({
			where: { authorId: data.authorId }
		});
		const maxTypescales = permissions?.includes("store:typescales-premium") ? 100 : 5;

		if (typescales.length >= maxTypescales) {
			res.status(401).json({ message: "You have reached the maximum amount of typescales" });
			return;
		}

		parseFloatProps(data.base);

		await prisma.typescale.create({ data });

		await getUserTypescales(req, res);
	} catch (error) {
		res.status(500).json({ message: "Server could not save the typescale", error });
	}
}

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
		res.status(500).json({ message: "Server could not save the typescale", error });
	}
}

export async function deleteTypescale(req: Request, res: Response) {
	try {
		const id = req.params.typescaleId;
		const authorId = req.auth?.payload.sub;

		await prisma.typescale.delete({ where: { id, authorId } });

		await getUserTypescales(req, res);
	} catch (error) {
		res.status(500).json({ message: "Server could not delete the typescale", error });
	}
}
