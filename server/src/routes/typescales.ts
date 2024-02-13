import express, { Request } from "express";
import { API_URL, AUTH_DOMAIN, BASE_URL, CLIENT_ID, ISSUER, JWT_SECRET } from "../secrets";
const { auth, requiredScopes } = require("express-oauth2-jwt-bearer");

import { OpenidRequest } from "express-openid-connect";

const router = express.Router();

const checkJwt = auth({
	audience: API_URL,
	issuerBaseURL: AUTH_DOMAIN,
	tokenSigningAlg: "RS256"
});

router.get("/default", function (req, res) {
	res.json({
		typescales: ["IBM", "Material"]
	});
});

// This route needs authentication
router.get("/saved", checkJwt, function (req, res) {
	res.json({
		typescales: ["Saved 1", "Saved 2"]
	});
});

const checkScopes = requiredScopes("read:messages");

router.get("/private-scoped", checkJwt, checkScopes, function (req, res) {
	res.json({
		message:
			"Hello from a private endpoint! You need to be authenticated and have a scope of read:messages to see this."
	});
});

export const TypescalesRouter = router;
