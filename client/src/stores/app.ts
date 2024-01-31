import { writable, type Writable } from "svelte/store";
import { showNotification } from "./notifications";

export const secondaryNav: Writable<"parameters" | "contrast" | "export"> = writable("parameters");
export const testingColors = writable(false);
export const exportNav: Writable<"css" | "tokens"> = writable("css");

export const accordionStates = writable({
	parameters: true,
	contrast: false,
	export: false
});

testingColors.subscribe((value) => {
	if (value) showNotification("Testing Colors");
});
