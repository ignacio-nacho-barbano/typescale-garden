<script lang="ts">
	import Button from "../Button.svelte";
	import { fetch } from "../../stores/fetch";
	import { loadedTypescale, loadedTypescaleId, storedTypescales } from "../../stores/typescales";
	import { showNotification } from "../../stores/notifications";
	import {
		baseSize,
		baseUnit,
		breakpoint,
		desktopRatio,
		fontName,
		headingsFinalWeight,
		letterSpacingRatio,
		mobileRatio,
		typescaleName,
		headingsInitialWeight,
		useItalicsForTitles,
		useUppercaseForTitles
	} from "../../stores/config";
	import Menu from "../Menu.svelte";
	import Input from "../Input.svelte";
	import type { AxiosResponse } from "axios";
	import type { Typescale } from ".prisma/client";

	let open = false;

	const save = async (saveAsNew = false) => {
		const existingTypescale = $storedTypescales.find(({ name }) => name === $typescaleName);
		const data: Partial<Typescale> = {
			name: $typescaleName,
			base: {
				fontName: $fontName,
				breakpoint: $breakpoint,
				baseSize: $baseSize,
				baseUnit: $baseUnit,
				desktopRatio: $desktopRatio,
				mobileRatio: $mobileRatio,
				letterSpacingRatio: $letterSpacingRatio,
				useUppercaseForTitles: $useUppercaseForTitles,
				useItalicsForTitles: $useItalicsForTitles,
				headingsInitialWeight: $headingsInitialWeight,
				headingsFinalWeight: $headingsFinalWeight
			}
		};

		let res: AxiosResponse<{ typescales: Typescale[] }>;

		try {
			if (saveAsNew || !existingTypescale) {
				res = await $fetch.post("/typescales/saved", {
					data
				});
			} else {
				res = await $fetch.put("/typescales/saved/" + existingTypescale.id, {
					data
				});
			}

			storedTypescales.set(res.data.typescales);
			showNotification(`Typescale ${existingTypescale ? "updated" : "saved"} successfully`);
		} catch (error) {
			let message = "ERROR: Could not save the typescale please try again or contact support.";

			if (error?.response?.status === 401) {
				message =
					"You have reached the maximum amount of stored typescales.<br/> You can delete some through the load menu.";
			}
			showNotification(message);
			console.error(message, error);
		}
	};
</script>

<div class="wrapper">
	<Button size="s" type="primary" on:click={() => (open = !open)}>Save</Button>

	<Menu bind:open>
		<div class="menu-content">
			<Input name="typescale-name" label="Typescale Name" bind:value={$typescaleName} />
			<Button
				disabled={!$typescaleName}
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

	.menu-content {
		:global(.btn) {
			margin-top: $s4;
		}
	}
</style>
