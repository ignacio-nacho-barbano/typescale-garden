<script lang="ts">
	import { accordionStates, sidebarOpen } from "../../stores/app";
	import Accordion from "../Accordion.svelte";
	import LoadControl from "../FileControls/LoadControl.svelte";
	import SaveControl from "../FileControls/SaveControl.svelte";
	import Contrast from "./Contrast.svelte";
	import Export from "./Export.svelte";
	import Parameters from "./Parameters.svelte";
	import { PUB_FEATURE_FLAGS } from "$env/static/public";
</script>

<section id="sidebar" class:open={$sidebarOpen} class="side-bar glass">
	{#if PUB_FEATURE_FLAGS?.includes("load-save")}
		<Accordion bind:open={$accordionStates.file}>
			<span slot="title">File</span>
			<div slot="content" class="file-buttons">
				<LoadControl />
				<SaveControl />
			</div>
		</Accordion>
	{/if}
	<!-- <Button leadIcon="Parameters" /> -->
	<Accordion bind:open={$accordionStates.parameters}>
		<span slot="title">Typescale Settings</span>
		<Parameters slot="content" />
	</Accordion>
	<!-- experimental feature, needs development -->
	{#if PUB_FEATURE_FLAGS?.includes("contrast")}
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
		$width: 400px;

		min-width: $width;
		max-width: $width;
		display: flex;
		flex-direction: column;
		gap: $s4;
		padding: 0 0 $s5;
		overflow: auto;
		border-right: solid $lw $c-primary;
		margin-left: -$width;

		&.open {
			margin-left: 0;
		}
	}

	.file-buttons {
		display: flex;
		align-items: center;
		min-height: $s6;
		max-height: $s6;
		gap: $s3;
		padding: 0 $s4;
	}
</style>
