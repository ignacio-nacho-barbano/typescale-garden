<script lang="ts">
	import { mockFontsApiNames } from "../../constants/mockFontsApi";
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
	import AutoComplete from "../AutoComplete.svelte";
	import Button from "../Button.svelte";
	import Input from "../Input.svelte";
	import Select from "../Select.svelte";
	import Switch from "../Switch.svelte";

	const FONT_CATEGORIES = ["sans-serif", "display", "serif", "handwriting"];

	let activePills = [...FONT_CATEGORIES];
	let filteredFonts = mockFontsApiNames;

	$: {
		filteredFonts =
			$fontsApiData?.fonts?.items
				?.filter((c) => activePills.includes(c.category))
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
	>
		<p slot="options-hint" class="tooltip secondary">Use your keyboard to explore 🔼 🔽</p>
	</AutoComplete>

	<div class="buttons-group">
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
	.sidebar-parameters {
		display: flex;
		gap: $s4;
		flex-direction: column;
	}
</style>
