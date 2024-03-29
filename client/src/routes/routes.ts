import type { Route } from "../models";

export const routes: Route[] = [
	{
		name: "How it Works",
		url: "/",
		id: "how-it-works"
	},
	{
		name: "Your Typescale",
		url: "/table",
		id: "typescale"
	}
];

export const getInTouch = {
	name: "Get in Touch",
	url: "mailto:nacho.barbano.dev@gmail.com"
};
