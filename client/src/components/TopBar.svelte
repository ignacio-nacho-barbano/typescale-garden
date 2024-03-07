<script lang="ts">
	import Phone from "svelte-material-icons/CellphoneText.svelte";
	import Logo from "../../static/logo.svg";
	import { mobileView, sidebarOpen, userSidebarOpen } from "../stores/app";
	import { authClient, isAuthenticated } from "../stores/auth";
	import Button from "./Button.svelte";
	import Switch from "./Switch.svelte";
	import UserControls from "./UserControls.svelte";

	function logIn(e: Event, signUp?: boolean) {
		e.preventDefault();

		let config;

		if (signUp) {
			config = {
				authorizationParams: {
					screen_hint: "signup"
				}
			};
		}

		$authClient.loginWithRedirect(config);
	}
</script>

<div class="top-bar glass" class:sidebarOpen={$sidebarOpen}>
	<Button
		cls="sidebar-toggle-button"
		size="s"
		leadIcon="MenuOpen"
		on:click={() => {
			sidebarOpen.update((actual) => !actual);
		}}
	/>

	<a href="/" class="logo-wrapper">
		<Logo id="logo" aria-hidden />
		<h1 class="logo body-2">Typescale Garden</h1>
	</a>

	<div class="phone-view">
		<Phone size="20" />
		<Switch size="s" name="mobile-view" label="Mobile View" bind:value={$mobileView} />
	</div>

	{#if $isAuthenticated}
		<UserControls />
	{:else}
		<Button
			cls="config-toggle-button"
			size="s"
			leadIcon="Menu"
			on:click={() => {
				userSidebarOpen.update((actual) => !actual);
			}}
		/>
		<div class="btn-gr {$userSidebarOpen ? 'shadow-high open' : ''}">
			<Button size="s" type="outline" on:click={logIn}>Log In</Button>
			<Button size="s" type="primary" on:click={(e) => logIn(e, true)}>Register</Button>
		</div>
	{/if}
</div>

<style lang="scss">
	:global(.sidebar-toggle-button) {
		transition: rotate ease-in-out 300ms;
		rotate: 180deg;
	}
	.sidebarOpen {
		:global(.sidebar-toggle-button) {
			rotate: 0deg;
		}
	}
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
		flex: 0 0 auto;
		width: fit-content;
		transition: transform 200ms ease-in-out;
	}

	.phone-view {
		display: flex;
		align-items: center;
		margin: 0 auto;
		gap: $s1;

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
