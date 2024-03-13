<script lang="ts">
	import Input from "./Input.svelte";

	export let name: string;
	export let value: string;
	export let label: string = name;
	export let options: string[] = [];
	// export let validators: FormValidator<typeof value>[] = [];
	let internalValue: string = value;
	let visibleOptions = options;

	// having this assures internal value will be updated when value changes from the outside
	const updateInternalValue = (newValue: string) => {
		internalValue = newValue;
	};

	$: updateInternalValue(value);

	const updateVisibleOptions = (newValue: string) => {
		visibleOptions = newValue
			? options.filter((name) => name.match(new RegExp(newValue, "i")))
			: options;
	};

	$: updateVisibleOptions(internalValue);

	const outputValue = (selected: string) => {
		value = selected;
		internalValue = selected;
	};
</script>

<div class="autocomplete-wrapper">
	<Input {...{ name, label }} bind:value={internalValue} />
	<ul class="shadow-high">
		{#each visibleOptions as option}
			<li>
				<button class="body-2" on:click={() => outputValue(option)}>{option}</button>
			</li>
		{/each}
	</ul>
</div>

<style lang="scss">
	.autocomplete-wrapper {
		position: relative;

		&:focus-within {
			ul {
				display: block;
			}
		}

		ul {
			display: none;
			z-index: 20;
			border-radius: $s4;
			border: $c-primary $lw solid;
			background: $c-base;
			position: fixed;
			top: $s7;
			width: 100%;
			max-width: 300px;
			// max-width: 280px;
			max-height: 50dvh;
			overflow: auto;

			button {
				text-wrap: nowrap;
				text-overflow: ellipsis;
				width: 100%;
				text-align: left;
				overflow: hidden;
				background: none;
				border: none;
				padding: $s2;

				&:hover {
					background: linear-gradient(30deg, $c-primary, transparent 50%);
				}
			}
		}
	}
</style>
