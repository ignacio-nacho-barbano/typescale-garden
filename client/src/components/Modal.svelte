<script lang="ts">
	import { toggle_class } from "svelte/internal";
	import Button from "./Button.svelte";

	export let title = "";
	export let open = false;
	let dialog: HTMLDialogElement;
	let body: HTMLElement;

	$: {
		if (dialog && body) {
			if (open) {
				dialog.showModal();
				body.classList.add("dialog-open");
			} else {
				dialog.close();
				body.classList.remove("dialog-open");
			}
		}
	}

	$: {
		if (dialog) {
			body = document.body;

			dialog.addEventListener("close", () => {
				open = false;
			});
		}
	}
</script>

<dialog bind:this={dialog} class:open class=" modal glass shadow-high">
	<div class="title-bar">
		<h1 class="title-4">{title}</h1>
		<Button leadIcon="Close" alt="Close {title} modal" on:click={() => (open = false)} />
	</div>
	<div class="content">
		<slot />
	</div>
</dialog>

<style lang="scss">
	.modal {
		margin: auto;
		height: calc(100vh - 5vh);
		flex-direction: column;
		padding: $sd5;
		border-radius: $s5;
		background-color: $c-base;
		overflow: hidden;
		width: calc(100vw - 5vh);
		max-width: 1000px;

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
		margin-bottom: $s4;
		gap: $sd6;
	}
	.content {
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}
</style>
