<script lang="ts">
	export let open = false;
	export let position: "left" | "right" = "left";
</script>

{#if open}
	<div
		style="border-top-{position}-radius: 0; {position}: var(--size-4);"
		class="user-controls-menu glass shadow-high"
	>
		<slot />
	</div>
{/if}

<style lang="scss">
	.user-controls-menu {
		border-radius: $s4;
		position: absolute;
		padding: $s4;
		top: 100%;
		background-color: $c-base;

		ul {
			list-style: none;
		}
	}
</style>
