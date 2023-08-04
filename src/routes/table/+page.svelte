<script lang="ts">
	import { lorem } from '../../constants';
	import { typescale, cssCode } from '../../stores/config';
	import { onDestroy } from 'svelte';
	import { routes } from '../routes';

	let tableStyles = '';
	const unsubscribe = cssCode.subscribe((code) => {
		tableStyles = code.replace('body', '.table-page.main-page-section table');
	});

	onDestroy(unsubscribe);
</script>

<section id={routes[1].id} class="container table-page main-page-section">
	<div>
		<h1>Table of Variants</h1>
		<p>
			This is your current Typescale ussing the configurations you've set on the left 👈.
			<br />
			You won't have to manually use the mobile variants ever 😁, but that's how each of those will look
			on a device with a screen smaller than the configured breakpoint 📱.
		</p>

		<div class="variants">
			<table>
				{@html `<style>
					${tableStyles}
				</style>`}
				<tr><td>Name</td><td>Desktop</td><td>Mobile</td></tr>
				{#each $typescale as { mobileSize, mobileLine, weight, kerning, name, isHeading }}
					<tr>
						<td>
							{name}
						</td>
						<td>
							<span class={name}> {isHeading ? `Why is it Good to Use TypeGrip?` : lorem}</span>
						</td>
						<td>
							<span class={name} style="font-size: {mobileSize}px;  line-height: {mobileLine}px;">
								{isHeading ? `Why is it Good to Use TypeGrip?` : lorem}</span
							>
						</td>
					</tr>
				{/each}
			</table>
		</div>
	</div>
</section>

<style lang="scss">
	#main-content {
		display: flex;
		gap: $s5;

		div {
			display: flex;
			flex-direction: column;
			gap: $s4;
		}
	}

	.variants {
		display: flex;
		flex-direction: row;
		table {
			flex: 1;

			&:last-of-type {
				flex: 0.5;
			}
		}
		td {
			padding: $s4;
		}
	}
</style>
