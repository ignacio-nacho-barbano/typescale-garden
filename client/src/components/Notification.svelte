<script lang="ts">
	import type { Notification } from "../models";
	import { removeNotification } from "../stores/notifications";
	import Button from "./Button.svelte";

	export let data: Notification;
</script>

<div class="notification glass shadow-high fade-in">
	<p class="body-2">{data.text}</p>
	<Button leadIcon="Close" size="s" on:click={() => removeNotification(data.id)} />
	<p class="tooltip secondary">{data.timestamp.toLocaleTimeString()}</p>
</div>

<style lang="scss">
	.notification {
		border: solid $c-primary $lw;
		padding: $s4 $s5;
		border-radius: $s4;
		position: relative;

		:global(.btn.icon.s) {
			position: absolute;
			right: -$s3;
			top: -$s3;
		}
	}
</style>
