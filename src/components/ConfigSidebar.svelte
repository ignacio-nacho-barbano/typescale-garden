<script lang="ts">
	import Input from './Input.svelte';
	import Switch from './Switch.svelte';
	import {
		fontName,
		seeCode,
		baseSize,
		baseUnit,
		desktopRatio,
		mobileRatio,
		breakpoint,
		headingsFinalWeight,
		headingsInitialWeight,
		letterSpacingRatio,
		useUppercaseForTitles,
		useItallicsForTitles,
		availableWeights,
		randomFont,
		presets,
		selPresetIndex
	} from '../stores/config';
	import Button from './Button.svelte';
	import Select from './Select.svelte';
</script>

<section class="side-bar glass shadow-high">
	<h2 class="heading6">Parameters</h2>
	<Button on:click={randomFont}>Random Font 🎲</Button>
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
	<Button type="primary" cls="see-code" on:click={() => seeCode.set(!$seeCode)}
		>{$seeCode ? 'Hide Code' : 'See Code'}</Button
	>
</section>

<style lang="scss">
	section.side-bar {
		min-width: 276px;
		max-width: 400px;
		height: calc(100vh - calc(98px + $s4));
		position: sticky;
		top: 98px;
		display: flex;
		flex-direction: column;
		gap: $s4;
		padding: $s4 $s5 $s5;
		overflow: auto;
		margin-left: $s4;
		border: solid $lw $c-accent;
		// background: $c-primary;

		:global(.see-code) {
			position: sticky;
			bottom: 0;
		}
	}

	fieldset {
		border: none;
		display: flex;
		flex: 0 1 auto;
		flex-wrap: wrap;
		gap: $s4;
	}
</style>
