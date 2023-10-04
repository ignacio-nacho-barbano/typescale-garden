<script lang="ts">
	import {
		selPresetIndex,
		fontName,
		baseSize,
		baseUnit,
		desktopRatio,
		mobileRatio,
		headingsInitialWeight,
		availableWeights,
		headingsFinalWeight,
		breakpoint,
		letterSpacingRatio,
		useUppercaseForTitles,
		useItallicsForTitles,
		randomFont,
		presets
	} from '../../stores/config';
	import Input from '../Input.svelte';
	import Button from '../Button.svelte';
	import Select from '../Select.svelte';
	import Switch from '../Switch.svelte';
</script>

<div class="sidebar-parameters">
	<Select
		label="Preset"
		id="preset"
		bind:value={$selPresetIndex}
		options={presets.map(({ name, id }) => ({ label: name, value: id }))}
	/>
	<Input name="family" label="Font Family (Google Fonts)" useSearch bind:value={$fontName} />
	<Input name="base-font" label="Base Font Size (px)" bind:value={$baseSize} />
	<Input name="visual-size" label="Base Visual Size" bind:value={$baseUnit} />
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
		<!-- <select name="cars" id="cars" bind:value={$headingsInitialWeight}>
			<option value={100}>100</option>
			<option value={200}>200</option>
			<option value={300}>300</option>
			<option value={400}>400</option>
			<option value={500}>500</option>
			<option value={600}>600</option>
			<option value={700}>700</option>
			<option value={800}>800</option>
			<option value={900}>900</option>
		</select>
		<select name="cars" id="cars" bind:value={$headingsFinalWeight}>
			<option value={100}>100</option>
			<option value={200}>200</option>
			<option value={300}>300</option>
			<option value={400}>400</option>
			<option value={500}>500</option>
			<option value={600}>600</option>
			<option value={700}>700</option>
			<option value={800}>800</option>
			<option value={900}>900</option>
		</select> -->
	</fieldset>
	<Input name="breakpoint" label="Breakpoint (px)" bind:value={$breakpoint} />
	<Input name="letterSpacing" label="letterSpacing Multiplier" bind:value={$letterSpacingRatio} />
	<Switch name="Uppercase for Titles" bind:value={$useUppercaseForTitles} />
	<Switch name="Itallics for Titles" bind:value={$useItallicsForTitles} />
	<Button on:click={randomFont}>Random Font 🎲</Button>
</div>

<style lang="scss">
	.sidebar-parameters {
		display: flex;
		gap: $s4;
		flex-direction: column;
	}
</style>
