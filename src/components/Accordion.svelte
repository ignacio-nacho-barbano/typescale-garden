<script lang="ts">
	import Icon from 'svelte-material-icons/MenuDown.svelte';

	export let open = true;
</script>

<section class="accordion" class:open>
	<button on:click={() => (open = !open)} class="glass title-bar"
		><slot name="title" /><Icon class="icon" size="32" /></button
	>
	<div class="content">
		<slot name="content" />
	</div>
</section>

<style lang="scss">
	.accordion {
		width: 100%;

		.title-bar {
			padding: $s3;
			display: flex;
			width: 100%;
			border-bottom: $lw solid $c-accent;

			:global(svg) {
				margin-left: auto;
				transition: transform 400ms ease-in-out;
			}
		}

		button {
			background: none;
			border: none;
		}

		.content {
			margin: $s3 0;
			padding: 0 $s3;
			height: 0;
			overflow: hidden;
			transition: height ease-in-out 20000ms;
		}

		&.open {
			.title-bar {
				border-bottom: $lw solid $c-primary;

				:global(svg) {
					transform: rotateZ(-180deg);
				}
			}
			.content {
				height: unset;
				overflow: unset;
			}
		}
	}
</style>
