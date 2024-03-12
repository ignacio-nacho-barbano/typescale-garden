<script lang="ts">
	import { onMount } from "svelte";
	import type Icon from "svelte-material-icons/Pan.svelte";
	import Tooltip from "./Tooltip.svelte";

	// add mandatory alt in the future for icon buttons
	export let alt: string | undefined = undefined;
	export let leadIcon: string | null = null;
	export let trailIcon: string | null = null;
	export let cls: string | null = "";
	export let to: string | null = null;
	export let active: boolean | null = null;
	export let type: "primary" | "outline" | "ghost" = "outline";
	export let size: "m" | "s" = "m";
	let element: Node;
	let name = alt;
	let leadIconComp: typeof Icon;
	let trailIconComp: typeof Icon;
	let classes = `glass btn shadow-mid bold ${size} ${cls} ${type}`;
	let isExternal = false;
	let hasText = $$slots.default;

	if (to && !to.startsWith("/") && !to.startsWith("#")) {
		isExternal = true;
	}

	if ((leadIcon || trailIcon) && !hasText) {
		classes += " icon";
	}

	if (leadIcon && hasText) {
		classes += " lead-icon";
	}

	if (trailIcon && hasText) {
		classes += " trail-icon";
	}

	if (active) {
		classes += " active";
	}

	classes += size === "m" ? " body-1" : " body-2";

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

	onMount(() => {
		if (element) {
			if (hasText) {
				name = element.textContent || undefined;
			} else {
				if (!alt) {
					console.warn(
						"it's recommended for buttons that have only icons to have an alt, please provide one",
						{ leadIcon, trailIcon, element }
					);
				}
			}
		}
	});
</script>

<!-- <Tooltip {alt}>
</Tooltip> -->
<button bind:this={element} {name} on:click class={classes}>
	{#if to}
		<a href={to} target={isExternal ? "_blank" : "_self"}><slot /></a>
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
		border-radius: $s5;
		text-transform: uppercase;
		padding: 0 $s5;
		white-space: nowrap;
		transition: 0.2s ease-in-out;
		align-items: center;
		justify-content: center;
		color: $c-accent;
		border: none;

		&.m {
			min-height: $s6;
			max-height: $s6;
		}

		&.s {
			padding: 0 $s4;
			min-height: 40px;
			max-height: 40px;
		}

		&.outline {
			border: $lw solid $c-primary;
			background: $c-base;
		}

		&.ghost {
		}

		&.primary {
			background: linear-gradient(60deg, $c-primary, transparent);
		}

		&.icon {
			flex: 0 0 auto;
			padding: 0;

			&.m {
				width: $s6;
			}
			&.s {
				width: 40px;
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

		&.active {
			color: $c-base;
		}

		&:hover:not(:active) {
			border: none;
			color: $c-base;
			background: linear-gradient(60deg, $c-primary, $c-accent);
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
