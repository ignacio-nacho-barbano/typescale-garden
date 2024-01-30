<script lang="ts">
	import { typescale } from '../stores/config';
	export let viewing: string;
</script>

<div class="chars-chart-wrapper shadow-mid">
	{#each $typescale as { weight, name, desktopSize, desktopLine, mobileLine, mobileSize }}
		<span
			class={'letter-example ' + name}
			style="font-size: {viewing === 'desktop'
				? desktopSize
				: mobileSize}px;  line-height: {viewing === 'desktop' ? desktopLine : mobileLine}px;"
			><span>Ab</span>
			<span class="tooltip weight-ref">{weight}</span>
			<p class="tooltip size-ref">{desktopSize}px {desktopLine}px</p>
			<div class="line-height-ref" />
		</span>
	{/each}
</div>

<style lang="scss">
	.chars-chart-wrapper {
		justify-content: center;
		padding: $s4 $sd5 $s8;
		flex: 1 1;
		border-radius: $s4;
		min-width: 256px;

		background-color: $c-primary;
		display: flex;
		gap: $sd5;
		justify-content: space-between;
		align-items: flex-end;
		overflow: auto;
	}

	.letter-example {
		position: relative;
		background-color: rgba(128, 128, 128, 0.3);
	}

	.weight-ref {
		padding: 0 0 0 $sd1;
		position: absolute;
		bottom: -1.5em;
		left: 0;
		border-left: $lw solid rgba(128, 128, 128, 0.3);
	}

	.size-ref {
		position: absolute;
		left: 0;
		transform: translateY(100%);
	}

	.line-height-ref {
		content: '';
		width: 100%;
		height: 100%;
		position: absolute;
		height: 1rem;
		border-top: $lw solid $c-accent;
		top: 0;
		left: 0;
	}
</style>
