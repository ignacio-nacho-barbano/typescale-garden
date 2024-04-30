<script lang="ts">
	import type { Auth0Client } from "@auth0/auth0-spa-js";
	import Logo from "../../static/logo.svg";
	import { mobileView, sidebarOpen, userSidebarOpen } from "../stores/app";
	import { authClient, authState } from "../stores/auth";
	import Button from "./Button.svelte";
	import Icon from "./Icon.svelte";
	import Switch from "./Switch.svelte";
	import UserControls from "./UserControls.svelte";
	import { logIn } from "../functions";
</script>

<div class="top-bar glass" class:sidebarOpen={$sidebarOpen}>
	<Button
		cls="sidebar-toggle-button"
		size="s"
		alt="{$sidebarOpen ? 'close' : 'open'} settings sidebar"
		leadIcon={$sidebarOpen ? "menu_open" : "custom_typography"}
		on:click={() => {
			sidebarOpen.update((actual) => !actual);
		}}
	/>

	<a href="/" aria-label="go to homepage" class="notranslate logo-wrapper">
		<Logo id="logo" aria-hidden />
		<h1 class="logo body-2">Typescale Garden</h1>
	</a>

	<div class="phone-view">
		<Icon>aod</Icon>
		<Switch size="s" name="mobile-view" label="Mobile View" bind:value={$mobileView} />
	</div>

	{#if $authState.isAuthenticated}
		<UserControls />
	{:else}
		<Button
			alt="{$userSidebarOpen ? 'close' : 'open'} log in and sign in menu"
			cls="config-toggle-button"
			size="s"
			leadIcon="person_add"
			on:click={() => {
				userSidebarOpen.update((actual) => !actual);
			}}
		/>
		<div class="btn-gr {$userSidebarOpen ? 'shadow-high open' : ''}">
			<Button size="s" type="outline" on:click={(e) => logIn(e, $authClient)}>Log In</Button>
			<Button size="s" type="primary" on:click={(e) => logIn(e, $authClient, true)}>Register</Button
			>
		</div>
	{/if}
</div>

<style lang="scss">
	a.logo-wrapper {
		display: flex;
		gap: $s3;
		align-items: center;
		text-decoration: none;

		h1.logo {
			font-weight: 500;
		}

		&:hover {
			text-decoration: underline;

			:global(svg#logo) {
				transform: scale(1.1);
			}
		}
	}
	:global(#logo) {
		height: $s5;
		max-width: $s5;
		flex: 0 0 auto;
		width: fit-content;
		transition: transform 200ms ease-in-out;
	}

	.phone-view {
		display: flex;
		align-items: center;
		margin: 0 auto;
		gap: $sd1;
		flex: 0 0 auto;

		:global(svg) {
			flex: 0 0 auto;
		}

		:global(label) {
			visibility: hidden;
			width: 0;

			@media ($bp-xl) {
				visibility: unset;
				width: unset;
			}
		}
	}

	.logo-wrapper {
		h1 {
			width: 0;
			height: 0;
			visibility: hidden;
		}
	}

	:global(button.btn.config-toggle-button.icon) {
		@media ($bp-m) {
			display: none;
		}
	}

	.btn-gr {
		display: flex;
		gap: $s4;
		position: fixed;
		right: 0;
		top: $s6;
		flex-direction: column;
		background: $c-base;
		padding: $s4;
		border-radius: $s4 0 $s4 $s4;
		transform-origin: top right;
		transform: rotateY(90deg);
		transition: transform 200ms ease-in-out;

		&.open {
			transform: translateX(0);
		}

		@media ($bp-m) {
			position: static;
			background: none;
			padding: 0;
			flex-direction: row;
			transform: none;
		}
	}
	.top-bar {
		z-index: 4;
		padding: $s2 $s5;
		height: $s6;
		color: var(--green-1);
		width: auto;
		position: sticky;
		border-bottom: solid $lw $c-primary;
		left: 0;
		right: $s5;
		gap: $s4;
		top: 0;
		justify-content: space-between;
		align-items: center;
		display: flex;

		@media ($bp-l) {
			.logo-wrapper {
				h1 {
					height: unset;
					width: unset;
					visibility: unset;
				}
			}
		}
	}
</style>
