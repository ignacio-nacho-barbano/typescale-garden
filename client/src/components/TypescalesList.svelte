<script lang="ts">
	import { browser } from "$app/environment";
	import { onMount } from "svelte";
	import { authToken, isAuthenticated } from "../stores/auth";
	import { storedTypescales } from "../stores/typescales";
	import { PUB_API_URL } from "$env/static/public";

	isAuthenticated.subscribe(async (authenticated) => {
		if (browser && authenticated) {
			try {
				const res = await fetch(PUB_API_URL + "/api/typescales/saved", {
					method: "GET",
					redirect: "follow",
					headers: {
						Authorization: `Bearer ${$authToken}`
					}
				});

				const data = await res.json();
				if (data.typescales) {
					storedTypescales.set([...$storedTypescales, ...data.typescales]);
				}

				console.log(data);
			} catch (error) {
				console.error("Error loading typescales", error);
			}
		}
	});
</script>

<h1>Available Typescales</h1>
<ul>
	{#each $storedTypescales as ts}
		<li>{ts}</li>
	{/each}
</ul>

<style lang="scss">
</style>
