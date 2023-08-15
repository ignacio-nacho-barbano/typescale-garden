<script lang="ts">
	import type { Writable } from 'svelte/store';

	export let id: string = '';
	export let value: string | number | Writable<string | number> = '';
	export let options: (typeof value)[];
	export let disabled: boolean = false;
	let innerValue;

	$: if (typeof value === 'object') {
		value.subscribe((val) => (innerValue = val));
	} else {
		innerValue = value;
	}
</script>

<select {id} class="ds-select" {value} {disabled}>
	{#each options as option}
		<option value={option}>{option}</option>
	{/each}
</select>

<style lang="scss">
	.ds-select {
		border: solid $c-accent 1px;
	}
</style>
