<script lang="ts">
	import '../scss/global.scss';
	import TopBar from '../components/TopBar.svelte';
	import ConfigSidebar from '../components/ConfigSidebar.svelte';
	import CodeSidebar from '../components/CodeSidebar.svelte';
	import { baseUnit, visibleGrid } from '../stores/config';
	import NotificationsProjector from '../components/NotificationsProjector.svelte';
</script>

<TopBar />
<NotificationsProjector />
<div id="global-wrapper">
	<ConfigSidebar />
	<main id="main-content">
		<div
			class="grid-overlay"
			style="display: {$visibleGrid
				? 'block'
				: 'none'};		background-size: {$baseUnit}px {$baseUnit}px;"
		/>
		<slot />
	</main>
</div>
<CodeSidebar />

<!-- <Button
	cls="floating-cta"
	type="primary"
	to={getInTouch.url}
	leadIcon="Mail"
	alt={getInTouch.name}
/> -->
<!-- <Nav /> -->

<style lang="scss">
	#global-wrapper {
		display: flex;
		flex-direction: row;
		align-self: stretch;
		overflow: hidden;
	}
	main#main-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		overflow-y: auto;
		position: relative;
	}

	.grid-overlay {
		background-color: transparent;
		opacity: 0.3;
		left: 0;
		top: 0;
		background-repeat: repeat;
		background-image: linear-gradient(#444cf7 1px, transparent 1px),
			linear-gradient(to right, #444cf7 1px, transparent 1px);
		position: absolute;
		width: 100%;
		height: 100%;
	}

	:global(.btn.floating-cta.icon) {
		position: sticky;
		bottom: $s7;
		z-index: 7;
		left: calc(100vw - 72px);

		animation: fade 200ms 8s backwards;

		@media ($bp-xxxl) {
			left: calc(100vw - $s9);
		}
	}

	@media screen and (min-width: 920px) {
		:global(body nav) {
			display: none;
		}
	}
</style>
