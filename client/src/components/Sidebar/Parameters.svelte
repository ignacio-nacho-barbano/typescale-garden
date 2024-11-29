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
		useUppercaseForTitles,
		variants
	} from "../../stores/config";
	import AutoComplete from "../AutoComplete.svelte";
	import Button from "../Button.svelte";
	import Input from "../Input.svelte";
	import Modal from "../Modal.svelte";
	import Select from "../Select.svelte";
	import Switch from "../Switch.svelte";

	let configModalOpen = false;

	const openConfigModal = () => (configModalOpen = true);
	let fontColumnSize = 12;
</script>

<Modal bind:open={configModalOpen} title="Customize Your size Steps">
	<div class="modal-content">
		<Input name="desktop-ratio" label="Desktop Sizes Ratio" bind:value={$desktopRatio} />
		<Input name="mobile-ratio" label="Mobile Sizes Ratio" bind:value={$mobileRatio} />

		<div class="font-examples">
			<div class="font-example-steps">
				{#each variants.toReversed() as { name, location }}
					<div class="reference-block">
						<div
							class="reference-column"
							style="height: {fontColumnSize * Math.pow($desktopRatio, location)}px;"
						/>
						<Button size="xs" type="ghost" leadIcon="arrow_drop_up" />
						<Button size="xs" type="ghost" leadIcon="arrow_drop_down" />
					</div>
				{/each}
			</div>
			<div class="font-example-letters">
				{#each variants.toReversed() as { name }}
					<span class={name}>Aa</span>
				{/each}
			</div>
		</div>
	</div>
</Modal>

<div class="sidebar-parameters">
	<AutoComplete
		name="family"
		label="Font Family (Google Fonts)"
		bind:value={$fontName}
		options={$fontsApiData?.fontNames || mockFontsApiNames}
	/>
	<Input name="base-font" label="Base Font Size (px)" bind:value={$baseSize} />
	<Input name="visual-size" label="Base Visual Unit (px)" bind:value={$baseUnit} />
	<div class="input-and-button">
		<Input name="desktop-ratio" label="Desktop Sizes Ratio" bind:value={$desktopRatio} />
		<Button leadIcon="tune" on:click={openConfigModal}>Config</Button>
	</div>
	<div class="input-and-button">
		<Input name="mobile-ratio" label="Mobile Sizes Ratio" bind:value={$mobileRatio} />
		<Button leadIcon="tune" on:click={openConfigModal}>Config</Button>
	</div>
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

	.input-and-button {
		display: flex;
		gap: $s2;
		align-items: flex-end;

		:global(.btn) {
		}
	}

	.font-examples {
		padding: $s4 0;
		display: flex;
		gap: $s2;
		flex-direction: column;
		justify-content: center;
		width: 100%;
		white-space: nowrap;
	}

	.reference-block {
		display: flex;
		flex-direction: column;
		gap: $s2;
	}

	.reference-column {
		background: $c-accent;
		border-radius: $s1;
		flex: none;
		width: 100%;
	}

	.font-example-steps,
	.font-example-letters {
		width: 100%;
		justify-content: center;
		display: flex;
		gap: $s2;
		align-items: baseline;
	}
</style>
