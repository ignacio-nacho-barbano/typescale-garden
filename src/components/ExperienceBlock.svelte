<script lang="ts">
	import { Breakpoints } from '../constants';
	import type { Job } from '../models/Job';
	import Button from './Button.svelte';
	export let active: boolean = false;
	export let data: Job | Record<string, void> = {};
	const { id, company, description, endDate, startDate, location, position, logo, images, techs } =
		data;

	let screenWidth: number;
	let activeByClick = active;

	let setActiveFalse = () => (activeByClick = false);

	$: {
		if (screenWidth > Breakpoints.M) {
			setActiveFalse();
		}
	}
</script>

<svelte:window bind:innerWidth={screenWidth} />
<div
	id={`position-${id}`}
	class="experience-block {(active && screenWidth > Breakpoints.L) || activeByClick
		? 'active'
		: ''}"
>
	<div class="left-side">
		<div class="first-card">
			<h2 id={`position-${id}-trigger`} class="title4">{position}</h2>
			<h3 class="title5">at {company}</h3>
			<h4 class="location title6">{location}</h4>
			<h4 class="time title6">{startDate} - {endDate}</h4>
			<Button cls="more" trailIcon="ExpandRight" on:click={() => (activeByClick = !activeByClick)}
				>See {activeByClick ? 'Less' : 'More'}</Button
			>
		</div>
		<div class="company-logo">
			<div class="floating-frame" />
			<div class="background glass" />
			{#if typeof logo === 'function'}
				<svelte:component this={logo} />
			{:else}
				<img src={logo + ''} alt={company + ''} />
			{/if}
			<div class="floating-frame" />
		</div>
		<div class="description glass">
			<p>{@html description}</p>
		</div>
	</div>
	<!-- <div class="project-carousel">
		{#if techs && false}
			{#each techs as tech, i}
				<img src={`../../raw-assets/react-logo.png?w=500&format=webp`} alt={tech} />
			{/each}
		{/if}
	</div> -->
</div>

<style lang="scss">
	.experience-block {
		display: flex;
		position: relative;
		margin-top: $s4;
	}

	h3 {
		margin-bottom: $s4;
	}

	h4 {
		margin-bottom: 0;
	}

	.location {
		margin-bottom: $s2;
		color: $c-od-text-1;
	}

	.time {
		color: $c-od-text-1;
	}

	:global(.more.btn) {
		margin: $s4 auto 0;

		@media ($bp-l) {
			display: none !important;
		}
	}
	:global(.more.btn svg) {
		transition: transform 300ms ease-in-out;
	}

	.first-card,
	.company-logo,
	.description,
	.floating-frame,
	.background,
	.project-carousel img {
		border-radius: $sd5;
	}
	.left-side {
		min-width: 256px;
		max-width: 768px;
		display: flex;
		flex-wrap: wrap;
		justify-content: flex-end;
		align-content: flex-start;
		gap: 0 $sd5;

		@media ($bp-l) {
			min-width: 768px;
		}
	}

	.first-card {
		background: none;
		border: none;
		flex: 1;
		margin-right: auto;
		color: $c-od-text-1;
		padding: $s5 $s6 $s5 $s5;
		height: fit-content;
		background: linear-gradient(60deg, $c-primary, $c-accent 80%);

		h2 {
			margin-bottom: $s2;
		}
	}

	.company-logo {
		position: absolute;
		width: $sd8;
		height: $sd8;
		display: flex;
		align-items: center;
		justify-content: center;
		top: -$s4;
		right: -$s4;

		@media ($bp-xl) {
			top: unset;
			right: unset;
			position: relative;
		}

		:global(svg),
		img {
			position: relative;
			z-index: 1;
			width: 80%;
			height: 80%;
		}

		img {
			object-fit: contain;
		}

		.background {
			z-index: 1;
			width: 100%;
			height: 100%;
			background-color: rgba(255, 255, 255, 0.4);
			mix-blend-mode: hard-light;

			position: absolute;
		}

		.floating-frame {
			opacity: 0;
			transition: opacity, transform 300ms 0.5s;
			transform: translate(0, 0);
		}
	}

	.description {
		opacity: 0;
		padding: $s4 $s5;
		margin-top: -$s2;
		// margin-bottom: $s5;
		position: relative;
		z-index: -1;
		height: 0;
		left: -100px;
		top: -50%;
		transition: height opacity 300ms 0.5s;
		filter: blur(4px);

		@media ($bp-xl) {
			margin-top: -$s4;
			margin-left: $sd7;
		}
	}

	.project-carousel {
		overflow: hidden;

		img {
			width: 100%;
			object-fit: cover;
		}
	}

	.experience-block.active {
		.project-carousel {
			position: relative;
		}

		:global(.more.btn svg) {
			transform: rotateZ(90deg);
		}

		.description {
			opacity: 1;
			z-index: 1;
			left: 0;
			top: 0;
			height: fit-content;
			z-index: 1;
			filter: none;
		}

		.floating-frame {
			position: absolute;
			width: 100%;
			height: 100%;

			&:first-of-type {
				border: solid 2px $c-accent;
				transform: translate($s1, -$s1);
				z-index: 2;

				@media ($bp-xl) {
					opacity: 1;
					transform: translate($s3, -$s3);
				}
			}

			&:last-of-type {
				border: solid 2px $c-primary;
				transform: translate(-$s1, $s1);

				@media ($bp-xl) {
					opacity: 1;
					transform: translate(-$s3, $s3);
				}
			}
		}
	}
</style>
