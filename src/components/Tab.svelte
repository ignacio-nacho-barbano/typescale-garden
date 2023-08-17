<script lang="ts">
	export let active = false;
</script>

<div class="tab small" class:active>
	<li>
		<slot />
	</li>
</div>

<style lang="scss">
	.tab {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		gap: $sd2;
		background: none;
		border: solid 1px transparent;
		position: relative;
		text-decoration: none;
		text-transform: capitalize;
		color: currentColor;
		height: 100%;

		&.active {
			color: white;
		}

		&::before {
			position: absolute;
			bottom: 0;
			content: '';
			display: block;
			height: $s2;
			border-radius: 50%;
			transition: 100ms ease-in-out, transform 200ms ease-in-out;
			transform: translateY(calc(50% - 1px));
		}

		&:hover::before {
			background: $c-primary;
			width: 100%;
		}

		&:active::before {
			width: 50%;
			background: $c-accent;
			height: $s3;
			bottom: 0;
		}

		&.active::before {
			width: 100%;
			background: $c-accent;
		}
		:global(a),
		:global(button) {
			padding: $s3 $s4;
		}

		:global(button) {
			background: none;
			border: none;
			color: currentColor;
		}

		@media screen and (min-width: 920px) {
			flex-direction: row;
		}
	}
</style>
