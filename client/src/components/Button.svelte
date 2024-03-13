<script lang="ts">
	import { onMount } from "svelte";
	import Tooltip from "./Tooltip.svelte";
	import Icon from "./Icon.svelte";
	import { ENV } from "../services/env";

	// add mandatory alt in the future for icon buttons
	export let alt: string | undefined = undefined;
	export let leadIcon: string | null = null;
	export let trailIcon: string | null = null;
	export let disabled: boolean | null = false;
	export let cls: string | null = "";
	export let to: string | null = null;
	export let active: boolean | null = null;
	export let type: "primary" | "outline" | "ghost" = "outline";
	export let size: "m" | "s" = "m";
	let element: Node;
	let name = alt;
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

	onMount(() => {
		if (element) {
			if (hasText) {
				name = element.textContent || undefined;
			} else {
				if (!alt && ENV.IS_DEV) {
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
<button bind:this={element} {disabled} aria-label={name} on:click class={classes}>
	{#if to}
		<a href={to} target={isExternal ? "_blank" : "_self"}><slot /></a>
	{/if}
	{#if leadIcon}
		<Icon cls="lead-icon-comp">{leadIcon}</Icon>
	{/if}
	<!-- <svelte:component this={leadIconComp} size="32" /> -->
	<slot />
	{#if trailIcon}
		<Icon cls="trail-icon-comp">{trailIcon}</Icon>
	{/if}
	<!-- <svelte:component this={trailIconComp} size="32" /> -->
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

		&[disabled] {
			&,
			&:hover,
			&:active,
			&.active {
				&,
				&.outline[disabled],
				&.ghost[disabled],
				&.primary[disabled] {
					filter: grayscale(0.8);
					box-shadow: none;
					background: $c-base;
					transform: none;
					border: $lw solid rgb(162, 162, 162);
					color: rgb(93, 93, 93);
				}
			}
		}

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

		&:global(.lead-icon-comp) {
			padding-left: $s4;
		}

		&:global(.trail-icon-comp) {
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
