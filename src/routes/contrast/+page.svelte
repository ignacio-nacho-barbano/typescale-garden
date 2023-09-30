<script lang="ts">
	// based on https://dev.to/alvaromontoro/building-your-own-color-contrast-checker-4j7o
	import Icon from 'svelte-material-icons/Pan.svelte';
	import Input from '../../components/Input.svelte';
	import ColorPicker from 'svelte-awesome-color-picker';
	import type { A11yColor } from 'svelte-awesome-color-picker/type/types';
	import { getFromLocalStorage, saveInLocalStorage } from '../../functions/localStorage';
	import { copyToClipboard } from '../../functions';
	import Button from '../../components/Button.svelte';
	interface RGBColor {
		r: number;
		g: number;
		b: number;
	}
	interface Palette {
		accent: string;
		primary: string;
		textMainLight: string;
		textSecondaryLight: string;
		textDarkPrimary?: string;
		textDarkSecondary?: string;
		base: string;
	}

	interface ColorData {
		hex: string;
		rgb: RGBColor;
		luminance: number;
	}

	interface PaletteData {
		accent: ColorData;
		primary: ColorData;
		textMainLight: ColorData;
		textSecondaryLight: ColorData;
		textDarkPrimary?: ColorData;
		textDarkSecondary?: ColorData;
		base: ColorData;
	}

	const hexToRgb = (hex: string): RGBColor => {
		const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
		hex = hex.replace(shorthandRegex, function (m, r, g, b) {
			return r + r + g + g + b + b;
		});

		const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
		console.log('invalid color for ', hex);

		return result
			? {
					r: parseInt(result[1], 16),
					g: parseInt(result[2], 16),
					b: parseInt(result[3], 16)
			  }
			: { r: 255, g: 255, b: 255 };
	};

	const initialValues = getFromLocalStorage('accent');

	let accent = getFromLocalStorage('accent') || '#1be0ee';
	let primary = getFromLocalStorage('primary') || '#17495e';
	let textMainLight = getFromLocalStorage('textMainLight') || '#c6e7ec';
	let textSecondaryLight = getFromLocalStorage('textSecondaryLight') || '#50b2b9';
	let textDarkPrimary = getFromLocalStorage('textDarkPrimary') || '#000538';
	let base = getFromLocalStorage('base') || '#ffffff';

	//test

	$: {
		saveInLocalStorage('base', base);
	}
	$: {
		saveInLocalStorage('accent', accent);
	}
	$: {
		saveInLocalStorage('primary', primary);
	}
	$: {
		saveInLocalStorage('textMainLight', textMainLight);
	}
	$: {
		saveInLocalStorage('textSecondaryLight', textSecondaryLight);
	}

	let appPalette: Palette = {
		accent,
		primary,
		textMainLight,
		textSecondaryLight,
		textDarkPrimary,
		base
	};

	const assignPalette = ({
		accent,
		primary,
		textMainLight,
		textSecondaryLight,
		textDarkPrimary,
		base
	}: Palette) =>
		(appPalette = {
			accent,
			primary,
			textMainLight,
			textSecondaryLight,
			textDarkPrimary,
			base
		});

	enum Test {
		Error,
		Warning,
		Passing
	}

	interface ColorCheck {
		description: string;
		state: Test;
		ratio: number;
	}

	// const checks: ColorCheck[] = [
	// 	{
	// 		description: 'Accent color is readable over the primary color.',
	// 		...testContrast(appPalette.accent, appPalette.primary, 3, 7)
	// 	},
	// 	{
	// 		description: 'Accent color is contrasting enough with the background',
	// 		...testContrast(appPalette.accent, appPalette.base, 7, 9)
	// 	},
	// 	{
	// 		description: 'primary color is contrasting enough with the background',
	// 		...testContrast(appPalette.primary, appPalette.base, 3, 7)
	// 	},
	// 	{
	// 		description: 'primary text color is contrasting enough with the background',
	// 		...testContrast(appPalette.textMainLight, appPalette.base, 5, 7)
	// 	},
	// 	{
	// 		description: 'secondary text color is contrasting enough with the background',
	// 		...testContrast(appPalette.textSecondaryLight, appPalette.base, 5, 7)
	// 	}
	// ];
	// const darkModeChecks: ColorCheck[] = [
	// 	{
	// 		description: 'Primary text color is not so light it could produce a halo effect',
	// 		...testContrast(appPalette.textMainLight, appPalette.base, 13, 15)
	// 	}
	// ];

	$: palette = { base, accent, primary, textMainLight, textSecondaryLight };

	const getContrastColors = (colorName: keyof Palette, palette: Palette): A11yColor[] => {
		// It's not updating when one changes
		const allColors: Palette = { ...palette };
		delete allColors[colorName];
		const colorNames = Object.keys(allColors);
		const hexObj = (hex: string, i: number): A11yColor => {
			const placeholder = colorNames[i];
			return {
				hex,
				placeholder,
				size: placeholder.includes('text') ? 'normal' : 'large'
			};
		};

		return Object.values(allColors).map(hexObj);
	};
	let baseThing;
	const pickerBaseConfig = { isTextInput: true, isA11y: true, isA11yOpen: true, isAlpha: false };

	const copyColors = () => {
		copyToClipboard(
			`
		--c-base: ${base};
		--c-accent: ${accent};
		--c-primary: ${primary};
		--c-text-ml: ${textMainLight};
		--c-text-sl: ${textSecondaryLight};

		$c-base: var(--c-base);
		$c-accent: var(--c-accent);
		$c-primary: var(--c-primary);
		$c-text-ml: var(--c-text-ml);
		$c-text-sl: var(--c-text-sl);
		`,
			'Colors as CSS variables'
		);
	};
	console.log(baseThing);
