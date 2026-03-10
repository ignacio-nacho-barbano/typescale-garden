import { json } from "@sveltejs/kit";
import type { RequestHandler } from "@sveltejs/kit";

export const GET: RequestHandler = async (event) => {
	const isAuthenticated = !!event.locals.auth;
	return json({ status: isAuthenticated ? "Logged in" : "Logged out" });
};
