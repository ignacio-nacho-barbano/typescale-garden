<script lang="ts">
	import { loadedTypescale } from "../../stores/typescales";
	import { storedTypescales } from "../../stores/typescales";
	import Button from "../Button.svelte";
	import Menu from "../Menu.svelte";
	import Select from "../Select.svelte";

	let open = false;
</script>

<Button size="s" type="outline" on:click={() => (open = !open)}>Load</Button>
<Menu bind:open>
	<Select
		label="Preset"
		id="preset"
		bind:value={$loadedTypescale.id}
		options={$storedTypescales.map(({ name, id }) => ({ label: name, value: id }))}
	/>
</Menu>

<style lang="scss">
	.controls {
	}
</style>
