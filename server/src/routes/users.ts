import express, { Request } from "express";
import { BASE_URL, CLIENT_ID, ISSUER, JWT_SECRET } from "../secrets";
import { OpenidRequest } from "express-openid-connect";

const router = express.Router();

const { auth } = require("express-openid-connect");

const config = {
	authRequired: false,
	auth0Logout: true,
	secret: JWT_SECRET,
	baseURL: BASE_URL,
	clientID: CLIENT_ID,
	issuerBaseURL: ISSUER
};

// auth router attaches /login, /logout, and /callback routes to the baseURL
router.use(auth(config));

// req.isAuthenticated is provided from the auth router
router.get("/", (req: Request, res) => {
	res.send(req.oidc.isAuthenticated() ? "Logged in" : "Logged out");
});

export const UsersRoutes = router;
