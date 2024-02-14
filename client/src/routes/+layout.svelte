<script lang="ts">
	import "../scss/global.scss";
	import TopBar from "../components/TopBar.svelte";
	import Sidebar from "../components/Sidebar/Sidebar.svelte";
	import { baseUnit, visibleGrid } from "../stores/config";
	import NotificationsProjector from "../components/NotificationsProjector.svelte";
	import { storedTypescales } from "../stores/typescales";
	import { onMount } from "svelte";
	import type { LayoutData } from "./$types";
	import { page } from "$app/stores";
	import Tab from "../components/Tab.svelte";
	import Tabs from "../components/Tabs.svelte";
	import { routes } from "./routes";

	export let data: LayoutData;

	onMount(() => {
		if (data.typescales) {
			storedTypescales.set(data.typescales);
		}
	});
</script>

<NotificationsProjector />
<div id="global-wrapper">
	<Sidebar />
	<main id="main-content">
		<TopBar />
		<div class="container">
			<Tabs>
				{#each routes as { name, url, id }, i}
					<Tab active={$page.route.id === url}>
						<a href={url}>
							<!-- <svelte:component this={icons[i]} size="20" ariaHidden /> -->{name}
						</a>
					</Tab>
				{/each}
			</Tabs>
		</div>
		<div
			class="grid-overlay"
			style="display: {$visibleGrid
				? 'block'
				: 'none'};		background-size: {$baseUnit}px {$baseUnit}px;"
		/>
		<slot />
	</main>
</div>

<style lang="scss">
	#global-wrapper {
		display: flex;
		flex-direction: row;
		width: 100dvw;
		height: 100dvh;

		:global(#sidebar) {
			display: none;

			@media ($bp-l) {
				display: unset;
			}
		}
	}
	main#main-content {
		flex: 1 1;
		display: flex;
		flex-direction: column;
		align-items: stretch;
		position: relative;
		overflow: auto;
	}

	.grid-overlay {
		background-color: transparent;
		opacity: 0.3;
		left: 0;
		top: 0;
		background-repeat: repeat;
		background-image: linear-gradient(#444cf7 1px, transparent 1px),
			linear-gradient(to right, #444cf7 1px, transparent 1px);
		position: absolute;
		width: 100%;
		height: 100%;
	}

	// @media screen and (min-width: 920px) {
	// 	:global(body nav) {
	// 		display: none;
	// 	}
	// }
</style>
