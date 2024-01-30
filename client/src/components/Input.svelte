<script lang="ts">
	import type { Writable } from 'svelte/store';
	import type { FormValidator } from '../models';
	import Button from './Button.svelte';

	export let name: string;
	export let value: Writable<string> | Writable<number> | string | number;
	export let label: string | null = null;
	export let changeOnBlur: boolean = false;
	export let useSearch: boolean = false;
	export let validators: FormValidator<typeof value>[] = [];
	let blurEvent: boolean = false;
	let internalValue: string = (value || '') as string;

	const outputValue = (newValue: string, blurHappened: boolean) => {
		if (!useSearch && ((changeOnBlur && blurHappened) || !changeOnBlur)) {
			value = newValue;
		}
		blurEvent = false;
	};

	$: outputValue(internalValue, blurEvent);
</script>

<div class="input-wrapper">
	<label class="body-2" for={name}>{label || name}</label>
	<div class="controls-wrapper">
		<input
			class="body-2"
			id={name}
			bind:value={internalValue}
			on:blur={() => {
				blurEvent = true;
			}}
		/>
		{#if useSearch}
			<Button
				on:click={() => {
					value = internalValue;
				}}
				leadIcon="Search"
			/>
		{/if}
	</div>
</div>

<style lang="scss">
	.input-wrapper {
		display: flex;
		flex-direction: column;
		position: relative;
		min-height: fit-content;
		max-height: fit-content;
		width: 100%;

		&:focus-within {
			.search-icon {
				color: $c-accent;
			}
		}
		label {
			margin-bottom: $s2;
		}
		input {
			min-height: $s6;
			max-height: $s6;
			background: $c-base;
			border: $c-primary solid $lw;
			color: $c-accent;
			border-radius: $s4;
			padding: 0 $s3;

			flex: 1 1;
		}

		.controls-wrapper {
			display: flex;
			gap: $s3;
		}
	}
</style>
