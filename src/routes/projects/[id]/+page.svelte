<script lang="ts">
	import { onMount } from 'svelte';
	import type { PageData } from './$types';
	import { debug } from 'svelte/internal';

	export let data: PageData;
	let iframe: HTMLIFrameElement;

	$: {
		if (iframe && 'contentWindow' in iframe) {
			debugger;
			iframe.iframe.contentWindow?.document.body.insertAdjacentHTML(
				'afterend',
				`<style>
					.autodesk360 div.shareHeader {
						display: none;
					}
				</style>`
			);
		}
	}
</script>

<main>
	<h1>{data.data.name}</h1>
	<iframe
		bind:this={iframe}
		id="project-iframe"
		src={data.data.resources[0]}
		width="1200px"
		height="600px"
		title={data.data.name}
	/>
</main>

<style lang="scss">
	main {
		padding: $s9;
	}
</style>
