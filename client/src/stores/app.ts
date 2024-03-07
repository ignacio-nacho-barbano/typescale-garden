// This store takes care of all of the UI Related aspects of the app
import { writable, type Writable } from "svelte/store";
import { showNotification } from "./notifications";

export const secondaryNav: Writable<"parameters" | "contrast" | "export"> = writable("parameters");
export const testingColors = writable(false);
export const exportNav: Writable<"css" | "tokens"> = writable("css");
export const sidebarOpen = writable(true);
export const userSidebarOpen = writable(false);
export const mobileView = writable(false);
export const windowWidth = writable(0);

export const accordionStates = writable({
	file: true,
	parameters: true,
	contrast: false,
	export: false
});

testingColors.subscribe((value) => {
	if (value) showNotification("Testing Colors");
});
