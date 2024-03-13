<script lang="ts">
	import { storedTypescales } from "../stores/typescales";
	import Button from "./Button.svelte";
</script>

<h1>Available Typescales</h1>
<ul>
	{#each $storedTypescales as { name, authorId }}
		<li>{name} <span class="body-2">by</span> {authorId}</li>
	{/each}
</ul>
<Button on:click={() => {}}>Add New</Button>

<style lang="scss">
</style>
