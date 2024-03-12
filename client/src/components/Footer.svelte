<footer>
	<div class="container shadow-high">
		<section class="encouragement">
			<h1 class="title-5">Hi, Nacho Here 😄! I Think There's Something You Should Know:</h1>
			<h2 class="title-6">Typescale Garden is an Open Source Project!</h2>
			<p>
				If you've found value in it and would like to support its continued maintenance, I encourage
				you to

				<b
					>consider making a donation through
					<a target="_blank" href="https://github.com/sponsors/ignacio-nacho-barbano"
						>GitHub Sponsors</a
					></b
				>.
			</p>
			<p>
				<b>I will greatly appreciate it!</b> Also your name will be <b>forever visible</b> in the
				project's
				<b>wall of eternity 😱!!!</b><wbr />
				<span>(coming soon once we have someone <wbr />to put there 😅)</span>.
			</p>
			<h3 class="body-1 bold">How Else Can I Support the Project?</h3>
			<p>
				Whether you're a developer or simply want to offer support, request new features, or report
				a bug for swift resolution, please check the
				<a target="_blank" href="https://github.com/ignacio-nacho-barbano/typescale-garden"
					>GitHub repo</a
				>. or send me a message at
				<a target="_blank" href="mailto:nacho.barbano.dev@gmail.com">nacho.barbano.dev@gmail.com</a
				>.
			</p>
		</section>
		<div>
			<p class="body-1"><b>Links of Interest</b></p>
			<nav>
				<ul class="body-2">
					<li><a href="/">Home</a></li>
					<li><a href="/privacy">Privacy Policy</a></li>
					<li>
						<a target="_blank" href="https://github.com/ignacio-nacho-barbano/typescale-garden"
							>GitHub Repo</a
						>
					</li>
					<li>
						<a target="_blank" href="https://github.com/sponsors/ignacio-nacho-barbano"
							>GitHub Sponsors</a
						>
					</li>
					<li>
						<a target="_blank" href="mailto:nacho.barbano.dev@gmail.com">Support Mail</a>
					</li>
				</ul>
			</nav>
		</div>
	</div>
</footer>

<style lang="scss">
	footer {
		width: 100%;

		display: flex;
		align-items: center;
		justify-content: center;
		padding: $s4 0;

		@media ($bp-m) {
			padding: $s7 $s4;
		}

		& > div {
			display: flex;
			flex-wrap: wrap;
			padding: $sd5;
			gap: $sd6;
			border-radius: $s5;
			background: $c-primary-bg;
			border: solid $c-accent $lw;
		}
	}
</style>
