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
		// A cap, not a fixed height: a short modal (the pairing one) should be as tall as
		// its content rather than a 95vh box with everything crammed at the top, and a
		// tall one (the export code) still gets the whole viewport minus the margin.
		// `fit-content` and not `auto`: a modal <dialog> is `position: fixed; inset: 0`,
		// so `height: auto` resolves against that and fills the viewport regardless.
		height: fit-content;
		max-height: calc(100vh - 5vh);
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
		// Natural height. It used to be `flex: 1 1`, which made the header absorb every
		// spare pixel of the dialog and pushed the content down by whatever was left over
		// — a ~140px gap under the title in any modal whose content does not itself grow.
		flex: 0 0 auto;
		justify-content: space-between;
		margin-bottom: $s4;
		gap: $sd6;
	}
	.content {
		display: flex;
		flex-direction: column;
		// Takes the leftover height and is allowed to be shorter than its contents, so
		// whatever inside it declares `overflow: auto` becomes the scroller instead of
		// the content spilling out of the dialog.
		flex: 1 1 auto;
		min-height: 0;
		overflow: hidden;
	}
</style>
