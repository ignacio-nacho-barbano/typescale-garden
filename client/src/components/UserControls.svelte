<script lang="ts">
	import Icon from "svelte-material-icons/MenuDown.svelte";
	import { authClient, user } from "../stores/auth";
	import Button from "./Button.svelte";

	let menuOpen = false;

	function logOut(e: Event) {
		e.preventDefault();
		$authClient.logout();
	}
</script>

<button class="user-controls body-2" on:click={() => (menuOpen = !menuOpen)}>
	<img src={$user.picture} alt={$user.nickname || $user.name || $user.email} />
	<span>{$user.nickname}</span>
	{#if menuOpen}
		<menu class="user-controls-menu glass shadow-high">
			<ul>
				<li>Free Account</li>
				<li>
					<Button size="s" type="outline" on:click={logOut}>Log Out</Button>
				</li>
			</ul>
		</menu>
	{/if}
	<Icon />
</button>

<style lang="scss">
	.user-controls {
		height: 40px;
		display: flex;
		align-items: center;
		gap: $s3;
		background: none;
		border: none;

		img {
			height: 100%;
			border-radius: 50%;
			aspect-ratio: 1;
			padding: 2px;
			border: $lw solid $c-accent;
		}
	}

	.user-controls-menu {
		border-radius: $s6 0 $s6 $s6;
		position: fixed;
		padding: $s4;
		top: calc($s6 - $s1);
		right: $s4;
		background-color: $c-base;

		ul {
			list-style: none;
		}
	}
</style>
