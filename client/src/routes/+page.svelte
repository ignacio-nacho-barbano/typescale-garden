<script lang="ts">
	import { derived } from "svelte/store";
	import typescale3d from "../../images/typescale-3d.jpg?w=500&format=webp";
	import { mobileView } from "../stores/app";
	import { cssCode } from "../stores/config";
	import { routes } from "./routes";
	import { Breakpoints } from "../constants";

	const tableStyles = derived([cssCode, mobileView], ([code, mobile]) => {
		let styles = code;
		let minWidthOverride = "@media (min-width: ";
		minWidthOverride += mobile ? "100000" : "1";
		let bodyOverride = ".how-it-works-page.main-page-section {";
		bodyOverride += mobile
			? `
		max-width: 400px;
		min-width: unset;
		margin: 32px 0;
		padding: 52px 32px;
		`
			: "\n";

		styles = styles.replaceAll("body {", bodyOverride);
		styles = styles.replaceAll(/@media \(min-width: \d+/g, minWidthOverride);

		return styles;
	});
</script>

<div class="styles-injection-wrapper">
	{@html `
	<style>
		${$tableStyles}
	.styles-injection-wrapper {
		.how-it-works-page.mobileView {
			.text-and-image {
			flex-direction: column !important;
		}

			@media (min-width: ${Breakpoints.M}px) {
			border: var(--c-accent) solid 1px;
			border-radius: 32px;
		}
	}
		
	}
		</style>`}
	<section
		id={routes[0].id}
		class:mobileView={$mobileView}
		class="container how-it-works-page main-page-section"
	>
		<h1 class="title-1 space-text-below">A Typescale Creation Tool</h1>

		<div class="text-and-image space-text-below">
			<div>
				<h2>Defining a Typescale</h2>
				<p>
					A typescale, or typographic scale, groups all the variants of a font or group of fonts
					used within a design system.
				</p>
			</div>
			<figure>
				<img src={typescale3d} alt="a nice 3d typography by Alexander Andrews from Unsplash" />
				<figcaption class="tooltip secondary">
					Picture by <a
						href="https://unsplash.com/es/@alex_andrews?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText"
						>Alexander Andrews</a
					>
					in
					<a
						href="https://unsplash.com/es/fotos/zw07kVDaHPw?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText"
						>Unsplash</a
					>
				</figcaption>
			</figure>
		</div>
		<h2>What's Different About Typescale Garden</h2>
		<p>
			Typescale Garden stands out as a versatile tool for generating typographic scales based on
			various relationships. What sets it apart is its superior configurability compared to other
			tools. Notably, it offers the flexibility to create two sets of related typographic scales –
			one tailored for phones and small devices, and the other optimized for larger screens.
		</p>
		<h3>Why Two Typescales?</h3>
		<p>
			In the realm of printed media, designers knew the format they were working with, allowing them
			to craft an ideal typographic scale based on media size and viewing distance. However, with
			the influx of digital technology, the predictability of screen sizes and usage scenarios
			diminished, leading to a significant challenge.
		</p>
		<h4>The Desktop vs Mobile Ratios Dilemma</h4>
		<h5>In a Nutshell</h5>
		<p>
			The one-size-fits-all approach for fonts across various screen sizes poses a significant
			problem. Proportional scaling can result in either oversized fonts for headings on smaller
			screens or sizes non-conforming to accessibility standards for paragraphs in smaller screens.
		</p>

		<h5>Let's Analyze This Scenario</h5>
		<p>
			We've a new website, with a <strong>Big Bold Brand™️</strong>, the obvious solution could be
			to have a strikingly growing typescale right?
		</p>
		<p>
			We begin a new file in our new favorite design tool (figma in my case), we work trough picking
			a font, a spacing system and many other pieces, day comes when we start working on the
			typographic scale, we explore different ratios, weights, make visual adjustments and we even
			test it on a couple test pages.
		</p>
		<p>
			Likely you are doing all of this on a laptop or even a big monitor, which could be keeping you
			from finding a big problem with your typographic scale until it's too late.
		</p>
		<p>
			You could even go as far as not testing your font on any design for a small screen, because
			you're just "testing the font, and the typographic scale".
		</p>
		<p>
			Process iterates and you've a result you're happy, you make your first page using your new
			design system and it works well ...until this happens:
		</p>
		<p>
			Your nice heading, that was taking only two lines in the design, actually needs five in a
			mobile screen due to the little horizontal space available. But that's easy to solve right?
			Just make it smaller, once you do so, you realize that now your second heading is bigger than
			the first one, that's not right!
		</p>
		<p>
			In an attempt to easily fix it, you scale down everything to a third of it's size on mobile
			devices, things are looking good, headings preserve their hierarchy and everything fits well.
			You now go ahead and keep designing that nice landing page, but once you get to a content
			heavy paragraph, you realize something, the body font just doesn't feel right with the scaling
			rule applied, you've gone too far and it's not even accessible. You make it bigger, continue
			to write within the landing page but now you notice another problem, the body font is bigger
			than the smallest heading, that's not right either!
		</p>
		<p>
			The problem has made obvious by now, the typographic scale you designed for desktop devices is
			not going to be easy to adjust for mobile devices, but going trough all of the math,
			observation and relationships again is going to introduce quite some work.
		</p>
		<p>
			If you've ever found yourself in the scenario above, maybe you where iterating in the same way
			I do, that's why I created this tool, looking to continue to have the flexibility of creating
			a new typescale for each project as I enjoy to do, but keeping me from having to make the same
			processes and decisions at least twice just to explore a typographic scale.
		</p>
	</section>
</div>

<style lang="scss">
	.styles-injection-wrapper {
		display: contents;
	}
	#how-it-works {
		overflow: hidden;
		max-width: 100%;
		& > * {
			margin-left: min($s5, auto);
			margin-right: min($s5, auto);
		}
	}

	.text-and-image {
		display: flex;
		flex: 1 1;
		max-width: 768px;
		flex-direction: column;
		align-items: center;
		flex-wrap: wrap;
		gap: $sd5;

		div {
			flex: 2 2;
		}

		@media ($bp-l) {
			flex-direction: row;
		}

		figure {
			flex: 1 1;

			img {
				width: 100%;
			}
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
