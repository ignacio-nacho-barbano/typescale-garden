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
	import Input from "../Input.svelte";
	import Select from "../Select.svelte";
	import Switch from "../Switch.svelte";
</script>

<div class="sidebar-parameters">
	<AutoComplete
		name="family"
		label="Font Family (Google Fonts)"
		bind:value={$fontName}
		options={$fontsApiData?.fontNames || mockFontsApiNames}
	/>
	<Input name="base-font" label="Base Font Size (px)" bind:value={$baseSize} />
	<Input name="visual-size" label="Base Visual Unit" bind:value={$baseUnit} />
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
	.sidebar-parameters {
		display: flex;
		gap: $s4;
		flex-direction: column;
	}
</style>
