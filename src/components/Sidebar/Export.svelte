<script lang="ts">
	import { json } from '@sveltejs/kit';
	import { copyToClipboard } from '../../functions';
	import { cssCode, designTokens } from '../../stores/config';
	import Button from '../Button.svelte';
	import Tab from '../Tab.svelte';
	import Tabs from '../Tabs.svelte';
	type Option = 'CSS' | 'Design Tokens';
	let currentView: Option = 'CSS';
	const tabs: Option[] = ['CSS', 'Design Tokens'];
</script>

<Tabs>
	{#each tabs as tab}
		<Tab active={currentView === tab}>
			<button on:click={() => (currentView = tab)}>{tab}</button>
		</Tab>
	{/each}
</Tabs>

{#if currentView === tabs[0]}
	<code class="tooltip">
		{$cssCode}
	</code>
	<Button on:click={() => copyToClipboard($cssCode, 'CSS Code')} cls="copy-btn">Copy Code!</Button>
{:else}
	<code class="tooltip">
		{$designTokens}
		<Button on:click={() => copyToClipboard($designTokens, 'Design Tokens')} cls="copy-btn"
			>Copy Tokens!</Button
		>
	</code>
{/if}

<style lang="scss">
	.export-block {
		z-index: 4;
		position: fixed;
		right: 100vw;
		background: $c-primary;
		top: 0;
		bottom: 0;
		max-width: 50vw;
		width: 50vw;
		padding: $s6 $s6 $s5 $s5;
		height: 100vh;
		overflow: auto;
		display: flex;
		flex-direction: column;
		border-left: solid 1px $c-accent;

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
