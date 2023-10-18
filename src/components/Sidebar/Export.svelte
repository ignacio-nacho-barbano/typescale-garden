<script lang="ts">
	import { copyToClipboard } from '../../functions';
	import { cssCode, designTokens } from '../../stores/config';
	import Button from '../Button.svelte';
	import Tab from '../Tab.svelte';
	import Tabs from '../Tabs.svelte';
	type Option = 'CSS' | 'Design Tokens';
	let currentView: Option = 'CSS';
	const tabs: Option[] = ['CSS', 'Design Tokens'];
</script>

<!-- <Tabs>
	{#each tabs as tab}
		<Tab active={currentView === tab}>
			<button on:click={() => (currentView = tab)}>{tab}</button>
		</Tab>
	{/each}
</Tabs> -->

<div class="export-block">
	<Button>See Tokens</Button>
	<Button>See Code</Button>
	<Button type="primary" on:click={() => copyToClipboard($cssCode, 'CSS Code')} cls="copy-btn"
		>Copy Styles</Button
	>
	<Button
		type="primary"
		on:click={() => copyToClipboard($designTokens, 'Design Tokens')}
		cls="copy-btn">Copy Tokens</Button
	>
</div>

<style lang="scss">
	.export-block {
		display: grid;
		gap: $s3 $s2;
		grid-template-columns: auto auto;
		grid-template-rows: auto auto;

		code {
			white-space: break-spaces;
			line-break: anywhere;
		}

		:global(.close-btn) {
			margin-left: auto;
		}

		:global(.copy-btn) {
			position: sticky;
			bottom: 0;
		}
	}
</style>
