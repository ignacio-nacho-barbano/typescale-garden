<script lang="ts">
	import { PUB_FEATURE_FLAGS } from "$env/static/public";
	import { accordionStates, sidebarOpen } from "../../stores/app";
	import Accordion from "../Accordion.svelte";
	import LoadControl from "../FileControls/LoadControl.svelte";
	import SaveControl from "../FileControls/SaveControl.svelte";
	import Contrast from "./Contrast.svelte";
	import Export from "./Export.svelte";
	import Parameters from "./Parameters.svelte";

	const isServer = !globalThis.window;
</script>

<section id="sidebar" class:open={$sidebarOpen} class:isServer class="side-bar shadow-high">
	<div class="scrollable-area">
		<div class="settings-title">
			<h2 class="title-6">Settings</h2>
		</div>

		<Accordion bind:open={$accordionStates.file}>
			<span slot="title">File</span>
			<div slot="content" class="file-buttons">
				<LoadControl />
				<SaveControl />
			</div>
		</Accordion>
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
	</div>
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
		top: calc($s6 + $s3);
		bottom: $s4;
		left: 0;
		border-radius: 0 $s5 $s5 0;
		min-width: $width;
		max-width: $width;
		overflow: hidden;
		border: solid $lw $c-primary;
		border-left: none;
		margin-left: calc(-1 * $width);
		background: $c-base;
		transition: margin-left 500ms ease-in-out;

		.scrollable-area {
			display: flex;
			flex-direction: column;
			overflow: auto;
			height: 100%;
			width: 100%;

			:global(> section:first-of-type) {
				z-index: 10;
			}
		}

		@mixin open-rules {
			margin-left: 0;
		}

		&.isServer {
			@media ($bp-xl) {
				@include open-rules;
			}
		}

		&.open {
			@include open-rules;
		}

		@media ($bp-m) {
			--width: 380px;
		}

		@media ($bp-xl) {
			border-top: none;
			border-bottom: none;
			border-radius: 0;
			position: unset;
			box-shadow: none;
		}
	}

	.file-buttons {
		position: relative;
		display: flex;
		align-items: center;
		min-height: $s6;
		max-height: $s6;
		gap: $s3;
		padding: 0 $s4;

		:global(.floating-menu-wrapper) {
			margin-top: -$s4;
			position: fixed;
		}
	}
</style>
