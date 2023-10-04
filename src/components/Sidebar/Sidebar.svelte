<script lang="ts">
	import Input from '../Input.svelte';
	import Switch from '../Switch.svelte';
	import {
		fontName,
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
	} from '../../stores/config';
	import Button from '../Button.svelte';
	import Select from '../Select.svelte';
	import Tabs from '../Tabs.svelte';
	import Tab from '../Tab.svelte';
	import { secondaryNav } from '../../stores/app';
	import Parameters from './Parameters.svelte';
	import Export from './Export.svelte';
	import Contrast from './Contrast.svelte';
</script>

<section class="side-bar glass shadow-high">
	<Tabs>
		<Tab active={$secondaryNav === 'parameters'}
			><button on:click={() => secondaryNav.set('parameters')}>Parameters</button></Tab
		>
		<Tab active={$secondaryNav === 'contrast'}
			><button on:click={() => secondaryNav.set('contrast')}>Contrast</button></Tab
		>
		<Tab active={$secondaryNav === 'export'}
			><button on:click={() => secondaryNav.set('export')}>Export</button></Tab
		>
	</Tabs>
	{#if $secondaryNav === 'parameters'}
		<Parameters />
	{:else if $secondaryNav === 'contrast'}
		<Contrast />
	{:else}
		<Export />
	{/if}
</section>

<style lang="scss">
	section.side-bar {
		min-width: 276px;
		height: calc(100vh - calc(98px + $s4));
		position: sticky;
		top: 98px;
		display: flex;
		flex-direction: column;
		gap: $s4;
		padding: $s4 $s5 $s5;
		overflow: auto;
		border-radius: $s4;
		margin-left: $s5;
		border: solid $lw $c-accent;
		// background: $c-primary;
	}
</style>
