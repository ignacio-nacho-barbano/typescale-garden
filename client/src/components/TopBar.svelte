<script lang="ts">
	import Logo from "../../static/logo.svg";
	import { authClient, isAuthenticated } from "../stores/auth";
	import Button from "./Button.svelte";
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

	// onMount(() => {

	// });
</script>

<div class="top-bar glass">
	<div class="logo-wrapper">
		<Logo id="logo" aria-hidden />
		<h1 class="logo body-2">Typescale Garden</h1>
	</div>

	<div class="btn-gr">
		{#if $isAuthenticated}
			<UserControls />
		{:else}
			<Button size="s" type="outline" on:click={logIn}>Log In</Button>
			<Button size="s" type="primary" on:click={(e) => logIn(e, true)}>Register</Button>
		{/if}
	</div>
</div>

<style lang="scss">
	.logo-wrapper {
		display: flex;
		gap: $s3;
		align-items: center;
	}
	:global(#logo) {
		height: $s5;
		width: fit-content;
	}
	.btn-gr {
		display: flex;
		gap: $s4;
	}

	.logo-wrapper {
		h1 {
			width: 0;
			height: 0;
			visibility: hidden;
		}
	}

	.btn-gr {
	}
	.top-bar {
		z-index: 4;
		padding: $s2 $s5;
		height: $s6;
		color: var(--green-1);
		width: auto;
		position: sticky;
		border-bottom: solid $lw $c-primary;
		left: $s5;
		right: $s5;
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
