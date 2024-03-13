<script lang="ts">
	import Input from "./Input.svelte";
	import Menu from "./Menu.svelte";

	export let name: string;
	export let value: string;
	export let label: string = name;
	export let options: string[] = [];
	let open = false;
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
			? options.filter((name) => name.toLowerCase().includes(newValue.toLowerCase()))
			: options;
	};

	$: updateVisibleOptions(internalValue);

	const outputValue = (selected: string) => {
		value = selected;
		internalValue = selected;
		open = false;
	};
</script>

<div class="autocomplete-wrapper">
	<Input
		{...{ name, label }}
		bind:value={internalValue}
		on:click={() => {
			open = true;
		}}
	/>
	<Menu bind:open>
		{#if visibleOptions.length}
			<ul>
				{#each visibleOptions as option}
					<li>
						<button class="body-2" on:click={() => outputValue(option)}>{option}</button>
					</li>
				{/each}
			</ul>
		{:else}
			<p class="tooltip">No matching fonts found</p>
		{/if}
	</Menu>
</div>

<style lang="scss">
	.autocomplete-wrapper {
		position: relative;

		:global(.floating-menu-wrapper) {
			left: 0;
			top: $s7;
			max-height: 50dvh;
			max-width: 300px;
			width: 100%;
			overflow: auto;
		}

		ul {
			height: 100%;
			list-style: none;
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
