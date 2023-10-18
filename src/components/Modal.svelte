<script lang="ts">
	export let title = '';
	export let open = false;
</script>

<div class="modal glass shadow-high" class:open>
	<h1>{title}</h1>
	<Button leadIcon="close" />
	<slot />
</div>

<style lang="scss">
	.modal {
		position: fixed;
	}
</style>
