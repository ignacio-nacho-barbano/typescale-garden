<script lang="ts">
	import { page } from "$app/stores";
	import { routes } from "../routes/routes";
	import Tab from "./Tab.svelte";
	import Tabs from "./Tabs.svelte";
	import Logo from "../../static/logo.svg";
	import Button from "./Button.svelte";

	import { PUB_API } from "$env/static/public";
	import { onMount } from "svelte";

	let user;

	const getUser = async () => {
		const request = await fetch(PUB_API + "users");
		user = await request.json();
		console.log(user);
	};

	onMount(() => {
		getUser();
	});
</script>

<div class="top-bar glass">
	<Tabs>
		{#each routes as { name, url, id }, i}
			<Tab active={$page.route.id === url}>
				<a href={url}>
					<!-- <svelte:component this={icons[i]} size="20" ariaHidden /> -->{name}
				</a>
			</Tab>
		{/each}
	</Tabs>
	<div class="logo-wrapper">
		<Logo id="logo" aria-hidden />
		<h1 class="logo body-1">
			Typescale Garden <span class="tooltip secondary">(beta)</span>
		</h1>
	</div>
	<div class="btn-gr">
		{#if user?.isAuthenticated}
			<Button size="s" type="ghost" to="{PUB_API}users/logout">Log Out</Button>
		{:else}
			<Button size="s" type="ghost" to="{PUB_API}users/login">Log In</Button>
		{/if}
		<Button size="s" type="primary" to="{PUB_API}users/signIn">Register</Button>
	</div>
</div>

<style lang="scss">
	.logo-wrapper {
		display: flex;
		gap: $s3;
	}
	:global(#logo) {
		height: $s5;
		width: fit-content;
	}

	.btn-gr {
		display: flex;
		gap: $s4;
		margin-left: auto;
	}
	.top-bar {
		z-index: 4;
		padding: $s2 0;
		height: $s6;
		color: var(--green-1);
		width: auto;
		position: sticky;
		border-bottom: solid $lw $c-primary;
		left: $s5;
		right: $s5;
		top: 0;
		justify-content: flex-start;
		align-items: center;
		display: flex;

		@media ($bp-l) {
			:global(.logo-wrapper) {
				position: absolute;
				left: 50%;
				top: 50%;
				transform: translate(-50%, -50%);
			}
		}
	}
</style>
