<script lang="ts">
	import type { Writable } from 'svelte/store';

	export let id: string = '';
	export let value: string | number | Writable<number> | Writable<string> = '';
	export let options: (typeof value)[];
	export let disabled: boolean = false;
	export let label: string;
</script>

<div class="ds-select-wrapper">
	<label for={id}> {label}</label>
	<select {id} class="ds-select body-2" bind:value {disabled}>
		{#each options as option}
			<option value={option}>{option}</option>
		{/each}
	</select>
</div>

<style lang="scss">
	.ds-select-wrapper {
		display: flex;
		flex-direction: column;

		label {
			margin-bottom: $s2;
		}
	}
	.ds-select {
		background-color: $c-base;
		color: $c-accent;
		border: solid $c-primary $lw;
		padding: 0 $s3;
		height: $s6;
		border-radius: $s3;
	}
</style>