</script>

<section class="container main-page-section">
	<h1>Color Tests</h1>
	<div class="color-pickers-group tooltip">
		<ColorPicker
			color={baseThing}
			{...pickerBaseConfig}
			bind:hex={base}
			label="Base color"
			a11yColors={getContrastColors('base', palette)}
		/>
		<ColorPicker
			{...pickerBaseConfig}
			bind:hex={primary}
			label="Primary"
			a11yColors={getContrastColors('primary', palette)}
		/>
		<ColorPicker
			{...pickerBaseConfig}
			bind:hex={accent}
			label="Accent"
			a11yColors={getContrastColors('accent', palette)}
		/>
		<ColorPicker
			{...pickerBaseConfig}
			bind:hex={textMainLight}
			label="Main text"
			a11yColors={getContrastColors('textMainLight', palette)}
		/>
		<ColorPicker
			{...pickerBaseConfig}
			bind:hex={textSecondaryLight}
			label="Secondary text"
			a11yColors={getContrastColors('textSecondaryLight', palette)}
		/>
		<Button on:click={copyColors}>Copy Colors</Button>
	</div>
	<!-- <h2>General Tests</h2>
	<ol>
		{#each checks as { description, state, ratio }}
			<li>{description} - {formatContrastRatio(ratio)} - {['❌', '🟨', '✅'][state]}</li>
		{/each}
	</ol>
	<h2>Tests for Dark Mode</h2>
	<ol>
		{#each darkModeChecks as { description, state, ratio }}
			<li>{description} - {formatContrastRatio(ratio)} - {['✅', '🟨', '❌'][state]}</li>
		{/each}
	</ol> -->
</section>

<style lang="scss">
	section {
		display: flex;
		flex-wrap: wrap;
		gap: $s5;

		h1,
		h2 {
			width: 100%;
		}
	}

	.color-pickers-group {
		display: flex;
		flex-direction: column;
		gap: $s5;
		:global(.wrapper *) {
			color: $c-text-ml;
			font-size: 12px;
		}

		:global(div.color) {
			height: $s6;
			width: $s6;
			border-radius: 0;
			@include shadow-low;
		}
	}
	.test-block {
		padding: $s4 $s5;
		border-style: solid;
		border-width: $lw;
	}
</style>
