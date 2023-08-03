<script lang="ts">
	export let name: string;
	export let value: string | number;
	export let label: string | null = null;
</script>

<div class="input-wrapper">
	<label for={name}>{label || name}</label>
	<input id={name} bind:value />
</div>

<style lang="scss">
	.input-wrapper {
		display: flex;
		flex-direction: column;
		label {
			margin-bottom: $s2;
		}
		input {
			height: $s5;
			background: $c-base;
			border: $c-primary solid $lw;
			color: $c-accent;
			padding: 0 $s3;
			border-radius: $s2;
		}
	}
</style>
