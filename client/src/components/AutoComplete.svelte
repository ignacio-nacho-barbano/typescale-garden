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
	let fresh = true;

	// having this assures internal value will be updated when value changes from the outside
	const updateInternalValue = (newValue: string) => {
		internalValue = newValue;
	};

	$: updateInternalValue(value);

	const updateVisibleOptions = (newValue: string) => {
		visibleOptions =
			newValue && !fresh
				? options.filter((name) => name.toLowerCase().includes(newValue.toLowerCase()))
				: options;
		fresh = false;
	};

	$: updateVisibleOptions(internalValue);

	const outputValue = (selected: string) => {
		value = selected;
		internalValue = selected;
		open = false;
	};

	const openMenu = () => {
		if (!open) {
			fresh = true;
		}
		open = true;
	};
</script>

<div class:open class="tsg-autocomplete-wrapper" on:focus={openMenu}>
	<Input
		autocomplete="off"
		{...{ name, label }}
		bind:value={internalValue}
		onChange={openMenu}
		onClick={openMenu}
	/>
	<Menu bind:open noStyle cls="tsg-autocomplete-list">
		{#if visibleOptions.length}
			<ul class="notranslate">
				{#each visibleOptions as option}
					<li>
						<button class="body-2" on:click={() => outputValue(option)}>{option}</button>
					</li>
				{/each}
			</ul>
		{:else}
			<p class="tooltip bold">No matching fonts found</p>
		{/if}
	</Menu>
</div>

<style lang="scss">
	.tsg-autocomplete-wrapper {
		position: relative;

		:global(.tsg-autocomplete-list) {
			border: $lw solid transparent;
			position: absolute;
			left: 0;
			right: 0;
			height: 3;
			background: $c-base;
			z-index: 1;
			transition: 300ms;
			max-height: 50vh;
			padding: $s3 0 0 $s3;
			border-top: none;
			visibility: hidden;
			overflow: hidden;
			border-radius: 0 0 $s4 $s4;
			flex-direction: column;
		}

		:global(.floating-menu-wrapper) {
			padding: 0;
			left: 0;
		}

		&.open {
			:global(div.input-wrapper input) {
				border-bottom-left-radius: 0;
				border-bottom-right-radius: 0;
				border-bottom-color: transparent !important;
			}

			:global(.tsg-autocomplete-list) {
				visibility: visible;
				border-color: $c-primary;
				height: fit-content;

				display: flex;
			}

			:global(.tsg-autocomplete-list ul) {
				overflow: auto;
				padding: $s3 $s1;
			}

			:global(.tsg-autocomplete-list p) {
				margin: $s3 $s2;
			}
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
