import { Request, Response } from "express";
import { prisma } from "../../../prisma";

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
			where: { authorId: { in: [req.auth?.payload.sub, "typescale-garden"] } }
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
		console.log("\nDATA:\n\n", data);
		data.authorId = req.auth?.payload.sub;

		console.log("\nAUTHOR:\n\n", data.authorId);

		await prisma.typescale.create({ data });

		await getUserTypescales(req, res);
	} catch (error) {
		res.status(501).json({ message: "Server could not save the typescale", error });
	}
}
