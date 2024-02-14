<script lang="ts">
	import { accordionStates } from "../../stores/app";
	import Accordion from "../Accordion.svelte";
	import LoadControl from "../FileControls/LoadControl.svelte";
	import SaveControl from "../FileControls/SaveControl.svelte";
	import Contrast from "./Contrast.svelte";
	import Export from "./Export.svelte";
	import Parameters from "./Parameters.svelte";
</script>

<section id="sidebar" class="side-bar glass">
	<div class="file-buttons">
		<LoadControl />
		<SaveControl />
	</div>
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
		display: flex;
		flex-direction: column;
		gap: $s4;
		padding: 0 0 $s5;
		overflow: auto;
		border-right: solid $lw $c-primary;
	}

	.file-buttons {
		position: sticky;
		top: 0;
		z-index: 1;
		background: $c-base;
		display: flex;
		align-items: center;
		height: $s6;
		gap: $s3;
		padding: 0 $s4;
		border-bottom: $lw solid $c-primary;
	}
</style>
