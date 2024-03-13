<script lang="ts">
	import { authClient, user } from "../stores/auth";
	import Button from "./Button.svelte";
	import Icon from "./Icon.svelte";
	import Menu from "./Menu.svelte";

	let userName = $user.name || $user.nickname || $user.name || $user.email;
	let open = false;

	function logOut(e: Event) {
		e.preventDefault();
		$authClient.logout();
	}
</script>

<div class="user-profile-button-wrapper">
	<button
		aria-label="open user options menu"
		class="user-controls body-2"
		on:click={() => {
			open = !open;
		}}
	>
		<img src={$user.picture} alt={userName} />
		<p id="user-name" class="body-2">{userName?.replace(/@.+/, "")}</p>
		<Icon>expand_more</Icon>
	</button>
	<Menu bind:open position="right">
		<ul>
			<li class="body-2">Free Account:</li>
			<li class="tooltip">{$user.email}</li>
			<li>
				<Button size="s" type="outline" on:click={logOut}>Log Out</Button>
			</li>
		</ul>
	</Menu>
</div>

<style lang="scss">
	.user-profile-button-wrapper {
		position: relative;

		ul {
			display: flex;
			flex-direction: column;
			gap: $s3;
			list-style: none;
		}
	}

	button.user-controls {
		height: 40px;
		align-items: center;
		display: flex;
		background: none;
		border: none;
		position: relative;
		gap: $s3;

		img {
			flex: 0 0 auto;
			height: 100%;
			border-radius: 50%;
			aspect-ratio: 1;
			padding: 2px;
			border: $lw solid $c-accent;
		}
	}

	#user-name {
		display: none;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;

		@media ($bp-l) {
			display: unset;
		}
	}
</style>
