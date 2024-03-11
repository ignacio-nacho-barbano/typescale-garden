import { RequestHandler } from "express";
import { auth } from "express-oauth2-jwt-bearer";
import { API_URL, AUTH_DOMAIN } from "../secrets";

const checkJwt = auth({
	audience: API_URL,
	issuerBaseURL: AUTH_DOMAIN,
	tokenSigningAlg: "RS256"
});

export const checkUser: RequestHandler = (req, res, next) => {
	checkJwt(req, res, next);
};
