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
	import { accordionStates, secondaryNav } from '../../stores/app';
	import Parameters from './Parameters.svelte';
	import Export from './Export.svelte';
	import Contrast from './Contrast.svelte';
	import Accordion from '../Accordion.svelte';
</script>

<section class="side-bar glass">
	<Accordion bind:open={$accordionStates.parameters}>
		<span slot="title">Parameters</span>
		<Parameters slot="content" />
	</Accordion>
	<Accordion bind:open={$accordionStates.contrast}>
		<span slot="title">Contrast</span>
		<Contrast slot="content" />
	</Accordion>
	<Accordion bind:open={$accordionStates.export}>
		<span slot="title">Export</span>
		<Export slot="content" />
	</Accordion>
	<!-- <Tabs>
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
	{/if} -->
</section>

<style lang="scss">
	section.side-bar {
		min-width: 256px;
		max-width: 440px;
		height: calc(100vh - $s6);
		position: sticky;
		top: $s6;
		display: flex;
		flex-direction: column;
		gap: $s4;
		padding: $s4 0 $s5;
		overflow: auto;
		border-right: solid $lw $c-primary;
		// background: $c-primary;
	}
</style>
