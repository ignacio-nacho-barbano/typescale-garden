<script lang="ts">
	import { lorem } from '../../constants';
	import { typescale, cssCode, breakpoint } from '../../stores/config';
	import { onDestroy } from 'svelte';
	import { routes } from '../routes';
	import CharsChart from '../../components/CharsChart.svelte';
	import Tabs from '../../components/Tabs.svelte';
	import Tab from '../../components/Tab.svelte';

	let tableStyles = '';
	const unsubscribe = cssCode.subscribe((code) => {
		tableStyles = code.replace('body', '.table-page.main-page-section');
		tableStyles = tableStyles.replace($breakpoint + '', $breakpoint + 360 + '');
	});
	type Option = 'Desktop' | 'Mobile' | 'Both';
	let currentView: Option = 'Desktop';
	const tabs: Option[] = ['Desktop', 'Mobile', 'Both'];

	onDestroy(unsubscribe);
</script>

<section id={routes[1].id} class="table-page main-page-section">
	<div class="container">
		<h1>Table of Variants</h1>
		<p>
			This is your current Typescale ussing the configurations you've set on the configs tab.
			<br />
			You won't have to manually use the mobile variants ever 😁, but that's how each of those will look
			on a device with a screen smaller than the configured breakpoint 📱.
		</p>
	</div>
	<Tabs>
		<div class="container tabs-wrapper">
			{#each tabs as tab}
				<Tab active={currentView === tab}>
					<button on:click={() => (currentView = tab)}>{tab}</button>
				</Tab>
			{/each}
		</div>
	</Tabs>
	<div class="container">
		<div class="variants {currentView.toLowerCase()}">
			{@html `<style>
				${tableStyles}
				</style>`}

			{#if currentView === 'Desktop' || currentView === 'Mobile'}
				<CharsChart viewing={currentView.toLowerCase()} />
				<div class="device {currentView.toLowerCase()}">
					<ol>
						{#each $typescale as { mobileSize, desktopSize, desktopLine, mobileLine, weight, kerning, name, isHeading }}
							<li>
								<p>
									{name}
								</p>
								<p>
									<span
										class={name}
										style="font-size: {currentView === 'Desktop'
											? desktopSize
											: mobileSize}px;  line-height: {currentView === 'Desktop'
											? desktopLine
											: mobileLine}px;"
									>
										{isHeading ? `Why is it Good to Use TypeGrip?` : lorem}</span
									>
								</p>
							</li>
						{/each}
					</ol>
				</div>
			{:else}
				<CharsChart viewing="desktop" />
				<CharsChart viewing="mobile" />
				<table>
					<tr><td>Name</td><td>Desktop</td><td>Mobile</td></tr>
					{#each $typescale as { mobileSize, mobileLine, name, isHeading }}
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
			{/if}
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

	.tabs-wrapper {
		display: flex;
		flex-direction: row;
		gap: $s3;
	}

	.device {
		&.mobile {
			background: black;
			border-radius: $s5;
			padding: $s6 0;
			margin-left: auto;
			margin-right: auto;
			max-width: 360px;
			position: relative;

			&::after {
				content: '';
				position: absolute;
				left: 50%;
				top: $s5;
				width: $s3;
				height: $s3;
				border: gray solid 1px;
				background: radial-gradient(circle at 75% 25%, transparent, $c-primary);
				border-radius: 50%;
				transform: translate(-50%, -50%);
			}
		}

		ol {
			padding: $sd5;
			display: flex;
			flex-direction: column;
			gap: $s6;
			list-style: none;
		}
	}

	.variants {
		display: flex;
		flex-direction: column;
		padding: $s5 0;
		flex-wrap: wrap-reverse;
		gap: $s5;
		align-items: flex-end;
		justify-content: center;

		&.mobile {
			flex-direction: row;

			:global(.chars-chart-wrapper) {
				order: 1;
				height: fit-content;
			}
		}
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
