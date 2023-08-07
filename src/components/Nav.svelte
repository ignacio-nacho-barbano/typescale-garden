<script lang="ts">
	import Briefcase from 'svelte-material-icons/BriefcaseOutline.svelte';
	import CodeTags from 'svelte-material-icons/CodeTags.svelte';
	import Up from 'svelte-material-icons/PanUp.svelte';
	import Account from 'svelte-material-icons/AccountOutline.svelte';
	import { page } from '$app/stores';
	import { routes } from '../routes/routes';
	import { onMount } from 'svelte';

	const icons = [Up, Briefcase, CodeTags, Account];
</script>

<nav>
	<div class="gradient-border" />
	<menu>
		{#each routes as { name, url, id }, i}
			<li>
				<a href={url} class="nav-link" class:active={$page.route.id === url}>
					<!-- <svelte:component this={icons[i]} size="20" ariaHidden /> -->{name}
				</a>
			</li>
		{/each}
	</menu>
</nav>

<style lang="scss">
	nav {
		z-index: 2;
		backdrop-filter: blur(12px);
		position: fixed;
		bottom: 0%;
		width: 100vw;
		left: 0;

		menu {
			display: flex;
			gap: $s3;
			justify-content: space-around;
			list-style: none;

			.nav-link {
				display: flex;
				flex-direction: column;
				justify-content: center;
				align-items: center;
				gap: 4px;
				border: solid 1px transparent;
				padding: 12px 8px 12px 12px;
				position: relative;
				text-decoration: none;
				text-transform: capitalize;
				color: currentColor;
				height: 100%;

				&.active {
					color: white;
				}

				&::before {
					position: absolute;
					left: 0;
					content: '';
					display: block;
					width: 4px;
					height: 4px;
					border-radius: 2px;
					transition: 100ms ease-in-out, transform 200ms ease-in-out;
				}

				&:hover::before {
					background: $c-primary;
					height: 12px;
				}

				&:active::before {
					transform: scale(2);
					background: $c-accent;
				}

				&.active::before {
					background: $c-accent;
					height: 12px;
				}
			}
		}
	}

	@media screen and (min-width: 920px) {
		.gradient-border {
			display: none;
		}
		nav {
			height: 100%;
			background: none;
			backdrop-filter: none;
			width: unset;
			position: unset;
			border-top: none;
		}
		menu {
			height: 100%;
			justify-content: flex-start;
		}

		menu li .nav-link {
			flex-direction: row;
		}
	}
</style>
