<script lang="ts">
	import { onMount } from "svelte";
	import NotificationsProjector from "../components/NotificationsProjector.svelte";
	import Sidebar from "../components/Sidebar/Sidebar.svelte";
	import TopBar from "../components/TopBar.svelte";
	import { Breakpoints } from "../constants";
	import "../scss/global.scss";
	import { mobileView, sidebarOpen, userSidebarOpen, windowWidth } from "../stores/app";
	import { baseUnit, visibleGrid } from "../stores/config";
	import { storedTypescales } from "../stores/typescales";
	import type { LayoutData } from "./$types";

	export let data: LayoutData;

	let innerWidth: number;

	const updateWidthDependencies = (width: number) => {
		mobileView.set(width < 1000);
		windowWidth.set(width);
		userSidebarOpen.set(false);
		sidebarOpen.set(width > Breakpoints.XL);
	};

	$: updateWidthDependencies(innerWidth);

	onMount(() => {
		if (data.typescales) {
			storedTypescales.set(data.typescales);
		}
	});
</script>

<NotificationsProjector />
<svelte:window bind:innerWidth />
<div
	id="global-wrapper"
	class:sidebarOpen={$sidebarOpen}
	class:sidebarHasNormalPosition={innerWidth > Breakpoints.XL}
>
	<Sidebar />

	<main id="main-content">
		<TopBar />
		<div class="container">
			<!-- 	<Tabs>
				{#each routes as { name, url, id }, i}
					<Tab active={$page.route.id === url}>
						<a href={url}>
							{name}
						</a>
					</Tab>
				{/each}
			</Tabs> -->
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
	}

	.toggle-button-wrapper {
		padding: 0 $s2;
		border-bottom: $c-accent solid $lw;
		height: fit-content;
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
</style>
