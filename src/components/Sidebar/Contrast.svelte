<script lang="ts">
	// based on https://dev.to/alvaromontoro/building-your-own-color-contrast-checker-4j7o
	import Icon from 'svelte-material-icons/Pan.svelte';
	import Input from '../Input.svelte';
	import ColorPicker from 'svelte-awesome-color-picker';
	import type { A11yColor } from 'svelte-awesome-color-picker/type/types';
	import { getFromLocalStorage, saveInLocalStorage } from '../../functions/localStorage';
	import { copyToClipboard } from '../../functions';
	import Button from '../Button.svelte';
	import { testingColors } from '../../stores/app';
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

	let base = getFromLocalStorage('base') || '#f4f7cb';
	let accent = getFromLocalStorage('accent') || '#09613f';
	let primary = getFromLocalStorage('primary') || '#a2d765';
	let textMainLight = getFromLocalStorage('textMainLight') || '#06331a';
	let textSecondaryLight = getFromLocalStorage('textSecondaryLight') || '#2a594d';
	let textDarkPrimary = getFromLocalStorage('textDarkPrimary') || '#000538';

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
	const pickerBaseConfig = { isTextInput: true, isA11y: true, isA11yOpen: true, isAlpha: false };

	const copyCssColors = () => {
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
	const copyColorTokens = () => {
		const colors = { base, accent, primary, textMainLight, textSecondaryLight };
		const colorTokens: Record<string, Record<string, string>> = {};

		Object.keys(colors).forEach((color) => {
			colorTokens[color] = {
				type: 'color',
				value: colors[color]
			};
		});
		copyToClipboard(JSON.stringify(colorTokens, null, 4), 'Colors as JSON tokens');
	};
</script>

<div class="export-block">
	<div class="color-pickers">
		<ColorPicker
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
	</div>
	<Button cls="test-btn" type="primary" on:click={() => testingColors.update((val) => !val)}
		>Test Colors</Button
	>
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

<style lang="scss">
	.export-block {
		display: flex;
		flex-direction: column;
		align-items: stretch;
		flex: 1 1;

		:global(.test-btn) {
			margin-top: auto;
		}
	}

	.color-pickers {
		padding: $s5 0;
		background: gray;
		border: solid $s3 black;
		display: flex;
		border-radius: $s4;
		flex-direction: column;
		align-items: flex-start;
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
</style>
