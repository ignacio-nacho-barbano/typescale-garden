<script lang="ts">
	import { lorem } from '../constants';
	import { typescale, cssCode } from '../stores/config';
	import { onDestroy } from 'svelte';
	import { routes } from './routes';

	let tableStyles = '';
	const unsubscribe = cssCode.subscribe((code) => {
		tableStyles = code.replace('body', '.how-it-works-page.main-page-section');
	});

	onDestroy(unsubscribe);
</script>

<section id={routes[0].id} class="container how-it-works-page main-page-section">
	{@html `<style>
			${tableStyles}
		</style>`}
	<h1 class="heading1">Welcome to Typescale Grip</h1>
	<h2>What is a Typescale</h2>
	<p>
		A typescale or typographic scale is the group of all of the variants of a font or group of fonts
		used on a design system.
	</p>
	<h2>What is different about Typescale Grip?</h2>
	<p>
		Typescale Grip is another tool for generating a typescale based on several relations. It's more
		configurable than most other tools and it provides the possibilty of generating two sets of
		related typographic scales.
	</p>
</section>

<style lang="scss">
	#main-content {
		div {
			display: flex;
			flex-direction: column;
			gap: $s4;
		}
	}

	.variants {
		display: flex;
		flex-direction: row;
		table {
			flex: 1;

			&:last-of-type {
				flex: 0.5;
			}
		}
		td {
			padding: $s4;
		}
	}
</style>
