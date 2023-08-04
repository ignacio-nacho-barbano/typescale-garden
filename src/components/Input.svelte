<script lang="ts">
	import Magnify from 'svelte-material-icons/Magnify.svelte';

	export let name: string;
	export let value: string | number;
	export let label: string | null = null;
	export let changeOnBlur: boolean = false;
	export let useSearch: boolean = false;
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
	<label for={name}>{label || name}</label>
	<input
		id={name}
		bind:value={internalValue}
		on:blur={() => {
			blurEvent = true;
		}}
	/>
	{#if useSearch}
		<button
			class="search-icon"
			on:click={() => {
				value = internalValue;
			}}
		>
			<Magnify size={32} />
		</button>
	{/if}
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
			font-size: 20px;
			min-height: $s6;
			max-height: $s6;
			background: $c-base;
			border: $c-primary solid $lw;
			color: $c-accent;
			padding: 0 $s3;
			border-radius: $s2;
		}

		.search-icon {
			display: flex;
			justify-content: center;
			align-items: center;
			color: $c-primary;
			position: absolute;
			right: 0;
			bottom: 0;
			border: none;
			height: $s6;
			width: $s6;
			border-left: $c-primary solid $lw;
			border-top-right-radius: $s2;
			border-bottom-right-radius: $s2;
			background: none;
			transition: 300ms;

			&:hover,
			&:focus {
				color: $c-base;
				background: $c-accent;
			}
		}
	}
</style>
