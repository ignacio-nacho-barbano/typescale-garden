<script lang="ts">
	import Input from "./Input.svelte";
	import Menu from "./Menu.svelte";
	import type { KeyboardEventHandler } from "svelte/elements";

	export let name: string;
	export let value: string = "";
	export let placeholder: string | undefined = undefined;
	export let initialValue: string | undefined = undefined;
	export let label: string = name;
	export let onKeyPress: KeyboardEventHandler<HTMLDivElement> | undefined = undefined;
	export let options: string[] = [];
	export let onSelect: ((newVal: string) => void) | undefined = undefined;
	let open = false;
	// export let validators: FormValidator<typeof value>[] = [];
	let internalValue = "";
	let visibleOptions = options;
	let fresh = true;
	let list: HTMLUListElement;

	const updateVisibleOptions = (newValue: string, optionsValues: string[]) => {
		visibleOptions =
			newValue && !fresh
				? optionsValues.filter((name) => name.toLowerCase().includes(newValue.toLowerCase()))
				: optionsValues;

		fresh = false;
	};

	const internalOnKeyPress: KeyboardEventHandler<HTMLDivElement> = ({ key }) => {
		const currentIndex = options.findIndex((optVal) => optVal === value);

		if (currentIndex !== -1) {
			if (key === "ArrowDown" && currentIndex + 1 < options.length) {
				outputValue(options[currentIndex + 1]);
			} else if (key === "ArrowUp" && currentIndex - 1 >= 0) {
				outputValue(options[currentIndex - 1]);
			}
		}
	};

	$: updateVisibleOptions(internalValue, options);

	const formatOptionToId = (option: string) => option.toLowerCase().replaceAll(" ", "-");

	$: {
		if (open && placeholder && list) {
			const element = list?.querySelector(`#${formatOptionToId(placeholder)}`);

			if (element) {
				list.scrollTo(0, element.getBoundingClientRect().top - list.getBoundingClientRect().height);
			}
		}
	}

	const outputValue = (selected: string) => {
		onSelect?.(selected);
		value = selected;
		internalValue = "";
		open = false;
	};

	const openMenu = () => {
		if (!open) {
			fresh = true;
		}
		open = true;
	};
</script>

<div
	class:open
	class="tsg-autocomplete-wrapper"
	on:focus={openMenu}
	on:keydown={internalOnKeyPress}
>
	<Input
		autocomplete="off"
		placeholder={value || placeholder}
		{name}
		{label}
		bind:value={internalValue}
		onChange={openMenu}
		onClick={openMenu}
	/>
	<Menu bind:open noStyle cls="tsg-autocomplete-list">
		{#if visibleOptions.length}
			<slot name="options-hint" class="options-hint" />
			<ul class="notranslate" bind:this={list}>
				{#each visibleOptions as option}
					<li id={formatOptionToId(option)} class:selected={placeholder === option}>
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
	.options-hint {
		position: sticky;
		top: 0;

		&.hidden {
			display: none;
		}
	}
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

			li.selected {
				background: $c-accent;

				button {
					color: $c-base;
				}
			}
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
