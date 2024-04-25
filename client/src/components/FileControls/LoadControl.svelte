<script lang="ts">
	import { onMount } from "svelte";
	import { deleteTypescale } from "../../functions/deleteTypescale";
	import { fetch } from "../../stores/fetch";
	import { loadedTypescaleId, storedTypescales } from "../../stores/typescales";
	import Button from "../Button.svelte";
	import Menu from "../Menu.svelte";

	let open = false;
	let loading = true;
	onMount(() => {
		setTimeout(() => {
			loading = false;
		}, 30000);
	});
</script>

<div class="wrapper">
	<Button size="s" type="outline" on:click={() => (open = !open)}>Load</Button>
	<Menu bind:open>
		{#if loading && !$storedTypescales?.length}
			<p class="tooltip">...Loading</p>
		{:else if !$storedTypescales?.length}
			<p class="tooltip">The app could not load saved typescales, please reload the page.</p>
		{:else}
			<ul class="typescales-list">
				{#each $storedTypescales as ts}
					<li>
						<button
							on:click={() => {
								loadedTypescaleId.set(ts.id);
								open = false;
							}}
							><b class="body-2">{ts.name}</b><span class="tooltip">
								by {ts.authorId === "typescale-garden" ? "Typescale Garden" : "You"}
							</span></button
						>
						{#if ts.authorId !== "typescale-garden"}
							<Button
								size="s"
								alt="delete this typescale"
								leadIcon="Delete"
								on:click={() => deleteTypescale($fetch, ts.id)}
							/>
						{/if}
					</li>
				{/each}
			</ul>
		{/if}
	</Menu>
</div>

<style lang="scss">
	.wrapper {
		z-index: 1;
		position: relative;

		.typescales-list {
			list-style: none;
			min-width: 240px;
			max-width: 280px;
			display: flex;
			flex-direction: column;
			overflow: auto;
			gap: $s3;
			max-height: 50dvh;
			padding-right: $s3;

			li {
				display: flex;
				min-height: 60px;
				max-height: 60px;
				overflow: hidden;
				padding-right: $s1;
				justify-content: space-between;
				align-items: center;
				border-bottom: $c-primary solid $lw;
				:global(.btn) {
					opacity: 0;
					margin-right: -50px;
					transition: all ease-in-out 200ms;
				}

				&:hover {
					button span {
						line-height: 1rem;
						opacity: 1;
					}
					:global(.btn) {
						opacity: 1;
						display: flex;
						margin-right: 0;
					}
				}
			}

			button {
				color: $c-text-ml;
				text-align: left;
				padding: $s2;
				overflow: hidden;
				text-overflow: ellipsis;
				white-space: nowrap;
				background: none;
				border: none;
				background-repeat: no-repeat;
				background-position-x: -300px;
				background-image: linear-gradient(30deg, $c-primary, transparent 50%);
				transition: background-position-x 200ms ease-in-out;

				text-wrap: nowrap;
				text-overflow: ellipsis;
				background-color: none;

				span {
					color: $c-text-sl;
					line-height: 0;
					opacity: 0;
					display: block;
					transition: 300ms ease-in-out;
				}

				&:hover {
					background-position-x: 0;
					span {
						line-height: 1rem;
						opacity: 1;
					}
				}
			}
		}
	}
</style>
