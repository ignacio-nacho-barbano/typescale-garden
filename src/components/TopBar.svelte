<script lang="ts">
	import Logo from '../../static/logo.svg';
	import LogoIso from '../../static/nacho-barbano.svg';
	import { getInTouch, routes } from '../routes/routes';
	import Button from './Button.svelte';
	import Tabs from './Tabs.svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import Tab from './Tab.svelte';
</script>

<div class="top-bar">
	<div class="logo-wrapper glass">
		<a href="/" class="logo" aria-label="Home">Typescale Garden</a>
	</div>
	<Tabs>
		{#each routes as { name, url, id }, i}
			<Tab active={$page.route.id === url}>
				<a href={url}>
					<!-- <svelte:component this={icons[i]} size="20" ariaHidden /> -->{name}
				</a>
			</Tab>
		{/each}
	</Tabs>
	<!-- <Button cls="cta" to={getInTouch.url}>{getInTouch.name}</Button> -->
</div>

<style lang="scss">
	.logo-wrapper {
		margin-right: auto;
		padding: 0 $s4;
		display: flex;
		justify-content: center;
	}
	.top-bar {
		z-index: 4;
		padding: $s4 $sd6;
		color: var(--green-1);
		width: 100vw;
		position: sticky;
		top: 0;
		display: flex;
		align-items: stretch;
		grid-template-columns: auto 1fr auto;
		transition: height 300ms;

		.container {
			display: flex;
			gap: 12px;
			align-items: center;
			justify-content: flex-start;
			align-self: stretch;
		}

		:global(nav.tabs) {
			width: fit-content;

			// background: $c-primary;
			@include shadow-mid;
		}

		a {
			display: flex;
			justify-content: center;
			gap: $s2;
			align-items: center;
			text-decoration: none;

			&.logo {
				font-size: 24px;
				letter-spacing: 0.1em;
			}
		}
	}
</style>
