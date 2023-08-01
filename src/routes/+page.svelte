<script lang="ts">
	interface TypeVariant {
		isHeading: boolean;
		name: string;
		size: number;
		line: number;
		kerning: number;
		weight: number;
	}
	let seeCode = false;
	const baseFont = 20;
	const baseUnit = 4;
	const ratio = 1.25;
	const kerningRatio = 0.5;
	const mobileRatio = 1.1;
	const variants = [
		{ location: 7, name: 'heading1' },
		{ location: 6, name: 'heading2' },
		{ location: 5, name: 'heading3' },
		{ location: 4, name: 'heading4' },
		{ location: 3, name: 'heading5' },
		{ location: 2, name: 'heading6' },
		{ location: 0, name: 'body' },
		{ location: -1, name: 'small' }
	];

	let desktopVariants: TypeVariant[];
	let mobileVariants: TypeVariant[];

	const buildVariant = (
		{ name, location }: (typeof variants)[0],
		i: number,
		isMobile: boolean = false
	): TypeVariant => {
		const ratioToUse = isMobile ? mobileRatio : ratio;
		let sizeMultiplier = Math.pow(ratioToUse, location);
		let kerning = Math.pow(kerningRatio, location).toFixed(2);
		let lineHeightMultiplier = Math.pow(1.1, 8 - location);
		const isHeading = name.includes('heading');
		const size = Math.round((baseFont * sizeMultiplier) / 4) * 4;
		const line =
			Math.round((size * (isHeading ? lineHeightMultiplier : 1.5)) / baseUnit) * baseUnit;

		return {
			name,
			isHeading,
			size,
			kerning: -kerning,
			line,
			weight: isHeading ? 600 : 400
		};
	};

	$: desktopVariants = variants.map((t, i) => buildVariant(t, i));
	$: mobileVariants = variants.map((t, i) => buildVariant(t, i, true));
</script>

<section id="main-content" class="container">
	<div>
		<h1>Welcome to TypeGrip</h1>
		<div class="variants">
			<table>
				<tr><td>Name</td><td>Example</td></tr>
				{#each desktopVariants as { size, line, weight, kerning, name, isHeading }}
					<tr>
						<td>
							{name}
						</td>
						<td>
							<span
								style="letter-spacing: {kerning}%; font-size: {size}px;  line-height: {line}px; font-weight: {weight};"
							>
								{isHeading
									? `Why is it Good to Use TypeGrip?`
									: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam eu tortor at leo porttitor dignissim at at nibh. Sed ultricies vehicula mollis. In sed odio ac nunc cursus rhoncus sit amet nec est. Integer sit amet sem vel urna condimentum placerat. Nunc tempor justo metus, ac ultricies arcu dignissim et. Duis bibendum quam nisi, non posuere dui congue in. Phasellus venenatis nisi ac nulla finibus facilisis. Donec a fermentum turpis, sit amet efficitur nunc. Pellentesque eget auctor lacus. Donec aliquam eleifend lobortis. Etiam eu sollicitudin nulla. Aliquam urna risus, laoreet sed nibh non, finibus maximus erat. Aenean eget tellus nec urna tincidunt vulputate. Cras iaculis eleifend tellus, ac feugiat massa efficitur at.'}</span
							>
						</td>
					</tr>
				{/each}
			</table>
		</div>
	</div>
	<div class="code-group {seeCode && 'visible'}">
		<code>
			{JSON.stringify(desktopVariants)}
		</code>
		<code>
			{JSON.stringify(mobileVariants)}
		</code>
	</div>
</section>

<style lang="scss">
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
		td {
			padding: $s4;
		}
	}

	.code-group {
		position: fixed;
		right: 100vw;
		background: $c-base;
		top: 0;
		bottom: 0;
		width: 50vw;
		padding: $s6 $s6 $s5 $s5;
		opacity: 0;
		border-left: solid 1px $c-accent;

		&.visible {
			opacity: 1;
			right: 0;
		}
	}
</style>
