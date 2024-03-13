<script lang="ts">
	import { outsideListener } from "../actions";

	export let open = false;
	export let position: "left" | "right" = "left";
</script>

{#if open}
	<div
		use:outsideListener
		on:clickOutside={() => (open = false)}
		style="border-top-{position}-radius: 0; top: calc(100% + 12px);  {position}: var(--size-4);"
		class="floating-menu-wrapper glass shadow-high"
	>
		<slot />
	</div>
{/if}

<style lang="scss">
	.floating-menu-wrapper {
		border-radius: $s4;
		position: absolute;
		padding: $s4;
		top: 100%;
		z-index: 50;
		background-color: $c-base;

		ul {
			list-style: none;
		}
	}
</style>
