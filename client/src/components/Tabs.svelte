<script lang="ts">
</script>

<nav class="tabs">
	<menu>
		<slot />
	</menu>
</nav>

<style lang="scss">
	nav.tabs {
		bottom: 0%;
		display: flex;
		position: relative;

		menu {
			display: flex;
			flex-wrap: wrap;
			justify-content: space-around;
			list-style: none;
			max-height: $s6;
			height: 100%;
			justify-content: flex-start;
		}
	}
</style>
