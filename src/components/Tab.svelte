<script lang="ts">
	export let active = false;
</script>

<div class="tab body-2" class:active>
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
		background: none;
		position: relative;
		text-decoration: none;
		text-transform: capitalize;
		color: currentColor;
		height: 100%;

		&.active {
			color: $c-text-ml;
		}

		&::before {
			position: absolute;
			left: $s2;
			width: $s2;
			height: $s2;
			top: calc(50% + 2px);
			transform: translate(0, -50%);
			content: '';
			display: block;
			pointer-events: none;
			transition: 200ms ease-in-out, transform 200ms ease-in-out;
		}

		&:hover::before,
		&:active::before,
		&.active::before {
			background: $c-accent;
		}
		&:hover::before {
		}

		&:active::before {
			opacity: 0.5;
			transform: translate(0, -50%) rotateZ(20deg) scale(2);
		}

		&.active::before {
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
