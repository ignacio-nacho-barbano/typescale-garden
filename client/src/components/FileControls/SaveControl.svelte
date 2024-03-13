<script lang="ts">
	import type { Typescale } from ".prisma/client";
	import type { AxiosResponse } from "axios";
	import { logError } from "../../services/errorLogger";
	import { typescaleName, typescaleObject } from "../../stores/config";
	import { fetch } from "../../stores/fetch";
	import { showNotification } from "../../stores/notifications";
	import { loadedTypescaleId, storedTypescales } from "../../stores/typescales";
	import Button from "../Button.svelte";
	import Input from "../Input.svelte";
	import Menu from "../Menu.svelte";

	let open = false;
	const maxChars = 30;

	const save = async (saveAsNew = false) => {
		if ($typescaleName.length > maxChars) return;

		const existingTypescale = $storedTypescales.find(({ name }) => name === $typescaleName);

		let res: AxiosResponse<{ typescales: Typescale[] }>;

		try {
			if (saveAsNew || !existingTypescale) {
				res = await $fetch.post("/typescales/saved", {
					data: $typescaleObject
				});
			} else {
				res = await $fetch.put("/typescales/saved/" + existingTypescale.id, {
					data: $typescaleObject
				});
			}

			storedTypescales.set(res.data.typescales);
			if (saveAsNew || !existingTypescale) {
				loadedTypescaleId.set(res.data.typescales[0].id);
			}
			showNotification(`Typescale ${existingTypescale ? "updated" : "saved"} successfully`);
			open = false;
		} catch (error) {
			let message = "ERROR: Could not save the typescale please try again or contact support.";

			if (error?.response?.status === 401) {
				message =
					"You have reached the maximum amount of stored typescales.<br/> You can delete some through the load menu.";
			}
			showNotification(message);
			logError(message, error);
		}
	};
</script>

<div class="wrapper">
	<Button size="s" type="primary" on:click={() => (open = !open)}>Save</Button>

	<Menu bind:open>
		<div class="menu-content">
			<Input name="typescale-name" label="Typescale Name" bind:value={$typescaleName} />
			{#if $typescaleName.length > maxChars}
				<p class="error-message tooltip">Sorry!<br />Max allowed length is {maxChars} chars</p>
			{/if}
			<Button
				disabled={!$typescaleName || $typescaleName.length > maxChars}
				size="s"
				type="primary"
				on:click={() => {
					save();
				}}>Save</Button
			>
		</div>
	</Menu>
</div>

<style lang="scss">
	.wrapper {
		z-index: 1;
		position: relative;
	}

	.error-message {
		margin-top: $s3;
		color: darkred;
	}

	.menu-content {
		:global(.btn) {
			margin-top: $s4;
		}
	}
</style>
