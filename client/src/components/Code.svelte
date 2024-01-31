<script lang="ts">
</script>

<div class="code-block">
	<div class="code-wrapper tooltip">
		<code>
			<slot />
		</code>
	</div>
</div>

<style lang="scss">
	.code-block {
		font-family: "Roboto", monospace;
	}

	.code-wrapper {
		background: rgb(65, 59, 59);
		color: white;
	}
	.code-wrapper {
		padding: $s5;
	}

	code {
		white-space: break-spaces;
		line-break: anywhere;
		font-weight: 400;
	}
</style>
