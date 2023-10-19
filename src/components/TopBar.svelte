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
	<h1 class="logo body-1">Typescale Garden <span class="tooltip secondary">(beta)</span></h1>
</div>

<style lang="scss">
	.logo {
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
			:global(.logo) {
				position: absolute;
				left: 50%;
				top: 50%;
				transform: translate(-50%, -50%);
			}
		}
	}
</style>
