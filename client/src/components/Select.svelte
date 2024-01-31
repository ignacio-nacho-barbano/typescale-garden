<script lang="ts">
	import type { Writable } from "svelte/store";

	type LabeledValue<T> = { label: string; value: T };

	export let id: string = "";
	export let value: string | number | Writable<number> | Writable<string> = "";
	export let options: (typeof value | LabeledValue<typeof value>)[];
	export let disabled: boolean = false;
	export let label: string;
</script>

<div class="ds-select-wrapper">
	<label for={id}> {label}</label>
	<select {id} class="ds-select body-2" bind:value {disabled}>
		{#each options as option}
			{#if typeof option === "object"}
				<option value={option.value}>{option.label}</option>
			{:else}
				<option value={option}>{option}</option>
			{/if}
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
		border-radius: $s4;
		padding: 0 $s3;
		height: $s6;
	}
</style>
