import express from "express";
import { deleteFavorite, getFavorites, postFavorites } from "../controllers/favorites";
import { checkUser } from "../middlewares/auth";

const router = express.Router();

// Favorite fonts for the signed-in user. Signed-out users keep theirs in localStorage
// and never call these.
router.get("/", checkUser, getFavorites);
// Adds — never replaces — so a sign-in can merge a whole local list in one call.
router.post("/", checkUser, postFavorites);
router.delete("/:family", checkUser, deleteFavorite);

export const FavoritesRouter = router;
