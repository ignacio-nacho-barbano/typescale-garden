<script lang="ts">
	import { PUB_FEATURE_FLAGS } from "$env/static/public";
	import { accordionStates, sidebarOpen, windowWidth } from "../../stores/app";
	import Accordion from "../Accordion.svelte";
	import LoadControl from "../FileControls/LoadControl.svelte";
	import SaveControl from "../FileControls/SaveControl.svelte";
	import Contrast from "./Contrast.svelte";
	import Export from "./Export.svelte";
	import Parameters from "./Parameters.svelte";
</script>

<section
	id="sidebar"
	class:open={$sidebarOpen}
	class="side-bar {$windowWidth < 1000 ? 'shadow-high' : ''}"
>
	<div class="settings-title">
		<h2 class="title-6">Settings</h2>
	</div>

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
		<span slot="title">Typescale</span>
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
	.settings-title {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: $s2;
	}
	section.side-bar {
		--width: 320px;
		$width: var(--width);

		position: fixed;
		z-index: 5;
		top: $s6;
		bottom: 0;
		left: 0;
		border-radius: 0 $s5 $s5 0;
		min-width: $width;
		max-width: $width;
		display: flex;
		flex-direction: column;
		padding: 0 0 $s5;
		overflow: auto;
		border-right: solid $lw $c-primary;
		margin-left: calc(-1 * $width);
		background: $c-base;
		transition: margin-left 500ms ease-in-out;

		&.open {
			margin-left: 0;
		}

		@media ($bp-m) {
			--width: 380px;
		}

		@media ($bp-xl) {
			border-radius: 0;
			position: unset;
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
