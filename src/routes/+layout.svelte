<script lang="ts">
	import '../scss/global.scss';
	import TopBar from '../components/TopBar.svelte';
	import Nav from '../components/Nav.svelte';
	import { page } from '$app/stores';
	import Button from '../components/Button.svelte';
	import { getInTouch } from './routes';
</script>

<TopBar />
<main id="main-content">
	<slot />
</main>

<!-- <Button
	cls="floating-cta"
	type="primary"
	to={getInTouch.url}
	leadIcon="Mail"
	alt={getInTouch.name}
/> -->
<!-- <Nav /> -->

<style lang="scss">
	main {
		flex: 1;
		display: flex;
		flex-direction: column;
		padding: 0 0 84px;
		align-items: center;
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
