<script lang="ts">
	// based on https://dev.to/alvaromontoro/building-your-own-color-contrast-checker-4j7o
	import Icon from 'svelte-material-icons/Pan.svelte';
	import Input from '../../components/Input.svelte';
	import ColorPicker from 'svelte-awesome-color-picker';
	import type { A11yColor } from 'svelte-awesome-color-picker/type/types';
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

	let accent = '#1be0ee';
	let primary = '#17495e';
	let textMainLight = '#c6e7ec';
	let textSecondaryLight = '#50b2b9';
	let textDarkPrimary = '#000538';
	let base = '#ffffff';

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

	$: assignPalette({
		accent,
		primary,
		textMainLight,
		textSecondaryLight,
		textDarkPrimary,
		base
	});

	const newPalette: Palette = {
		accent: '#1be0ee',
		primary: '#17495e',
		textMainLight: '#c6e7ec',
		textSecondaryLight: '#50b2b9',
		textDarkPrimary: '#000538',
		base: '#ffffff'
	};

	const getRgb = (color: RGBColor | string): RGBColor => {
		if (typeof color === 'object' && 'r' in color && 'g' in color && 'b' in color) {
			return color;
		}

		return hexToRgb(color);
	};

	const luminance = (color: RGBColor | string) => {
		const rgb = getRgb(color);

		const a = Object.values(rgb).map((v) => {
			v /= 255;
			return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
		});
		return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
	};

	const formatContrastRatio = (ratio: number) => `${(1 / ratio).toFixed(2)}: 1`;

	const calculateRatio = (
		colorA: RGBColor | string,
		colorB: RGBColor | string,
		formatted = true
	) => {
		const colorALuminance = luminance(colorA);
		const colorBLuminance = luminance(colorB);

		const ratio =
			colorALuminance > colorBLuminance
				? (colorBLuminance + 0.05) / (colorALuminance + 0.05)
				: (colorALuminance + 0.05) / (colorBLuminance + 0.05);

		return formatted ? formatContrastRatio(ratio) : ratio;
	};

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

	const testContrast = (
		colorA: RGBColor | string,
		colorB: RGBColor | string,
		errorRange: number,
		passingRange: number
	): Omit<ColorCheck, 'description'> => {
		const ratio = calculateRatio(colorA, colorB, false) as number;
		const ratioAsContrast = parseFloat((1 / ratio).toFixed(2));
		let state = Test.Warning;

		if (ratioAsContrast <= errorRange) {
			state = Test.Error;
		}

		if (ratioAsContrast >= passingRange) {
			state = Test.Passing;
		}

		return { state, ratio };
	};

	const checks: ColorCheck[] = [
		{
			description: 'Accent color is readable over the primary color.',
			...testContrast(appPalette.accent, appPalette.primary, 3, 7)
		},
		{
			description: 'Accent color is contrasting enough with the background',
			...testContrast(appPalette.accent, appPalette.base, 7, 9)
		},
		{
			description: 'primary color is contrasting enough with the background',
			...testContrast(appPalette.primary, appPalette.base, 3, 7)
		},
		{
			description: 'primary text color is contrasting enough with the background',
			...testContrast(appPalette.textMainLight, appPalette.base, 5, 7)
		},
		{
			description: 'secondary text color is contrasting enough with the background',
			...testContrast(appPalette.textSecondaryLight, appPalette.base, 5, 7)
		}
	];
	const darkModeChecks: ColorCheck[] = [
		{
			description: 'Primary text color is not so light it could produce a halo effect',
			...testContrast(appPalette.textMainLight, appPalette.base, 13, 15)
		}
	];

	const getContrastColors = (colorName: keyof Palette): A11yColor[] => {
		// It's not updating when one changes
		const allColors: Palette = { accent, primary, textMainLight, textSecondaryLight, base };
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
</script>

<section class="container main-page-section">
	<h1>Color Tests</h1>
	<div class="color-pickers-group tooltip">
		<ColorPicker
			color={baseThing}
			hex={base}
			label="Base color"
			isTextInput
			isA11y
			isA11yOpen
			a11yColors={getContrastColors('base')}
		/>
		<ColorPicker
			hex={accent}
			label="Accent"
			isTextInput
			isA11y
			isA11yOpen
			a11yColors={getContrastColors('accent')}
		/>
		<ColorPicker
			hex={primary}
			label="Primary"
			isTextInput
			isA11y
			isA11yOpen
			a11yColors={getContrastColors('primary')}
		/>
		<ColorPicker
			hex={textMainLight}
			label="Main text"
			isTextInput
			isA11y
			isA11yOpen
			a11yColors={getContrastColors('textMainLight')}
		/>
		<ColorPicker
			hex={textSecondaryLight}
			label="Secondary text"
			isTextInput
			isA11y
			isA11yOpen
			a11yColors={getContrastColors('textSecondaryLight')}
		/>
	</div>
	<h2>General Tests</h2>
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
	</ol>
	<div
		class="test-block"
		style="background-color: {appPalette.base}; border-color: {appPalette.accent}"
	>
		<h2 class="heading4">Over Background Color</h2>
		<p style="color: {appPalette.accent};">
			Accent Color {calculateRatio(appPalette.accent, appPalette.base)}
		</p>
		<p style="color: {appPalette.primary};">
			primary Color {calculateRatio(appPalette.primary, appPalette.base)}
		</p>
		<p style="color: {appPalette.textMainLight};">
			Primary Text {calculateRatio(appPalette.textMainLight, appPalette.base)}
		</p>
		<p style="color: {appPalette.textSecondaryLight};" class="body-2 secondary">
			Secondary Text {calculateRatio(appPalette.textSecondaryLight, appPalette.base)}
		</p>
		<Icon size="52" color={appPalette.accent} />
	</div>
	<div
		class="test-block"
		style="background-color: {appPalette.primary};border-color: {appPalette.accent};"
	>
		<h2 class="heading4">Over Primary Color</h2>
		<p style="color: {appPalette.accent};">
			Accent Color {calculateRatio(appPalette.accent, appPalette.primary)}
		</p>
		<p style="color: {appPalette.primary};">
			primary Color {calculateRatio(appPalette.primary, appPalette.primary)}
		</p>
		<p style="color: {appPalette.textMainLight};">
			Primary Text {calculateRatio(appPalette.textMainLight, appPalette.primary)}
		</p>
		<p style="color: {appPalette.textSecondaryLight};" class="body-2 secondary">
			Secondary Text {calculateRatio(appPalette.textSecondaryLight, appPalette.primary)}
		</p>
		<Icon size="52" color={appPalette.accent} />
	</div>
	<h2>New Palette</h2>
	<div
		class="test-block"
		style="background-color: {newPalette.base}; border-color: {newPalette.accent}"
	>
		<h2 class="heading4">Over Background Color</h2>
		<p style="color: {newPalette.accent};">
			Accent Color {calculateRatio(newPalette.accent, newPalette.base)}
		</p>
		<p style="color: {newPalette.primary};">
			primary Color {calculateRatio(newPalette.primary, newPalette.base)}
		</p>
		<p style="color: {newPalette.textMainLight};">
			Primary Text {calculateRatio(newPalette.textMainLight, newPalette.base)}
		</p>
		<p style="color: {newPalette.textSecondaryLight};" class="body-2 secondary">
			Secondary Text {calculateRatio(newPalette.textSecondaryLight, newPalette.base)}
		</p>
		<Icon size="52" color={newPalette.accent} />
	</div>
	<div
		class="test-block"
		style="background-color: {newPalette.primary};border-color: {newPalette.accent};"
	>
		<h2 class="heading4">Over Primary Color</h2>
		<p style="color: {newPalette.accent};">
			Accent Color {calculateRatio(newPalette.accent, newPalette.primary)}
		</p>
		<p style="color: {newPalette.primary};">
			primary Color {calculateRatio(newPalette.primary, newPalette.primary)}
		</p>
		<p style="color: {newPalette.textMainLight};">
			Primary Text {calculateRatio(newPalette.textMainLight, newPalette.primary)}
		</p>
		<p style="color: {newPalette.textSecondaryLight};" class="body-2 secondary">
			Secondary Text {calculateRatio(newPalette.textSecondaryLight, newPalette.primary)}
		</p>
		<Icon size="52" color={newPalette.accent} />
	</div>
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
		:global(*) {
			color: $c-base;
			font-size: 12px;
		}
	}
	.test-block {
		padding: $s4 $s5;
		border-style: solid;
		border-width: $lw;
	}
</style>
