<script lang="ts">
	export let alt: string | undefined = undefined;
	export let cls: string = "";
</script>

{#if alt}
	<div class="tooltip">
		{#if alt}
			<span class={cls}>{alt}</span>
		{/if}
		<slot />
	</div>
{/if}

<style lang="scss">
	.tooltip {
		display: contents;
	}
</style>
