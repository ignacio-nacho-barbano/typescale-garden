import express, { Request } from "express";
import { BASE_URL, CLIENT_ID, ISSUER, JWT_SECRET } from "../secrets";
import { OpenidRequest } from "express-openid-connect";

const router = express.Router();

// req.isAuthenticated is provided from the auth router
router.get("/", (req: Request, res) => {
	res.send(req.oidc.isAuthenticated() ? "Logged in" : "Logged out");
});

export const UsersRoutes = router;
