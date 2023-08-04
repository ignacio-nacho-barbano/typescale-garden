<script lang="ts">
	import { copyToClipboard } from '../functions';
	import { cssCode, seeCode } from '../stores/config';
	import Button from './Button.svelte';
</script>

<aside class="code-group {$seeCode && 'visible'}">
	<code>
		{$cssCode}
	</code>
	<Button on:click={() => copyToClipboard($cssCode)} cls="copy-btn">Copy Code!</Button>
</aside>

<style lang="scss">
	.code-group {
		z-index: 4;
		position: fixed;
		right: 100vw;
		background: $c-base;
		top: 0;
		bottom: 0;
		width: fit-content;
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
		}

		:global(.copy-btn) {
			position: sticky;
			bottom: 0;
		}
	}
</style>
