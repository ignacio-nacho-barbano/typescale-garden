import type { Typescale } from "@prisma/client";
import { Axios } from "axios";
import { asyncRetry } from "./asyncRetry";

export async function GetTypescales(isAuth: boolean, fetch: Axios) {
	let apiEndpoint = "/typescales/";
	apiEndpoint += isAuth ? "saved" : "default";

	return asyncRetry<{ data: { typescales: Typescale[] } }>(() => fetch.get(apiEndpoint), 10, 3);
}
