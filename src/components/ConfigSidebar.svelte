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
		kerningRatio,
		useUppercaseForTitles,
		useItallicsForTitles
	} from '../stores/config';
	import Button from './Button.svelte';
</script>

<section class="side-bar">
	<h2>Options</h2>
	<Button on:click={() => seeCode.set(!$seeCode)}>{$seeCode ? 'Hide Code' : 'See Code'}</Button>
	<Input name="family" label="Font Family (Google Fonts)" useSearch bind:value={$fontName} />
	<Input name="base-font" label="Body Font (px)" bind:value={$baseSize} />
	<Input name="desktop-ratio" label="Desktop Sizes Ratio" bind:value={$desktopRatio} />
	<Input name="mobile-ratio" label="Mobile Sizes Ratio" bind:value={$mobileRatio} />
	<fieldset>
		<legend class="small">Headings Weight</legend>
		<select name="cars" id="cars" bind:value={$headingsInitialWeight}>
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
		</select>
	</fieldset>
	<Input name="breakpoint" label="Breakpoint (px)" bind:value={$breakpoint} />
	<Input name="kerning" label="Kerning Ratio" bind:value={$kerningRatio} />
	<Switch name="Uppercase for Titles" bind:value={$useUppercaseForTitles} />
	<Switch name="Itallics for Titles" bind:value={$useItallicsForTitles} />
</section>

<style lang="scss">
	section.side-bar {
		min-width: 276px;
		max-width: 400px;
		display: flex;
		flex-direction: column;
		top: 0;
		gap: $s4;
		padding: $s5 $s5 $s8;
		border-right: $c-accent $lw solid;
		overflow: auto;
	}

	fieldset {
		border: none;
		display: flex;
		flex: 0 1 auto;
		flex-wrap: wrap;
		gap: $s4;
	}
</style>
