<script lang="ts">
	import { typescale } from '../stores/config';
	export let viewing: string;
</script>

<div class="chars-chart-wrapper">
	{#each $typescale as { weight, name, desktopSize, desktopLine, mobileLine, mobileSize }}
		<span
			class={'letter-example ' + name}
			style="font-size: {viewing === 'desktop'
				? desktopSize
				: mobileSize}px;  line-height: {viewing === 'desktop' ? desktopLine : mobileLine}px;"
			><span>Ab</span>
			<span class="tooltip weight-ref">{weight}</span>
			<div class="line-height-ref" />
		</span>
	{/each}
</div>

<style lang="scss">
	.chars-chart-wrapper {
		justify-content: center;
		padding: $s4 $sd5 $s6;
		border-radius: $s4;
		background-color: $c-primary;
		display: flex;
		gap: $s3;
		align-items: flex-end;
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
