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
	/** Starred options. Pinned above the rest, in the order given. */
	export let favorites: string[] = [];
	/** When set, every option gets a star button that calls this. */
	export let onToggleFavorite: ((option: string) => void) | undefined = undefined;
	let open = false;
	// export let validators: FormValidator<typeof value>[] = [];
	let internalValue = "";
	let visibleOptions = options;
	let fresh = true;
	let list: HTMLDivElement;

	const pinFavorites = (optionsValues: string[], favs: string[]) => {
		const available = new Set(optionsValues);
		const pinned = onToggleFavorite ? favs.filter((fav) => available.has(fav)) : [];
		const pinnedSet = new Set(pinned);

		return { pinned, rest: optionsValues.filter((option) => !pinnedSet.has(option)) };
	};

	const updateVisibleOptions = (newValue: string, optionsValues: string[]) => {
		visibleOptions =
			newValue && !fresh
				? optionsValues.filter((name) => name.toLowerCase().includes(newValue.toLowerCase()))
				: optionsValues;

		fresh = false;
	};

	const internalOnKeyPress: KeyboardEventHandler<HTMLDivElement> = ({ key }) => {
		const currentIndex = orderedOptions.findIndex((optVal) => optVal === value);

		if (currentIndex !== -1) {
			if (key === "ArrowDown" && currentIndex + 1 < orderedOptions.length) {
				outputValue(orderedOptions[currentIndex + 1]);
			} else if (key === "ArrowUp" && currentIndex - 1 >= 0) {
				outputValue(orderedOptions[currentIndex - 1]);
			}
		}
	};

	$: updateVisibleOptions(internalValue, options);

	// What the menu shows, and the order the arrow keys walk: favorites first. Declared
	// after the line above on purpose — `updateVisibleOptions` assigns `visibleOptions`
	// inside a function, which Svelte cannot see, so source order is what runs it first.
	$: ({ pinned: visibleFavorites, rest: visibleRest } = pinFavorites(visibleOptions, favorites));
	$: orderedOptions = (({ pinned, rest }) => [...pinned, ...rest])(
		pinFavorites(options, favorites)
	);
	$: favoriteSet = new Set(favorites);

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
			{#if onToggleFavorite && !favorites.length}
				<p class="tooltip secondary">Star a font to pin it to the top</p>
			{/if}
			<div class="options notranslate" bind:this={list}>
				{#if visibleFavorites.length}
					<p class="section-label tooltip bold" id="{name}-favorites-label">Favorites</p>
					<ul aria-labelledby="{name}-favorites-label">
						{#each visibleFavorites as option (option)}
							{@const isSelected = placeholder === option}
							<li id={formatOptionToId(option)} class:selected={isSelected}>
								<button class="body-2 option" on:click={() => outputValue(option)}>{option}</button>
								<button
									class="favorite-toggle active"
									aria-pressed="true"
									aria-label="Remove {option} from favorites"
									on:click={() => onToggleFavorite?.(option)}
								>
									<svg viewBox="0 0 24 24" aria-hidden="true"
										><polygon
											points="12 2.5 15 8.6 21.7 9.6 16.8 14.3 18 21 12 17.8 6 21 7.2 14.3 2.3 9.6 9 8.6 12 2.5"
										/></svg
									>
								</button>
							</li>
						{/each}
					</ul>
					{#if visibleRest.length}
						<p class="section-label tooltip bold" id="{name}-all-label">All fonts</p>
					{/if}
				{/if}
				{#if visibleRest.length}
					<ul aria-labelledby={visibleFavorites.length ? `${name}-all-label` : undefined}>
						{#each visibleRest as option (option)}
							<li id={formatOptionToId(option)} class:selected={placeholder === option}>
								<button class="body-2 option" on:click={() => outputValue(option)}>{option}</button>
								{#if onToggleFavorite}
									<button
										class="favorite-toggle"
										class:active={favoriteSet.has(option)}
										aria-pressed={favoriteSet.has(option)}
										aria-label="Add {option} to favorites"
										on:click={() => onToggleFavorite?.(option)}
									>
										<svg viewBox="0 0 24 24" aria-hidden="true"
											><polygon
												points="12 2.5 15 8.6 21.7 9.6 16.8 14.3 18 21 12 17.8 6 21 7.2 14.3 2.3 9.6 9 8.6 12 2.5"
											/></svg
										>
									</button>
								{/if}
							</li>
						{/each}
					</ul>
				{/if}
			</div>
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

			:global(.tsg-autocomplete-list .options) {
				overflow: auto;
				padding: $s3 $s1;
			}

			:global(.tsg-autocomplete-list p) {
				margin: $s3 $s2;
			}
		}

		.section-label {
			margin: $s2 $s2 $s1;
			text-transform: uppercase;
			letter-spacing: 0.06em;
			color: $c-text-sl;

			& + ul + .section-label {
				margin-top: $s3;
				padding-top: $s3;
				border-top: $lw solid $c-primary;
			}
		}

		ul {
			list-style: none;

			li {
				display: flex;
				align-items: center;
				border-radius: $s3;
			}

			li.selected {
				background: $c-accent;

				button {
					color: $c-base;
				}
			}
			button.option {
				flex: 1;
				min-width: 0;
				text-wrap: nowrap;
				text-overflow: ellipsis;
				text-align: left;
				overflow: hidden;
				background: none;
				border: none;
				padding: $s2;

				&:hover {
					background: linear-gradient(30deg, $c-primary, transparent 50%);
				}
			}
			button.favorite-toggle {
				flex: none;
				display: flex;
				align-items: center;
				justify-content: center;
				width: 36px;
				height: 36px;
				padding: 0;
				background: none;
				border: none;
				border-radius: 50%;
				cursor: pointer;
				color: $c-text-sl;

				svg {
					width: 18px;
					height: 18px;
					fill: none;
					stroke: currentColor;
					stroke-width: 1.8;
					stroke-linejoin: round;
				}

				&.active {
					color: $c-accent;

					svg {
						fill: currentColor;
					}
				}

				&:hover,
				&:focus-visible {
					background: $c-primary-bg;
				}
			}

			li.selected button.favorite-toggle {
				color: $c-base;

				&:hover,
				&:focus-visible {
					background: rgb(255 255 255 / 0.15);
				}
			}
		}
	}
</style>
