<script lang="ts">
	import Button from './Button.svelte';

	export let title = '';
	export let open = false;
	let dialog: HTMLDialogElement;

	$: {
		if (dialog) {
			if (open) {
				dialog.showModal();
			} else {
				dialog.close();
			}
		}
	}

	$: {
		if (dialog) {
			dialog.addEventListener('close', () => {
				console.log('close event', { open });
				open = false;
			});
		}
	}
</script>

<dialog bind:this={dialog} class:open class=" modal glass shadow-high">
	<div class="title-bar">
		<h1>{title}</h1>
		<Button leadIcon="Close" on:click={() => (open = false)} />
	</div>
	<div class="content">
		<slot />
	</div>
</dialog>

<style lang="scss">
	.modal {
		top: 5vh;
		bottom: 5vh;
		right: 5vh;
		left: 5vh;
		width: auto;
		height: auto;
		flex-direction: column;
		padding: $s5;
		border-radius: $s5;
		background-color: $c-base;
		overflow: hidden;

		&.open {
			display: flex;
		}

		&::backdrop {
			background-image: $c-text-sl;
			backdrop-filter: blur(5px);
		}
	}

	.title-bar {
		display: flex;
		flex: 1 1;
		justify-content: space-between;
		margin-bottom: $s5;
	}

	.content {
		position: relative;
		overflow: auto;
	}
</style>
