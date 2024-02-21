import { PUB_API_URL } from "$env/static/public";
import axios, { type CreateAxiosDefaults } from "axios";
import { derived } from "svelte/store";
import { authToken } from "./auth";

export const baseAxiosConfig: CreateAxiosDefaults = {
	baseURL: PUB_API_URL + "/api",
	timeout: 5000
};

export const fetch = derived(authToken, (token) =>
	axios.create(
		token ? { ...baseAxiosConfig, headers: { Authorization: `Bearer ${token}` } } : baseAxiosConfig
	)
);
