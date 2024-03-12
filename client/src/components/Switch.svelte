<script lang="ts">
	export let name: string;
	export let value: boolean = false;
	export let label: string = name;
	export let size: "s" | "m" = "m";
</script>

<div class="input-wrapper {size} switch {value ? 'active' : ''}">
	<label class={size === "m" ? "body-2" : "tooltip"} for={name}>{label || name}</label>
	<input aria-label={label} id={name} type="checkbox" bind:value />
	<button aria-label={label || name} class="slider" on:click={() => (value = !value)} />
</div>

<style lang="scss">
	.input-wrapper {
		display: flex;
		align-items: center;
		gap: $s3;
		flex: 0 0 auto;

		label {
			margin: 0;
		}
		&.s {
			gap: $s1;
		}

		&.active .slider:before {
			left: 24px;
			background-color: $c-accent;
			filter: none;
		}

		input {
			height: 0;
			opacity: 0;
			width: 0;
		}

		.slider {
			border-radius: $s4;
			height: $s5;
			position: relative;
			cursor: pointer;
			flex: 0 0 auto;
			width: $s6;
			background-color: $c-base;
			-webkit-transition: 0.4s;
			transition: 0.4s;
			overflow: hidden;
			border: $c-accent solid $lw;
		}

		.slider:before {
			border-radius: $s4;
			position: absolute;
			content: "";
			height: $s4;
			width: $s4;
			left: $s1;
			top: 50%;
			transform: translateY(-50%);
			background-color: $c-primary;
			filter: grayscale(0.6);
			transition: 300ms;
		}

		input:focus + .slider,
		button:focus.slider {
			box-shadow: 0 0 1px #2196f3;
		}
	}
</style>
