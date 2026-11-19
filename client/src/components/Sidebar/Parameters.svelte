<script lang="ts">
	import { mockFontsApiNames } from "core";
	import {
		availableWeights,
		baseSize,
		baseUnit,
		breakpoint,
		desktopRatio,
		fontName,
		fontsApiData,
		headingsFinalWeight,
		headingsInitialWeight,
		letterSpacingRatio,
		mobileRatio,
		useItalicsForTitles,
		useUppercaseForTitles
	} from "../../stores/config";
	import { favoriteFonts, toggleFavoriteFont } from "../../stores/favorites";
	import AutoComplete from "../AutoComplete.svelte";
	import Button from "../Button.svelte";
	import Input from "../Input.svelte";
	import Select from "../Select.svelte";
	import Switch from "../Switch.svelte";

	const FONT_CATEGORIES = ["sans-serif", "display", "serif", "handwriting"];

	let activePills = [...FONT_CATEGORIES];
	// Shows favorites alone, regardless of the category pills — so a favorite is never
	// hidden by a category filter left on by accident.
	let favoritesOnly = false;
	let filteredFonts = mockFontsApiNames;

	$: {
		filteredFonts =
			$fontsApiData?.items
				?.filter((c) =>
					favoritesOnly ? $favoriteFonts.includes(c.family) : activePills.includes(c.category)
				)
				?.map((c) => c.family) || [];
	}
</script>

<div class="sidebar-parameters">
	<AutoComplete
		name="family"
		label="Font Family (Google Fonts)"
		placeholder={$fontName}
		onSelect={(newVal) => ($fontName = newVal)}
		options={filteredFonts}
		favorites={$favoriteFonts}
		onToggleFavorite={toggleFavoriteFont}
	>
		<p slot="options-hint" class="tooltip secondary">Use your keyboard to explore 🔼 🔽</p>
	</AutoComplete>

	<div class="buttons-group">
		<button
			type="button"
			class="favorites-pill body-2 bold"
			class:active={favoritesOnly}
			aria-pressed={favoritesOnly}
			on:click={() => (favoritesOnly = !favoritesOnly)}
		>
			<svg viewBox="0 0 24 24" aria-hidden="true"
				><polygon
					points="12 2.5 15 8.6 21.7 9.6 16.8 14.3 18 21 12 17.8 6 21 7.2 14.3 2.3 9.6 9 8.6 12 2.5"
				/></svg
			>
			favorites
		</button>
		{#each FONT_CATEGORIES as category}
			<Button
				type="ghost"
				size="s"
				on:click={() => {
					const index = activePills.findIndex((c) => c === category);
					const active = index !== -1;

					console.log({ active, index, activePills });

					if (active) {
						activePills = activePills.toSpliced(index, 1);
					} else {
						activePills = [...activePills, category];
					}
					console.log({ active, index, activePills });
				}}>{activePills.includes(category) ? "✅" : "⏹️"} {category}</Button
			>
		{/each}
	</div>
	<Input name="base-font" label="Base Font Size (px)" bind:value={$baseSize} />
	<Input name="visual-size" label="Base Visual Unit (px)" bind:value={$baseUnit} />
	<Input name="desktop-ratio" label="Desktop Sizes Ratio" bind:value={$desktopRatio} />
	<Input name="mobile-ratio" label="Mobile Sizes Ratio" bind:value={$mobileRatio} />
	<fieldset>
		<legend class="body-2">Headings Weight Range</legend>
		<Select
			label="From"
			id="headings-initial-weight"
			bind:value={$headingsInitialWeight}
			disabled={$availableWeights.length < 2}
			options={$availableWeights}
		/>
		<Select
			label="To"
			id="headings-final-weight"
			bind:value={$headingsFinalWeight}
			disabled={$availableWeights.length < 2}
			options={$availableWeights}
		/>
	</fieldset>
	<Input name="breakpoint" label="Breakpoint (px)" bind:value={$breakpoint} />
	<Input name="letterSpacing" label="letterSpacing Multiplier" bind:value={$letterSpacingRatio} />
	<Switch name="Uppercase for Titles" bind:value={$useUppercaseForTitles} />
	<Switch name="Italics for Titles" bind:value={$useItalicsForTitles} />
</div>

<style lang="scss">
	.buttons-group {
		display: flex;
		gap: $s2;
		flex-wrap: wrap;
	}
	.favorites-pill {
		display: inline-flex;
		align-items: center;
		gap: $s1;
		padding: $s1 $s3;
		border: $lw solid $c-accent;
		border-radius: 999px;
		background: transparent;
		color: $c-accent;
		cursor: pointer;

		svg {
			width: 14px;
			height: 14px;
			fill: currentColor;
		}

		&.active {
			background: $c-accent;
			color: $c-base;
		}
	}
	.sidebar-parameters {
		display: flex;
		gap: $s4;
		flex-direction: column;
	}
</style>
