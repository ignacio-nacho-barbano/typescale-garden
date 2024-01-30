<script lang="ts">
	import { onMount } from 'svelte';
	import type Icon from 'svelte-material-icons/Pan.svelte';
	import Tooltip from './Tooltip.svelte';

	// add mandatory alt in the future for icon buttons
	export const alt: string | undefined = undefined;
	export let leadIcon: string | null = null;
	export let trailIcon: string | null = null;
	export let cls: string | null = '';
	export let to: string | null = null;
	export let active: boolean | null = null;
	export let type: 'primary' | 'outline' | 'ghost' = 'outline';
	export let size: 'm' | 's' = 'm';
	let leadIconComp: typeof Icon;
	let trailIconComp: typeof Icon;
	let classes = `glass btn shadow-mid ${size} ${cls} ${type}`;
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
		color: currentColor;
		display: flex;
		border-radius: 26px;
		text-transform: uppercase;
		padding: 0 $s5;
		transition: 0.2s ease-in-out;
		align-items: center;
		justify-content: center;
		color: $c-accent;
		font-weight: 700;
		border: none;

		@media only screen and ($bp-m) {
			font-size: 16px;
		}

		&.m {
			min-height: $s6;
			max-height: $s6;
		}

		&.s {
			min-height: $s5;
			max-height: $s5;
		}

		&.outline {
			border: $lw solid $c-primary;
			background: $c-base;
		}

		&.ghost {
			border-color: transparent;
		}

		&.primary {
			border: $lw solid $c-accent;
			background: linear-gradient(60deg, $c-primary, transparent);
		}

		&.icon {
			flex: 0 0 auto;
			padding: 0;

			&.m {
				width: $s6;
			}
			&.s {
				width: $s5;
			}
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
			border-color: transparent;
			transform: (translate(-2px, -2px));
			@include shadow-high;
		}

		a {
			opacity: 0;
			position: absolute;
			height: 100%;
			width: 100%;
		}
	}
</style>
