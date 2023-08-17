<script lang="ts">
	import type { Writable } from 'svelte/store';

	export let id: string = '';
	export let value: string | number | Writable<number> | Writable<string> = '';
	export let options: (typeof value)[];
	export let disabled: boolean = false;
</script>

<select {id} class="ds-select" bind:value {disabled}>
	{#each options as option}
		<option value={option}>{option}</option>
	{/each}
</select>

<style lang="scss">
	.ds-select {
		border: solid $c-accent 1px;
	}
</style>
