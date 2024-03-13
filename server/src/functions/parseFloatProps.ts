export const parseFloatProps = (object: Record<string, string | number>) => {
	Object.keys(object).forEach((key) => {
		const value = object[key];
		if (typeof value === "string") {
			const valueAsFloat = parseFloat(value);

			if (!Number.isNaN(valueAsFloat)) {
				object[key] = valueAsFloat;
			}
		}
	});
};
