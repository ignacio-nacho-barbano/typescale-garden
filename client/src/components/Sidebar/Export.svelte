<script lang="ts">
	import { copyToClipboard, downloadFile } from "../../functions";
	import { cssCode, designTokens } from "../../stores/config";
	import Button from "../Button.svelte";
	import Code from "../Code.svelte";
	import Modal from "../Modal.svelte";
	import Tab from "../Tab.svelte";
	import Tabs from "../Tabs.svelte";

	const fileNames = { css: "typography.css", json: "typography-tokens.json" };

	let modalOpen = false;
	let activeTab: "css" | "json" = "css";

	const onDownload = () => {
		if (activeTab === "css") {
			downloadFile(fileNames.css, $cssCode);
		} else {
			downloadFile(fileNames.json, $cssCode);
		}
	};
	const onCopy = () => {
		if (activeTab === "css") {
			copyToClipboard($cssCode, "CSS Code");
		} else {
			copyToClipboard($designTokens, "Design Tokens");
		}
	};
</script>

<Modal bind:open={modalOpen} title="Generated typescale CSS">
	<div class="modal-content">
		<p class="body-2">
			You're almost setup to use your new typescale, you'll need to use this css file in your code,
			as well as to import the design tokens into Figma trough our plugin.
		</p>
		<Tabs
			><Tab active={activeTab === "css"} click={() => (activeTab = "css")}>{fileNames.css}</Tab><Tab
				active={activeTab === "json"}
				click={() => (activeTab = "json")}>{fileNames.json}</Tab
			></Tabs
		>
		<Code>
			{#if activeTab === "css"}
				{$cssCode}
			{:else}
				{$designTokens}
			{/if}
		</Code>
		<div class="buttons">
			<Button size="s" leadIcon="download" cls="copy-btn" on:click={onDownload}
				>Download .{activeTab}</Button
			>
			<Button size="s" leadIcon="content_copy" cls="copy-btn" on:click={onCopy}>Copy Styles</Button>
			<Button
				size="s"
				cls="copy-btn"
				to="https://www.figma.com/community/plugin/1318298863966194157/typescale-garden-import-tool"
				>Use Figma Plugin</Button
			>
		</div>
	</div>
</Modal>

<div class="export-block">
	<Button leadIcon="data_object" size="s" on:click={() => (modalOpen = true)}>See Code</Button>
	<Button size="s" on:click={() => copyToClipboard($cssCode, "CSS Code")} cls="copy-btn"
		>Copy CSS</Button
	>
	<Button size="s" on:click={() => copyToClipboard($designTokens, "Design Tokens")} cls="copy-btn"
		>Copy<span class="notranslate"> Tokens</span></Button
	>
	<Button
		size="s"
		to="https://www.figma.com/community/plugin/1318298863966194157/typescale-garden-import-tool"
		cls="copy-btn"
		>Use Figma<span class="notranslate"> Plugin</span>
	</Button>
</div>

<style lang="scss">
	:global(.modal-content) {
		overflow: hidden;
		display: flex;
		flex-direction: column;
		flex: 1 1;

		p {
			margin-bottom: $s4;
			display: none;

			@media ($bp-m) {
				display: block;
			}
		}

		:global(.buttons) {
			display: flex;
			gap: $s4;
			padding: $s3;
			width: fit-content;
			justify-content: center;
			margin-top: $s5;
			margin-left: auto;
			flex-wrap: wrap;
		}

		:global(.code-block) {
			flex: 1 1;
			overflow: auto;
		}

		// making it look lit file tabs

		:global(.tab) {
			background-color: rgb(94, 94, 94);
			color: rgb(212, 212, 212);
			border-radius: $s3 $s3 0 0;
			padding: 0 $s3 0;

			&:hover::before {
				background: currentColor;
			}
		}

		:global(.tab.active) {
			color: white !important;
			background: rgb(65, 59, 59);

			&::before {
				background: currentColor;
			}
		}
	}

	.export-block {
		display: grid;
		gap: $s3 $s2;
		grid-template-columns: auto auto;
		grid-template-rows: auto auto;

		:global(button:last-child),
		:global(button:first-child) {
			grid-column: span 2;
		}
	}
</style>
