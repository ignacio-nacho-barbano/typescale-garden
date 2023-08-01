<script lang="ts">
	import type { Skill } from '../models';

	export let data: Skill;
</script>

<li class="skill-block">
	<div class="graphic flex-center">
		{#if data.graphic}
			<svelte:component this={data.graphic} />
		{/if}
	</div>
	<p>{data.title}</p>
</li>

<style lang="scss">
	.skill-block {
		padding: $s3 $s5 $s3 $s3;
		list-style: none;
		display: flex;
		align-items: center;
		gap: $s3;
		transition: 300ms ease-in-out;
		border-radius: $s4;
		border: solid $lw $c-primary;
		width: 100%;

		&:hover {
			background: linear-gradient(45deg, $c-primary, transparent $s8);
			color: $c-accent;
			padding-top: $s5;
			padding-bottom: $s5;
			box-shadow: 0 2px 20px $c-primary, 0 0 2px $c-primary;

			.graphic {
				background-color: $c-accent;
				height: $s6;
				width: $s6;

				:global(svg) {
					width: $s5;
					height: $s5;
				}

				:global(svg path) {
					fill: $c-base;
				}
			}
		}
	}

	.graphic {
		border-radius: $s2;
		height: $sd6;
		width: $sd6;
		flex: 0 0 auto;
		background-color: $c-primary;
		transition: 300ms;

		:global(svg) {
			width: $sd5;
			height: $sd5;
		}

		:global(svg path) {
			transition: 300ms;
			fill: $c-accent;
		}
	}
</style>
