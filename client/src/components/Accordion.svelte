<script lang="ts">
	import Icon from "./Icon.svelte";

	export let open = true;
</script>

<section class="accordion" class:open>
	<button on:click={() => (open = !open)} class="glass title-bar"
		><slot name="title" /><Icon cls="drop-icon">arrow_drop_down</Icon></button
	>
	<div class="content">
		<slot name="content" />
	</div>
</section>

<style lang="scss">
	.accordion {
		width: 100%;
		border-bottom: $lw solid $c-primary;

		.title-bar {
			height: $s6;
			padding: 0 $s4;
			align-items: center;
			display: flex;
			width: 100%;
			transition: margin-top ease-in-out 200ms;

			:global(.drop-icon) {
				margin-left: auto;
				transition: transform 400ms ease-in-out;
			}
		}

		button {
			background: none;
			border: none;
		}

		.content {
			padding: 0 $s3;
			max-height: 0;
			transform-origin: top;
			transform: rotateX(-90deg);
			opacity: 0;
			transition: ease-in-out 300ms;
		}

		&.open {
			border-bottom: $lw solid $c-accent;
			.title-bar {
				margin-top: $s2;
				:global(.drop-icon) {
					transform: rotateZ(-180deg);
				}
			}
			.content {
				opacity: 1;
				transform: rotateY(0);
				max-height: unset;
				margin: $s3 0;
				padding-bottom: $s4;
			}
		}
	}
</style>
