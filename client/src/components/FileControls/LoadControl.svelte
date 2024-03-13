<script lang="ts">
	import { deleteTypescale } from "../../functions/deleteTypescale";
	import { fetch } from "../../stores/fetch";
	import { loadedTypescaleId, storedTypescales } from "../../stores/typescales";
	import Button from "../Button.svelte";
	import Menu from "../Menu.svelte";

	let open = false;
</script>

<div class="wrapper">
	<Button size="s" type="outline" on:click={() => (open = !open)}>Load</Button>
	<Menu bind:open>
		<ul class="typescales-list">
			{#each $storedTypescales as ts}
				<li>
					<button
						on:click={() => {
							loadedTypescaleId.set(ts.id);
							open = false;
						}}
						><b class="body-2">{ts.name}</b><br /><span class="tooltip">
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
	</Menu>
</div>

<style lang="scss">
	.wrapper {
		z-index: 1;
		position: relative;

		.typescales-list {
			list-style: none;
			width: 280px;
			display: flex;
			flex-direction: column;
			overflow: auto;
			gap: $s3;
			max-height: 50dvh;
			padding-right: $s3;

			li {
				display: flex;
				padding: $s2 0;
				align-items: center;
				:global(.btn) {
					display: none;
				}

				&:hover {
					button span {
						display: block;
					}
					:global(.btn) {
						display: flex;
					}
				}
			}

			button {
				color: $c-text-ml;
				text-align: left;
				padding: $s2;
				overflow: hidden;
				width: 100%;
				background: none;
				border: none;
				border-bottom: $c-primary solid $lw;

				text-wrap: nowrap;
				text-overflow: ellipsis;
				background-color: none;

				span {
					color: $c-text-sl;
					display: none;
				}

				&:hover {
					background: linear-gradient(30deg, $c-primary, transparent 50%);
					span {
						display: block;
					}
				}
			}
		}
	}
</style>
