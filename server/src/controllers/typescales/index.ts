import { Request, Response } from "express";
import { prisma } from "../../../prisma";

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
