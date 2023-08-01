<script lang="ts">
	import Nacho from '../../static/audio-nacho.svg';
	import Barbano from '../../static/audio-barbano.svg';
	import TriangleR from '../../static/triangle-r.svg';
	import TriangleL from '../../static/triangle-l.svg';

	import Profile from '../../raw-assets/profile.png?w=280,350&format=webp';
	import Button from '../components/Button.svelte';
	import { routes } from './routes';
</script>

<article id={routes[0].id} class="screen-frame">
	<div class="screen-half left">
		<TriangleL class="triangle-svg" id="triangle-l-1" aria-hidden />
	</div>
	<div class="screen-half right">
		<TriangleR class="triangle-svg" id="triangle-r-1" aria-hidden />
	</div>
	<header>
		<div class="fold-frame">
			<div class="picture-frame">
				<div class="circle gradient" />
				<div class="circle red" />
				<div class="circle blue" />
				<img
					srcset={Profile}
					class="headshot main"
					sizes="(max-width: 728px) 200px, 400px"
					alt="a headshot of me"
				/>
				<img
					srcset={Profile}
					class="headshot red-tint"
					sizes="(max-width: 728px) 200px, 400px"
					alt=""
				/>
				<img
					srcset={Profile}
					class="headshot blue-tint"
					sizes="(max-width: 728px) 200px, 400px"
					alt=""
				/>
			</div>
			<Nacho id="name-logo" class="big-text name" aria-hidden />
			<Barbano id="surname-logo" class="big-text surname" aria-hidden />
		</div>
		<h1 class="title6">I'm Nacho Barbano</h1>
		<h2 class="title6">Full Stack Developer<br />& Product Designer</h2>
		<Button cls="triangle-indicator" leadIcon="PanDown" to={routes[1].url} />
	</header>
</article>

<style lang="scss">
	@use 'sass:color';
	$triangle-offset: 25%;
	@keyframes triangle-r-in-mobile {
		0% {
			z-index: 6;
			top: 0;
			transform: translate(0, -100vh);
		}
		100% {
			top: 0;
			transform: translate(50%);
		}
	}
	@keyframes triangle-l-in-mobile {
		0% {
			z-index: 6;
			bottom: 0;
			transform: translate(0, 100vh);
		}

		100% {
			bottom: 0;
			transform: translate(-50%);
		}
	}
	@keyframes triangle-r-in {
		0% {
			z-index: 6;
			left: 0;
			transform: translate(-$triangle-offset, -100vh);
		}

		50% {
			z-index: 6;
			left: 0;
			transform: translate(-$triangle-offset);
		}

		100% {
			left: 0;
			transform: translate(30%);
		}
	}
	@keyframes triangle-l-in {
		0% {
			z-index: 6;
			right: 0;
			transform: translate($triangle-offset, 100vh);
		}

		50% {
			z-index: 6;
			right: 0;
			transform: translate($triangle-offset);
		}

		100% {
			right: 0;
			transform: translate(-30%);
		}
	}

	.screen-frame {
		position: relative;
		width: 100vw;
		height: 170vw;
		overflow: hidden;

		@media ($bp-s) {
			height: 100vh;
		}
	}
	.screen-half {
		position: absolute;
		width: 100vw;
		height: 50vh;

		&.left {
			top: 50vh;
			@media ($bp-m) {
				left: 0;
				top: 0;
			}
		}

		&.right {
			top: 0;
			@media ($bp-m) {
				right: 0;
			}
		}

		@media ($bp-m) {
			top: 0;
			width: 50vw;
			height: 100vh;
		}
	}
	:global(.triangle-svg) {
		position: absolute;
		width: 100%;
		height: fit-content;

		@media ($bp-m) {
			width: unset;
			height: 100%;
		}
	}
	:global(#triangle-r-1) {
		animation: triangle-r-in-mobile 900ms both ease-in-out;
		@media ($bp-m) {
			animation: triangle-r-in 1200ms both ease-in-out;
		}
	}
	:global(#triangle-l-1) {
		animation: triangle-l-in-mobile 900ms both ease-in-out;
		@media ($bp-m) {
			animation: triangle-l-in 1200ms both ease-in-out;
		}
	}
	@keyframes glitch-in-circles {
		0% {
			opacity: 0.3;
			filter: blur(20px);
			transform: translateX(-1%) rotate(360deg);
		}

		70% {
			opacity: 1;
			transform: translate(1%, 1%);
		}
	}

	@keyframes glitch-in {
		0% {
			opacity: 0.3;
			filter: blur(2px);
		}

		100% {
			filter: blur(1px);
			bottom: 0;
			opacity: 1;
		}
	}

	header {
		position: absolute;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
		padding-top: $sd8;

		h1 {
			display: none;
		}
		h2 {
			text-align: right;
			margin: 0 0 0 auto;
		}
	}

	.fold-frame {
		min-width: 256px;
		width: 77.7vw;
		max-width: 800px;
		aspect-ratio: 2/1;
		position: relative;
		animation: fade 600ms 900ms both;
		margin-bottom: $sd5;

		@media ($bp-m) {
			width: 55.5vw;
		}
	}

	.picture-frame {
		position: absolute;
		width: 48%;
		aspect-ratio: 1/1;
		left: 0;
		bottom: 0;

		.circle {
			position: absolute;
			width: 100%;
			height: 100%;
			border-radius: 50%;
		}

		.gradient {
			z-index: 1;
			background: linear-gradient(135deg, $c-accent 5%, $c-base 90%);
		}

		.red,
		.blue {
			animation: glitch-in-circles 1600ms 2s alternate infinite both;
		}
		.red {
			left: -2%;
			top: -2%;
			border: $sd1 solid red;
		}

		.blue {
			right: -2%;
			bottom: -2%;
			border: $sd1 solid blue;
		}
	}

	.headshot {
		bottom: 0;
		left: 15%;
		position: absolute;
		width: 70%;
		clip-path: ellipse(80% 50% at 50% 50%);

		&.main {
			z-index: 3;
		}

		&.blue-tint,
		&.red-tint {
			mix-blend-mode: hard-light;
			z-index: 2;
			animation: glitch-in 800ms 1.4s alternate infinite both;

			@media not (prefers-reduced-motion) {
				animation-play-state: paused;
			}
		}

		&.red-tint {
			left: 13%;
			bottom: 2%;
			filter: blur(0.1px) hue-rotate(311deg) saturate(3);
		}

		&.blue-tint {
			left: 17%;
			bottom: -3%;
			filter: blur(0.1px) hue-rotate(20deg) saturate(3);
		}
	}

	:global(.big-text) {
		position: absolute;
		width: 100%;
		height: 50%;
		right: -3%;
		z-index: 3;

		$sc: color.adjust(hsl(184, 86%, 52%), $alpha: -0.4);

		filter: drop-shadow(0.5px 2px 12px $sc) drop-shadow(-1px 4px 8px $sc) drop-shadow(0 1px 4px $sc)
			drop-shadow(0 0 2px $sc);
	}

	:global(.big-text *) {
		fill: linear-gradient($c-base, transparent);
		stroke-width: 4px;
		stroke: $c-accent;
	}

	:global(.big-text.name) {
		bottom: 25%;
	}
	:global(.big-text.surname) {
		bottom: -10%;
	}

	section.intro {
		margin-top: $s7;
		z-index: 2;
	}

	@keyframes triangle {
		0% {
			opacity: 0;
		}

		100% {
			opacity: 1;
		}
	}

	:global(.triangle-indicator) {
		margin: $sd5 auto 0;
		animation: fade 600ms 2s ease-in-out both;
	}
</style>
