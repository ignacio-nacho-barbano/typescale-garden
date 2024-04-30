<script lang="ts">
	export let size: "24" | "32" = "24";
	export let cls = "";
</script>

<div
	role="img"
	style="font-size: {size}px; max-width: {size}px"
	class="{cls} notranslate material-icon"
>
	<slot />
</div>

<style lang="scss">
	div.material-icon {
		text-align: center;
		line-height: 100%;
	}
</style>
