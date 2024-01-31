import { showNotification } from "../stores/notifications";

export const copyToClipboard = async (text: string, description?: string) => {
	try {
		await navigator.clipboard.writeText(text);
		showNotification((description || "Text") + " copied to clipboard!");
	} catch (err) {
		console.error("Error copying text to clipboard:", err);
		showNotification("Failed to copy text to clipboard.");
	}
};
