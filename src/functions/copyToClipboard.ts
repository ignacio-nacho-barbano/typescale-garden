export const copyToClipboard = async (text: string) => {
	try {
		await navigator.clipboard.writeText(text);
		alert('Text copied to clipboard!');
	} catch (err) {
		console.error('Error copying text to clipboard:', err);
		alert('Failed to copy text to clipboard.');
	}
};
