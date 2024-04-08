<script lang="ts">
	import { navigating } from "$app/stores";
	import { onMount } from "svelte";
	import Footer from "../components/Footer.svelte";
	import NotificationsProjector from "../components/NotificationsProjector.svelte";
	import Sidebar from "../components/Sidebar/Sidebar.svelte";
	import TopBar from "../components/TopBar.svelte";
	import { Breakpoints } from "../constants";
	import "../scss/global.scss";
	import { mobileView, sidebarOpen, userSidebarOpen, windowWidth } from "../stores/app";
	import { baseUnit, visibleGrid } from "../stores/config";
	import type { LayoutData } from "./$types";
	import { logError } from "../services/errorLogger";

	export let data: LayoutData;
	let showIcons = true;

	let scrollContainer: HTMLElement | null = null;

	let innerWidth: number;

	const updateWidthDependencies = (width: number) => {
		mobileView.set(width < 1000);
		windowWidth.set(width);
		userSidebarOpen.set(false);
		sidebarOpen.set(width > Breakpoints.XL);
	};

	$: updateWidthDependencies(innerWidth);

	$: if ($navigating) {
		scrollContainer?.scroll({ top: 0, behavior: "smooth" });
	}

	onMount(() => {
		scrollContainer = document.getElementById("scrollable-area");
	});
</script>

<svelte:window bind:innerWidth on:error={console.error} />
<div
	id="global-wrapper"
	class:showIcons
	class:sidebarOpen={$sidebarOpen}
	class:sidebarHasNormalPosition={innerWidth > Breakpoints.XL}
>
	<NotificationsProjector />
	<Sidebar />

	<div id="scrollable-area">
		<TopBar />
		<main id="main-content">
			<div
				class="grid-overlay"
				style="display: {$visibleGrid
					? 'block'
					: 'none'};		background-size: {$baseUnit}px {$baseUnit}px;"
			/>
			<slot />
		</main>
		<Footer />
	</div>
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
		display: flex;
		flex-direction: column;
		align-items: stretch;
		position: relative;
	}

	#scrollable-area {
		flex: 1 1;
		overflow: auto;
		max-width: 100dvw;
		max-height: 100dvh;
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
