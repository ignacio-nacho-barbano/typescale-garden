<script lang="ts">
	import type { Writable } from "svelte/store";
	import type { FormValidator } from "../models";
	import Button from "./Button.svelte";
	import type { ChangeEventHandler, MouseEventHandler } from "svelte/elements";

	export let name: string;
	export let value: string | number;
	export let placeholder: string | undefined = undefined;
	export let label: string = name;
	export let changeOnBlur: boolean = false;
	export let autocomplete = "off";

	export let onChange: ChangeEventHandler<HTMLInputElement> | undefined = undefined;
	export let onClick: MouseEventHandler<HTMLInputElement> | undefined = undefined;
	export let useSearch: boolean = false;
	// export let validators: FormValidator<typeof value>[] = [];
	let blurEvent: boolean = false;
	let internalValue: string | number = value || "";

	// having this assures internal value will be updated when value changes from the outside
	const updateInternalValue = (newValue: string | number) => {
		internalValue = newValue;
	};

	$: updateInternalValue(value);

	const outputValue = (newValue: string | number, blurHappened: boolean) => {
		if (!useSearch && ((changeOnBlur && blurHappened) || !changeOnBlur)) {
			value = newValue;
		}
		blurEvent = false;
	};

	$: outputValue(internalValue, blurEvent);
</script>

<div class="input-wrapper">
	<label class="body-2" for={name}>{label}</label>
	<div class="controls-wrapper">
		<input
			{autocomplete}
			{placeholder}
			aria-label={label}
			class="body-2 notranslate"
			id={name}
			bind:value={internalValue}
			on:input={onChange}
			on:click={onClick}
			on:blur={() => {
				blurEvent = true;
			}}
		/>
		{#if useSearch}
			<Button
				alt="submit {label || name}"
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
