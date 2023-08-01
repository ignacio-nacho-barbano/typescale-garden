<script lang="ts">
	import Logo from '../../static/logo.svg';
	import LogoIso from '../../static/nacho-barbano.svg';
	import { getInTouch } from '../routes/routes';
	import Button from './Button.svelte';
	import Nav from './Nav.svelte';

	let y: number;
	$: scrolled = y > 120;
</script>

<div class="top-bar {scrolled ? 'scrolled' : ''}">
	<div class="container">
		<a href="/" class="logo" aria-label="Home">
			<Logo id="logo" />
			<LogoIso id="logo-iso" />
		</a>
		<Nav />
		<Button cls="cta" to={getInTouch.url}>{getInTouch.name}</Button>
	</div>
	<div class="gradient-border" />
</div>

<svelte:window bind:scrollY={y} />

<style lang="scss">
	.gradient-border {
		position: absolute;
		bottom: 0;
	}
	.top-bar {
		z-index: 4;
		background-color: hsla(0, 0%, 100%, 0);
		backdrop-filter: blur(12px);
		color: var(--green-1);
		position: fixed;
		top: 0;
		height: $s7;
		width: 100vw;
		display: flex;
		flex-direction: column;
		justify-content: space-evenly;
		align-items: center;
		transition: height 300ms;

		:global(#logo) {
			height: 40px;
			width: 40px;
		}

		:global(#logo-iso) {
			max-width: 33vw;
		}

		&.scrolled {
			height: $s6;
		}

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
		}

		@media screen and (min-width: 921px) {
			& :global(nav) {
				display: block;
				margin-left: auto;
			}
		}
	}
</style>
