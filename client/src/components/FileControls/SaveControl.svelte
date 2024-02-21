<script lang="ts">
	import Button from "../Button.svelte";
	import { fetch } from "../../stores/fetch";
	import { storedTypescales } from "../../stores/typescales";
	import { showNotification } from "../../stores/notifications";

	const save = async () => {
		try {
			const res = await $fetch.post("/typescales", {
				data: {
					name: "Test 7",
					base: {
						fontName: "Ching chung",
						breakpoint: 768,
						baseSize: 16,
						baseUnit: 4,
						desktopRatio: 1.29,
						mobileRatio: 1.15,
						letterSpacingRatio: 1.2,
						useUppercaseForTitles: false,
						useItalicsForTitles: false,
						headingsInitialWeight: 200,
						headingsFinalWeight: 400
					}
				}
			});

			storedTypescales.set(res.data.typescales);
			showNotification("Typescale saved successfully");
		} catch (error) {
			const message = "ERROR: Could not save the typescale please try again or contact support.";
			showNotification("ERROR: Could not save the typescale please try again or contact support.");
			console.error(message, error);
		}
	};
</script>

<Button size="s" type="primary" on:click={save}>Save</Button>
