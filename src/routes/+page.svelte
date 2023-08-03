<script lang="ts">
	import { onMount } from 'svelte';
	import Button from '../components/Button.svelte';
	import Input from '../components/Input.svelte';
	import { lorem } from '../constants';
	import { generateCss } from '../functions';
	import type { TypeVariant } from '../models';
	import { mockFontsApi } from '../constants/mockFontsApi';

	let data2;

	let font = mockFontsApi.items[3];
	let seeCode = false;
	let breakpoint = 768;
	let baseFont = 20;
	let baseUnit = 4;
	let ratio = 1.2;
	let kerningRatio = 0.5;
	let mobileRatio = 1.1;
	const variants = [
		{ location: 7, name: 'heading1' },
		{ location: 6, name: 'heading2' },
		{ location: 5, name: 'heading3' },
		{ location: 4, name: 'heading4' },
		{ location: 3, name: 'heading5' },
		{ location: 2, name: 'heading6' },
		{ location: 0, name: 'body' },
		{ location: -1, name: 'small' },
		{ location: -2, name: 'very-small' }
	];

	let desktopVariants: TypeVariant[];
	let mobileVariants: TypeVariant[];

	$: buildVariant = (
		{ name, location }: (typeof variants)[0],
		i: number,
		isMobile: boolean = false
	): TypeVariant => {
		const ratioToUse = isMobile ? mobileRatio : ratio;
		let sizeMultiplier = Math.pow(ratioToUse, location);
		let kerning = parseFloat(
			(Math.pow(kerningRatio, 8 - Math.abs(location)) * (location > 0 ? -0.05 : 10)).toFixed(2)
		);
		let lineHeightMultiplier = Math.pow(1.1, 8 - location);
		const isHeading = name.includes('heading');
		const size = Math.round((baseFont * sizeMultiplier) / 4) * 4;
		const line =
			Math.round((size * (isHeading ? lineHeightMultiplier : 1.5)) / baseUnit) * baseUnit;

		return {
			name,
			isHeading,
			size,
			kerning,
			line,
			weight: isHeading ? 600 : 400
		};
	};

	$: desktopVariants = variants.map((t, i) => buildVariant(t, i));
	$: mobileVariants = variants.map((t, i) => buildVariant(t, i, true));

	$: cssCode = generateCss(desktopVariants, mobileVariants, breakpoint, font);
</script>

<section id="main-content" class="container">
	<section class="side-bar">
		<h2>Options</h2>
		<Button on:click={() => (seeCode = !seeCode)}>{seeCode ? 'Hide Code' : 'See Code'}</Button>
		<Input name="base-font" label="Body Font (px)" bind:value={baseFont} />
		<Input name="desktop-ratio" label="Desktop Sizes Ratio" bind:value={ratio} />
		<Input name="mobile-ratio" label="Mobile Sizes Ratio" bind:value={mobileRatio} />
		<Input name="breakpoint" label="Breakpoint (px)" bind:value={breakpoint} />
		<Input name="kerning" label="Kerning Ratio" bind:value={kerningRatio} />
	</section>
	<div>
		<h1>Welcome to TypeGrip</h1>
		<div class="variants">
			<table>
				{@html `<style>
					${cssCode}
				</style>`}
				<tr><td>Name</td><td>Desktop</td><td>Mobile</td></tr>
				{#each desktopVariants as { size, line, weight, kerning, name, isHeading }, i}
					<tr>
						<td>
							{name}
						</td>
						<td>
							<span class={name}> {isHeading ? `Why is it Good to Use TypeGrip?` : lorem}</span>
						</td>
						<td>
							<span
								style="letter-spacing: {kerning}%; font-size: {mobileVariants[i]
									.size}px;  line-height: {mobileVariants[i].line}px; font-weight: {weight};"
							>
								{isHeading ? `Why is it Good to Use TypeGrip?` : lorem}</span
							>
						</td>
					</tr>
				{/each}
			</table>
		</div>
	</div>
	<div class="code-group {seeCode && 'visible'}">
		<code>
			{cssCode}
		</code>
		<Button cls="copy-btn">Copy Code!</Button>
	</div>
</section>

<style lang="scss">
	.side-bar {
		position: sticky;
		top: 0;
	}
	#main-content {
		padding-top: $s8;
		padding-bottom: $s8;
		display: flex;
		gap: $s5;
		max-height: 100dvh;

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

	.code-group {
		z-index: 4;
		position: fixed;
		right: 100vw;
		background: $c-base;
		top: 0;
		bottom: 0;
		width: fit-content;
		padding: $s6 $s6 $s5 $s5;
		height: 100vh;
		overflow: auto;
		opacity: 0;
		border-left: solid 1px $c-accent;

		&.visible {
			opacity: 1;
			right: 0;
		}

		code {
			white-space: break-spaces;
		}

		:global(.copy-btn) {
			position: sticky;
			bottom: 0;
		}
	}
</style>
