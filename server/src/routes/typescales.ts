import express from "express";
import {
	getDefaultTypescales,
	getUserTypescales,
	postNewTypescale
} from "../controllers/typescales";
import { checkUser } from "../middlewares/auth";

const router = express.Router();

router.get("/default", getDefaultTypescales);
router.post("/saved", checkUser, postNewTypescale);
router.get("/saved", checkUser, getUserTypescales);

export const TypescalesRouter = router;
