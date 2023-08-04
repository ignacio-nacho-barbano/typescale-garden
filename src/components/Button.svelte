<script lang="ts">
	import { onMount } from 'svelte';
	import type Icon from 'svelte-material-icons/Pan.svelte';
	import Tooltip from './Tooltip.svelte';

	export let leadIcon: string | null = null;
	export let trailIcon: string | null = null;
	export let cls: string | null = '';
	export let to: string | null = null;
	export let active: boolean | null = null;
	export let alt: string | undefined = undefined;
	export let type: 'primary' | 'outline' | 'ghost' | '' = '';
	export let size: string = 'm';
	let leadIconComp: typeof Icon;
	let trailIconComp: typeof Icon;
	let classes = `glass btn ${size} ${cls} ${type}`;
	let isExternal = false;

	if (to && !to.startsWith('/') && !to.startsWith('#')) {
		isExternal = true;
	}

	if ((leadIcon || trailIcon) && !$$slots.default) {
		classes += ' icon';

		// if (!alt) {
		// 	console.warn(
		// 		"it's recommended for buttons that have only icons to have an alt, please provide one"
		// 	);
		// }
	}

	if (leadIcon && $$slots.default) {
		classes += ' lead-icon';
	}

	if (trailIcon && $$slots.default) {
		classes += ' trail-icon';
	}

	if (active) {
		classes += ' active';
	}

	if (leadIcon) {
		onMount(async () => {
			leadIconComp = (await import(`./icons/${leadIcon}.svelte`)).default;
		});
	}

	if (trailIcon) {
		onMount(async () => {
			trailIconComp = (await import(`./icons/${trailIcon}.svelte`)).default;
		});
	}
</script>

<!-- <Tooltip {alt}>
</Tooltip> -->
<button on:click class={classes}>
	{#if to}
		<a href={to} target={isExternal ? '_blank' : '_self'}><slot /></a>
	{/if}
	<svelte:component this={leadIconComp} size="32" />
	<slot />
	<svelte:component this={trailIconComp} size="32" />
</button>

<style lang="scss">
	.btn {
		position: relative;
		display: flex;
		gap: $s2;
		background: none;
		color: currentColor;
		border: 2px solid currentColor;
		display: flex;
		font-size: 14px;
		min-height: $s6;
		max-height: $s6;
		padding: 0 $s5;
		border-radius: calc($s6 / 2);
		transition: 0.2s ease-in-out;
		align-items: center;
		justify-content: center;
		color: $c-accent;
		font-family: 'Spline Sans Mono', monospace;

		@media only screen and ($bp-m) {
			font-size: 16px;
		}

		&.secondary {
			background: $c-base;
		}

		&.ghost {
			border-color: transparent;
		}

		&.primary {
			background: linear-gradient(60deg, $c-primary, transparent);
		}

		&.icon {
			padding: 0;
			width: $s6;
		}

		&.lead-icon {
			padding-left: $s4;
		}

		&.trail-icon {
			padding-right: $s4;
		}

		&.big {
			height: 52px;
		}

		&.outlined {
			border: $lw solid transparent;
		}

		&.active {
			background-color: $c-accent;
			color: $c-base;
		}

		&:hover:not(:active) {
			background-color: $c-accent;
			color: $c-base;
			transform: (translate(-2px, -2px));
			box-shadow: 4px 4px 0 black;
		}

		a {
			opacity: 0;
			position: absolute;
			height: 100%;
			width: 100%;
		}
	}
</style>
