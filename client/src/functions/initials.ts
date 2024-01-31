export const getInitials = (text: string, amount = 2) =>
	text
		.split(" ")
		.splice(0, amount)
		.map((string) => string.charAt(0))
		.join("");
