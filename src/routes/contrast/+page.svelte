<script lang="ts">
	// based on https://dev.to/alvaromontoro/building-your-own-color-contrast-checker-4j7o
	import Icon from 'svelte-material-icons/Pan.svelte';
	import Input from '../../components/Input.svelte';
	interface RGBColor {
		r: number;
		g: number;
		b: number;
	}
	interface Palette {
		accent: string;
		primary: string;
		textLightPrimary: string;
		textLightSecondary: string;
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
		textLightPrimary: ColorData;
		textLightSecondary: ColorData;
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
	let textLightPrimary = '#c6e7ec';
	let textLightSecondary = '#50b2b9';
	let textDarkPrimary = '#000538';
	let base = '#ffffff';

	let appPalette: Palette = {
		accent,
		primary,
		textLightPrimary,
		textLightSecondary,
		textDarkPrimary,
		base
	};

	const assignPalette = ({
		accent,
		primary,
		textLightPrimary,
		textLightSecondary,
		textDarkPrimary,
		base
	}: Palette) =>
		(appPalette = {
			accent,
			primary,
			textLightPrimary,
			textLightSecondary,
			textDarkPrimary,
			base
		});

	$: assignPalette({
		accent,
		primary,
		textLightPrimary,
		textLightSecondary,
		textDarkPrimary,
		base
	});

	const newPalette: Palette = {
		accent: '#1be0ee',
		primary: '#17495e',
		textLightPrimary: '#c6e7ec',
		textLightSecondary: '#50b2b9',
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
			...testContrast(appPalette.textLightPrimary, appPalette.base, 5, 7)
		},
		{
			description: 'secondary text color is contrasting enough with the background',
			...testContrast(appPalette.textLightSecondary, appPalette.base, 5, 7)
		}
	];
	const darkModeChecks: ColorCheck[] = [
		{
			description: 'Primary text color is not so light it could produce a halo effect',
			...testContrast(appPalette.textLightPrimary, appPalette.base, 13, 15)
		}
	];
</script>

<section class="container main-page-section">
	<h1>Color Tests</h1>
	<form>
		<Input name="accent Color" value={accent} />
		<Input name="primary Color" value={primary} />
		<Input name="textLightPrimary Color" value={textLightPrimary} />
		<Input name="textLightSecondary Color" value={textLightSecondary} />
		<Input name="textDarkPrimary Color" value={textDarkPrimary} />
		<Input name="base Color" value={base} />
	</form>
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
		<p style="color: {appPalette.textLightPrimary};">
			Primary Text {calculateRatio(appPalette.textLightPrimary, appPalette.base)}
		</p>
		<p style="color: {appPalette.textLightSecondary};" class="body-2 secondary">
			Secondary Text {calculateRatio(appPalette.textLightSecondary, appPalette.base)}
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
		<p style="color: {appPalette.textLightPrimary};">
			Primary Text {calculateRatio(appPalette.textLightPrimary, appPalette.primary)}
		</p>
		<p style="color: {appPalette.textLightSecondary};" class="body-2 secondary">
			Secondary Text {calculateRatio(appPalette.textLightSecondary, appPalette.primary)}
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
		<p style="color: {newPalette.textLightPrimary};">
			Primary Text {calculateRatio(newPalette.textLightPrimary, newPalette.base)}
		</p>
		<p style="color: {newPalette.textLightSecondary};" class="body-2 secondary">
			Secondary Text {calculateRatio(newPalette.textLightSecondary, newPalette.base)}
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
		<p style="color: {newPalette.textLightPrimary};">
			Primary Text {calculateRatio(newPalette.textLightPrimary, newPalette.primary)}
		</p>
		<p style="color: {newPalette.textLightSecondary};" class="body-2 secondary">
			Secondary Text {calculateRatio(newPalette.textLightSecondary, newPalette.primary)}
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
	.test-block {
		padding: $s4 $s5;
		border-style: solid;
		border-width: $lw;
	}
</style>
