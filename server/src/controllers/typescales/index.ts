import { Request, Response } from "express";
import { describeError, ObjectId, serialize, withTypescales } from "../../db/mongo";
import { parseFloatProps } from "../../functions";

const DEFAULT_AUTHOR = "typescale-garden";

export async function getDefaultTypescales(req: Request, res: Response) {
	try {
		const docs = await withTypescales((c) => c.find({ authorId: DEFAULT_AUTHOR }).toArray());

		res.status(200).json({
			typescales: docs.map(serialize)
		});
	} catch (error) {
		res
			.status(500)
			.json({
				message: "The server was unable to request the default typescales",
				error: describeError(error)
			});
	}
}

export async function getUserTypescales(req: Request, res: Response) {
	try {
		const authorId = req.auth?.payload.sub || "none";
		const docs = await withTypescales((c) =>
			c
				.find({ authorId: { $in: [authorId, DEFAULT_AUTHOR] } })
				.sort({ lastModifiedAt: -1 })
				.toArray()
		);

		res.status(200).json({
			typescales: docs.map(serialize)
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
		data.authorId = authorId;
		const permissions = (req.auth?.payload?.permissions as string[]) || [];

		const count = await withTypescales((c) => c.countDocuments({ authorId }));
		const maxTypescales = permissions?.includes("store:typescales-premium") ? 100 : 5;

		if (count >= maxTypescales) {
			res.status(401).json({ message: "You have reached the maximum amount of typescales" });
			return;
		}

		parseFloatProps(data.base);

		// Prisma set these automatically (@default(now()) / @updatedAt); do it by hand now.
		const now = new Date();
		delete data.id;
		delete data._id;
		await withTypescales((c) => c.insertOne({ ...data, createdAt: now, lastModifiedAt: now }));

		await getUserTypescales(req, res);
	} catch (error) {
		res.status(500).json({ message: "Server could not save the typescale", error: describeError(error) });
	}
}

export async function putTypescale(req: Request, res: Response) {
	try {
		const { data } = req.body;
		const id = req.params.typescaleId;
		const authorId = req.auth?.payload.sub as string;
		data.authorId = authorId;

		parseFloatProps(data.base);

		// Scoped to the owner so a user can only update their own typescale.
		delete data.id;
		delete data._id;
		await withTypescales((c) =>
			c.updateOne({ _id: new ObjectId(id), authorId }, { $set: { ...data, lastModifiedAt: new Date() } })
		);

		await getUserTypescales(req, res);
	} catch (error) {
		res.status(500).json({ message: "Server could not save the typescale", error: describeError(error) });
	}
}

export async function deleteTypescale(req: Request, res: Response) {
	try {
		const id = req.params.typescaleId;
		const authorId = req.auth?.payload.sub as string;

		await withTypescales((c) => c.deleteOne({ _id: new ObjectId(id), authorId }));

		await getUserTypescales(req, res);
	} catch (error) {
		res.status(500).json({ message: "Server could not delete the typescale", error: describeError(error) });
	}
}
