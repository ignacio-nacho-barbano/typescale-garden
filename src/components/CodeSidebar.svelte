<script lang="ts">
	import { json } from '@sveltejs/kit';
	import { copyToClipboard } from '../functions';
	import { cssCode, designTokens, seeCode } from '../stores/config';
	import Button from './Button.svelte';
	import Tab from './Tab.svelte';
	import Tabs from './Tabs.svelte';
	type Option = 'CSS' | 'Design Tokens';
	let currentView: Option = 'CSS';
	const tabs: Option[] = ['CSS', 'Design Tokens'];
</script>

<aside class="code-group {$seeCode && 'visible'}">
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
		<Button on:click={() => copyToClipboard($cssCode, 'CSS Code')} cls="copy-btn">Copy Code!</Button
		>
	{:else}
		<code class="tooltip">
			{$designTokens}
			<Button on:click={() => copyToClipboard($designTokens, 'Design Tokens')} cls="copy-btn"
				>Copy Tokens!</Button
			>
		</code>
	{/if}
</aside>

<style lang="scss">
	.code-group {
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
		opacity: 0;
		border-left: solid 1px $c-accent;

		&.visible {
			opacity: 1;
			right: 0;
		}

		code {
			white-space: break-spaces;
			line-break: anywhere;
		}

		:global(.copy-btn) {
			position: sticky;
			bottom: 0;
		}
	}
</style>
