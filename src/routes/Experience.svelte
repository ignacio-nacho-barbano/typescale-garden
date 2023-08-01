<script lang="ts">
	import ExperienceBlock from '../components/ExperienceBlock.svelte';
	import { onMount } from 'svelte';

	import Button from '../components/Button.svelte';
	import { routes } from './routes';
	import { experiences, college, Breakpoints } from '../constants';

	let viewing = 0;
	let visible = experiences.map((_, i) => !i);
	let screenWidth: number;

	const scrollTo = (id: string) => {
		const scrollableArea = document.getElementById('scrollable-area');

		if (scrollableArea !== null) {
			const targetPosition = document.getElementById(id)?.offsetLeft || 0;

			scrollableArea.scrollBy({
				left: targetPosition - scrollableArea.scrollLeft - 136,
				behavior: 'smooth'
			});
		}
	};

	const setViewingBasedOnScroll = (id: string, isIntersecting: boolean) => {
		const index = experiences.findIndex((exp) => 'position-' + exp.id === id);

		if (isIntersecting) viewing = index;
		visible[experiences.findIndex((exp) => 'position-' + exp.id === id)] = isIntersecting;
	};

	const scrollToIndex = (i: number | 'next' | 'prev') => {
		if (typeof i === 'number') {
			viewing = i;
		} else if (i === 'prev') {
			if (viewing > 0) {
				viewing = viewing - 1;
			} else {
				viewing = experiences.length - 1;
			}
		} else {
			if (viewing < experiences.length - 1) {
				viewing = viewing + 1;
			} else {
				viewing = 0;
			}
		}

		scrollTo('position-' + experiences[viewing].id);
	};

	const handleIntersect = (entry: IntersectionObserverEntry) => {
		const targetId = entry.target.id;

		setViewingBasedOnScroll(targetId.replace('-trigger', ''), entry.isIntersecting);
	};

	onMount(() => {
		const experienceBlocks = experiences.map(({ id }) =>
			document.getElementById('position-' + id + '-trigger')
		);

		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach(handleIntersect);
			},
			{ threshold: 1 }
		);

		experienceBlocks.forEach((item) => observer.observe(item!));
	});
</script>

<svelte:window bind:innerWidth={screenWidth} />
<article id={routes[1].id}>
	<section class="previous-exp container">
		<h1 class="title4">Experience</h1>
		<div class="timeline">
			<p class="title6">Present</p>
			<Button cls="timeline-btn" leadIcon="ArrowLeft" on:click={() => scrollToIndex('prev')} />
			{#each experiences as { company, logo }, i}
				<button
					class="glass {viewing === i ? 'active' : ''}"
					on:click|preventDefault={() => scrollToIndex(i)}
					>{#if typeof logo === 'function'}
						<svelte:component this={logo} />
					{:else}
						<img src={logo + ''} alt={company + ''} />
					{/if}</button
				>
				<!-- {#if i - 1 < experiences.length}
					<NextLeft size="20" />
				{/if} -->
			{/each}
			<Button cls="timeline-btn" leadIcon="ArrowRight" on:click={() => scrollToIndex('next')} />
			<p class="title6">2019</p>
		</div>
	</section>
	<section class="experience-blocks">
		<!-- <div class="carousel-controls container" /> -->
		<div id="scrollable-area" class="custom-scrollbar">
			{#each experiences as experience, i}
				<ExperienceBlock active={visible[i]} data={experience} />
			{/each}
		</div>
	</section>
	<section class="container education">
		<div class="text-container">
			<h2 class="title4">Education</h2>
			<ExperienceBlock data={college} active={screenWidth > Breakpoints.M} />
		</div>
	</section>
</article>

<style lang="scss">
	article {
		display: flex;
		flex-direction: column;
		align-items: center;
	}
	.header-content {
		align-items: flex-start;
		display: flex;
		flex-direction: column;
		gap: $s3;
		margin-top: $s5;
	}

	.timeline {
		display: none;
		align-items: center;
		justify-content: center;
		gap: $sd4;
		flex: 1;
		flex-wrap: wrap;
		@media ($bp-xl) {
			display: flex;
		}

		p {
			display: none;
			margin-bottom: 0;
			&:first-of-type {
				margin-right: auto;
			}
			&:last-of-type {
				margin-left: auto;
			}

			@media ($bp-xl) {
				display: block;
			}
		}

		:global(.timeline-btn) {
			@media ($bp-m) {
				display: none;
			}
		}

		button {
			padding: $s2;
			flex: 0 0 auto;
			width: $sd7;
			height: $sd7;
			background-color: rgba(255, 255, 255, 0.2);
			background-blend-mode: hard-light;
			border-radius: $s4;
			border: solid 2px transparent;
			transition: 300ms;

			&:hover {
				transform: translate(2px, -2px);
			}

			&:active {
				background: $c-accent;
			}

			&.active {
				background-color: rgba(255, 255, 255, 0.4);
				border-color: $c-accent;
			}
		}

		img,
		:global(svg) {
			width: 100%;
			height: 100%;
			object-fit: contain;
		}
	}

	.carousel-controls {
		display: flex;
		gap: $s4;
		align-items: center;
		justify-content: center;
	}

	.previous-exp {
		margin-top: 0;
		margin-bottom: $s6;
		align-self: stretch;
	}

	.experience-blocks {
		width: 100vw;
	}

	.education {
		margin-top: $sd7;
	}

	#scrollable-area {
		padding: 0 $s5 0 $s4;
		max-width: 100%;
		flex-direction: column;
		display: flex;
		gap: $s1;

		@media ($bp-l) {
			padding: 0 $sd8;
			gap: $s8;
			flex-direction: row;
			overflow-x: auto;
			overflow-y: visible;
			scroll-snap-type: mandatory;
		}
	}
</style>
