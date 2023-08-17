<script lang="ts">
	import Briefcase from 'svelte-material-icons/BriefcaseOutline.svelte';
	import CodeTags from 'svelte-material-icons/CodeTags.svelte';
	import Up from 'svelte-material-icons/PanUp.svelte';
	import Account from 'svelte-material-icons/AccountOutline.svelte';
	import type { Route } from '../models';
</script>

<nav class="tabs">
	<menu>
		<slot />
	</menu>
	<div class="gradient-border" />
</nav>

<style lang="scss">
	nav.tabs {
		backdrop-filter: blur(12px);
		bottom: 0%;
		display: flex;
		background: none;
		position: relative;

		menu {
			display: flex;
			gap: $s3;
			justify-content: space-around;
			list-style: none;
			height: 100%;
			justify-content: flex-start;
		}
		.gradient-border {
			bottom: 1px;
			position: absolute;
		}
	}
</style>
