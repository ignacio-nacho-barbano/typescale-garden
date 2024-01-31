<script lang="ts">
	import Input from "../Input.svelte";
	import Switch from "../Switch.svelte";
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
		useItalicsForTitles,
		availableWeights,
		randomFont,
		presets,
		selPresetIndex
	} from "../../stores/config";
	import Button from "../Button.svelte";
	import Select from "../Select.svelte";
	import Tabs from "../Tabs.svelte";
	import Tab from "../Tab.svelte";
	import { accordionStates } from "../../stores/app";
	import Parameters from "./Parameters.svelte";
	import Export from "./Export.svelte";
	import Contrast from "./Contrast.svelte";
	import Accordion from "../Accordion.svelte";
</script>

<section class="side-bar glass">
	<Accordion bind:open={$accordionStates.parameters}>
		<span slot="title">Parameters</span>
		<Parameters slot="content" />
	</Accordion>
	<!-- experimental feature, needs development -->
	{#if false}
		<Accordion bind:open={$accordionStates.contrast}>
			<span slot="title">Contrast</span>
			<Contrast slot="content" />
		</Accordion>
	{/if}
	<Accordion bind:open={$accordionStates.export}>
		<span slot="title">Export</span>
		<Export slot="content" />
	</Accordion>
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
	}
</style>
