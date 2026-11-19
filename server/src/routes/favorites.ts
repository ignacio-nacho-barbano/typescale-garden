import express from "express";
import { deleteFavorite, getFavorites, postFavorites } from "../controllers/favorites";
import { checkUser } from "../middlewares/auth";
import { rateLimitByUser } from "../middlewares/rate-limit";

const router = express.Router();

// Favorite fonts for the signed-in user. Signed-out users keep theirs in localStorage
// and never call these. Rate limited per user (FAVORITES_RATE_LIMITER in
// wrangler.jsonc), after checkUser so the key is the verified `sub`.
const limited = rateLimitByUser("FAVORITES_RATE_LIMITER");

router.get("/", checkUser, limited, getFavorites);
// Adds — never replaces — so a sign-in can merge a whole local list in one call.
router.post("/", checkUser, limited, postFavorites);
router.delete("/:family", checkUser, limited, deleteFavorite);

export const FavoritesRouter = router;
