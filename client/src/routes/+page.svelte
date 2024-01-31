<script lang="ts">
	import { lorem } from "../constants";
	import { typescale, cssCode, currentFont, breakpoint } from "../stores/config";
	import { onDestroy } from "svelte";
	import { routes } from "./routes";
	import typescale3d from "../../images/typescale-3d.jpg?w=500&format=webp";

	let tableStyles = "";
	const unsubscribe = cssCode.subscribe((code) => {
		tableStyles = code.replaceAll("body", ".how-it-works-page.main-page-section");
		tableStyles = tableStyles.replaceAll(
			"(min-width: " + $breakpoint,
			"(min-width: " + ($breakpoint + 380)
		);
	});

	onDestroy(unsubscribe);
</script>

<section id={routes[0].id} class="container how-it-works-page main-page-section">
	{@html `<style>
			${tableStyles}
		</style>`}
	<!-- <span class="eyebrow">Typescale Garden</span> -->
	<h1 class="heading1 space-text-below">A Typescale Creation Tool</h1>
	<div class="text-and-image space-text-below">
		<div>
			<h2>What is a Typescale</h2>
			<p>
				A typescale or typographic scale is the group of all of the variants of a font or group of
				fonts used on a design system.
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
	<h2>What is different about Typescale Garden?</h2>
	<p>
		Typescale Garden is another tool for generating a typescale based on several relations. It's
		more configurable than most other tools and it provides the possibilty of generating two sets of
		related typographic scales, one for phones and other small devices and one for bigger screens.
	</p>
	<h3>Two Typescales? Why?</h3>
	<p>
		Tpypographic scales have been here long before screens. In printed media you knew the format you
		where working with, and therefore you could design the ideal scale for such media, sizes and
		viewing distance.
	</p>
	<p>
		As technology came in we imported the processes of designing for printed media into digital
		devices which, worked well initially as there wasn't such an unpredictable range of devices to
		work with. As technology became more distinct and devices became more capable, the combinations
		of what screen sizes and usage situations became less predictable leaving us with the following
		problem.
	</p>
	<h4>The Desktop vs Mobile Ratios Problem</h4>
	<h5>TL;DR</h5>
	<p>
		The same size difference between your smaller fonts and your biggers fonts won't work on both
		small and big screens. If you proportionally scale it, you will either have a font that's
		absurdly oversized on the bigger headings, or completely out of the accessibity standards on the
		paragraphs.
	</p>

	<h5>Let's analyze this scenario:</h5>
	<p>
		We've a new website, with a <strong>Big Bold Brand™️</strong>, the obvious solution could be to
		have a strikingly growing typescale right?
	</p>
	<p>
		We begin a new file in our new favourite design tool (figma in my case), we work trough picking
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
		you're just "testing the font, and the tpographic scale".
	</p>
	<p>
		Process iterates and you've a result you're happy, you make your first page using your new
		design system and it works well ...until this happens:
	</p>
</section>

<style lang="scss">
	#main-content {
		div {
			display: flex;
			flex-direction: column;
			gap: $s4;
		}
	}

	.text-and-image {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
		gap: $sd5;
		align-items: end;

		figure {
			flex: 1 1 auto;

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
