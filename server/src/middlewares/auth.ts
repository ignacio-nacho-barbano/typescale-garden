import { RequestHandler } from "express";
import { auth, claimCheck } from "express-oauth2-jwt-bearer";
import { API_URL, AUTH_DOMAIN } from "../secrets";
export const checkJwt = auth({
	audience: API_URL,
	issuerBaseURL: AUTH_DOMAIN,
	tokenSigningAlg: "RS256"
});

export const checkUser: RequestHandler = (req, res, next) => {
	checkJwt(req, res, () => {
		claimCheck((claims) => {
			console.log({ claims });
			return true;
		});
		next();
	});
};
