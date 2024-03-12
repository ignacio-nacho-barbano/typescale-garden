<script lang="ts">
	import { authClient, user } from "../stores/auth";
	import Button from "./Button.svelte";
	import Icon from "./Icon.svelte";
	import Menu from "./Menu.svelte";

	let userName = $user.name || $user.nickname || $user.name || $user.email;
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
		<nav>
			<ul>
				<li>Free Account</li>
				<li>
					<Button size="s" type="outline" on:click={logOut}>Log Out</Button>
				</li>
			</ul>
		</nav>
	</Menu>
	<Icon>expand_more</Icon>
</button>

<style lang="scss">
	.user-controls {
		height: 40px;
		align-items: center;
		display: flex;
		background: none;
		border: none;
		position: relative;
		gap: $s3;

		ul {
			display: flex;
			flex-direction: column;
			gap: $s3;
			list-style: none;
		}

		img {
			flex: 0 0 auto;
			height: 100%;
			border-radius: 50%;
			aspect-ratio: 1;
			padding: 2px;
			border: $lw solid $c-accent;
		}

		:global(svg) {
			flex: 0 0 auto;
		}
	}

	#user-name {
		display: none;

		@media ($bp-l) {
			display: unset;
		}
	}
</style>
