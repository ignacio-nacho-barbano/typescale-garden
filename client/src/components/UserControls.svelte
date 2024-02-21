<script lang="ts">
	import Icon from "svelte-material-icons/MenuDown.svelte";
	import { authClient, user } from "../stores/auth";
	import Button from "./Button.svelte";
	import Menu from "./Menu.svelte";

	let userName = $user.nickname || $user.name || $user.email;
	let menuOpen = false;

	function logOut(e: Event) {
		e.preventDefault();
		$authClient.logout();
	}
</script>

<button class="user-controls body-2" on:click={() => (menuOpen = !menuOpen)}>
	<img src={$user.picture} alt={userName} />
	<p id="user-name" class="body-2">{userName}</p>
	<Menu bind:open={menuOpen} position="right">
		<li>Free Account</li>
		<li>
			<Button size="s" type="outline" on:click={logOut}>Log Out</Button>
		</li>
	</Menu>
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
		position: relative;

		img {
			height: 100%;
			border-radius: 50%;
			aspect-ratio: 1;
			padding: 2px;
			border: $lw solid $c-accent;
		}
	}

	#user-name {
		display: none;

		@media ($bp-l) {
			display: unset;
		}
	}
</style>
