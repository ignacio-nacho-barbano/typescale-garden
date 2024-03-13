<script lang="ts">
	import { outsideListener } from "../actions";

	export let open = false;
	export let position: "left" | "right" = "left";
</script>

{#if open}
	<div
		use:outsideListener
		on:clickOutside={() => (open = false)}
		style="border-top-{position}-radius: 0; {position}: var(--size-4);"
		class="user-controls-menu glass shadow-high"
	>
		<slot />
	</div>
{/if}

<style lang="scss">
	.user-controls-menu {
		border-radius: $s4;
		position: fixed;
		padding: $s4;
		top: 100%;
		z-index: 50;
		background-color: $c-base;

		ul {
			list-style: none;
		}
	}
</style>
