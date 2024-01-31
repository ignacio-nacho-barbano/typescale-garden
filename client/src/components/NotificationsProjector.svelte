<script lang="ts">
	import { notificationsQueue } from "../stores/notifications";
	import Notification from "./Notification.svelte";
</script>

<div class="notifications-projector">
	{#each $notificationsQueue as data}
		<Notification {data} />
	{/each}
</div>

<style lang="scss">
	.notifications-projector {
		position: fixed;
		bottom: $sd5;
		right: $sd5;
		z-index: 8;
		display: flex;
		flex-direction: column;
		gap: $s5;
	}
</style>
