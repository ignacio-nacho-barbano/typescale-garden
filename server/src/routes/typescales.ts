import express from "express";
import { prisma } from "../../prisma";
import { checkJwt, checkUser } from "../middlewares/auth";
import { getUserTypescales } from "../controllers/typescales";

const router = express.Router();

router.post(
	"/",
	checkUser,
	async function (req, res, next) {
		try {
			const { data } = req.body;
			console.log("\nDATA:\n\n", data);
			data.authorId = req.auth?.payload.sub;

			console.log("\nAUTHOR:\n\n", data.authorId);

			await prisma.typescale.create({ data });

			next();
		} catch (error) {
			res.status(402).json({ message: "Server could not save the typescale", error });
		}
	},
	getUserTypescales
);

router.get("/default", async function (req, res) {
	try {
		const typescales = await prisma.typescale.findMany({ where: { authorId: "typescale-garden" } });

		res.status(200).json({
			typescales
		});
	} catch (error) {
		console.error(`\n\n${error}\n\n`);

		res.status(500).json({ error });
	}
});

router.get("/saved", checkUser, getUserTypescales);

export const TypescalesRouter = router;
