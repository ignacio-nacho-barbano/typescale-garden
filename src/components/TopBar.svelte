<script lang="ts">
	import Logo from '../../static/logo.svg';
	import LogoIso from '../../static/nacho-barbano.svg';
	import { getInTouch } from '../routes/routes';
	import Button from './Button.svelte';
	import Nav from './Nav.svelte';
</script>

<div class="top-bar">
	<div class="container">
		<a href="/" class="logo" aria-label="Home">Typescale Grip</a>
		<Nav />
		<!-- <Button cls="cta" to={getInTouch.url}>{getInTouch.name}</Button> -->
	</div>
	<div class="gradient-border" />
</div>

<style lang="scss">
	.gradient-border {
		position: absolute;
		bottom: 0;
	}
	.top-bar {
		flex: 1 0 auto;
		z-index: 4;
		background-color: hsla(0, 0%, 100%, 0);
		backdrop-filter: blur(12px);
		color: var(--green-1);
		height: $s7;
		width: 100vw;
		display: flex;
		flex-direction: column;
		justify-content: space-evenly;
		align-items: center;
		transition: height 300ms;

		.container {
			display: flex;
			gap: 12px;
			align-items: center;
			justify-content: flex-start;
			align-self: stretch;
			:global(.cta) {
				margin-left: auto;
				display: none;

				@media ($bp-xl) {
					display: flex;
				}
			}
		}

		:global(nav) {
			display: none;
		}

		a {
			display: flex;
			justify-content: center;
			gap: $s2;
			align-items: center;
			text-decoration: none;

			&.logo {
				font-size: 24px;
				letter-spacing: 0.1em;
			}
		}

		@media screen and (min-width: 921px) {
			& :global(nav) {
				display: block;
				margin-left: auto;
			}
		}
	}
</style>
