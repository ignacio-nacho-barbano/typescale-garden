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

<div class="top-bar glass shadow-mid">
	<Tabs>
		{#each routes as { name, url, id }, i}
			<Tab active={$page.route.id === url}>
				<a href={url}>
					<!-- <svelte:component this={icons[i]} size="20" ariaHidden /> -->{name}
				</a>
			</Tab>
		{/each}
	</Tabs>
	<h1 class="logo body-1">Typescale Garden</h1>
</div>

<style lang="scss">
	.logo {
		margin-left: $sd6;
	}
	.top-bar {
		z-index: 4;
		border-radius: $s4;
		padding: $s2 $sd5 0;
		height: $s6;
		color: var(--green-1);
		width: fit-content;
		position: sticky;
		top: $s4;
		left: $s5;
		align-items: baseline;
		display: flex;
	}
</style>
