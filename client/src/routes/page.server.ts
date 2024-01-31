import { GOOGLE_KEY } from "$env/static/private";

/** @type {import('./$types').PageLoad} */
export async function load({ fetch, params }) {
	console.log("↻ Loading");

	let data = {};

	try {
		const res = await fetch(`https://www.googleapis.com/webfonts/v1/webfonts?key=${GOOGLE_KEY}`);
		console.log(res);
		if (!res.status) {
			console.warn("erro");
		}
		data = await res.json();
	} catch (e) {
		console.error("Explotó", e);
	}

	return data;
}
