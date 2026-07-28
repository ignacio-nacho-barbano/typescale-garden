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
	import { baseUnit, fontsApiData, visibleGrid } from "../stores/config";
	import type { LayoutData } from "./$types";
	import { ENV } from "../services/env";
	import { logError } from "../services/errorLogger";
	import { showNotification } from "../stores/notifications";
	import { goto } from "$app/navigation";
	import { PUB_TURNSTILE_SITE_KEY } from "$env/static/public";

	export let data: LayoutData;
	let showIcons = true;

	let scrollContainer: HTMLElement | null = null;

	let innerWidth: number;

	let showOverlay = false;

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
		// globalThis.turnstile?.render("#cf-turnstile", {
		// 	sitekey: PUB_TURNSTILE_SITE_KEY,
		// 	size: "flexible",
		// 	appearance: "interaction-only",
		// 	action: "page_load",
		// 	callback: (token: string) => {
		// 		console.log("Challenge Success:", token);
		// 		showOverlay = false;
		// 	},
		// 	"before-interactive-callback": () => {
		// 		showOverlay = true;
		// 	},
		// 	"error-callback": (errorCode: string) => {
		// 		console.log("Challenge Error:", errorCode);
		// 	},
		// 	"expired-callback": () => {
		// 		console.log("Token expired");
		// 	},
		// 	"timeout-callback": () => {
		// 		console.log("Challenge timed out");
		// 	}
		// });

		// The catalogue comes from the Worker, which refreshes it from Google daily and
		// serves it out of KV (server/src/fonts/snapshot.ts). Plain `fetch`, not the
		// $fetch axios instance — that one attaches an Authorization header, which would
		// turn this into a preflighted request and defeat the response's static
		// `Access-Control-Allow-Origin: *`.
		fetch(`${ENV.API_URL}/api/fonts`)
			.then((res) => {
				if (!res.ok) {
					throw new Error(`${res.status} ${res.statusText}`);
				}
				return res.json();
			})
			// Fall back to the snapshot committed in static/ if the API is unreachable.
			// It is the pre-KV shape (`{ fonts, fontNames }`), hence the unwrap.
			.catch(async (e) => {
				logError("Unable to load fonts data from the API, falling back to static: " + e);
				const res = await fetch("/fonts-data.json");
				const data = await res.json();
				return data.fonts ?? data;
			})
			.then((data) => {
				fontsApiData.set(data);
			})
			.catch((e) => {
				logError("Unable to load fonts data: " + e);
				showNotification("Unable to load fonts data, please reload the page.");
			});
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
	<div class="challenge-overlay" class:visible={showOverlay}>
		<div id="cf-turnstile" class="cf-turnstile" data-sitekey={PUB_TURNSTILE_SITE_KEY} />
	</div>
	<NotificationsProjector />
	<Sidebar />

	<div id="scrollable-area" class:blocked={showOverlay}>
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

		&.blocked {
			overflow: hidden;
		}
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
	.challenge-overlay {
		opacity: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		pointer-events: none;
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		top: 0;
		background: rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(5px);
		z-index: 10;
		padding: 20px;

		.cf-turnstile {
			max-width: 500px;
			width: 100%;
		}

		&.visible {
			opacity: 1;
			pointer-events: all;
		}
	}
</style>
