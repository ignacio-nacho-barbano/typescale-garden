import express from "express";
import {
	deleteTypescale,
	getDefaultTypescales,
	getUserTypescales,
	postNewTypescale,
	putTypescale
} from "../controllers/typescales";
import { checkUser } from "../middlewares/auth";

const router = express.Router();

router.get("/default", getDefaultTypescales);
router.get("/saved", checkUser, getUserTypescales);
router.post("/saved", checkUser, postNewTypescale);
router.put("/saved/:typescaleId", checkUser, putTypescale);
router.delete("/saved/:typescaleId", checkUser, deleteTypescale);

export const TypescalesRouter = router;
