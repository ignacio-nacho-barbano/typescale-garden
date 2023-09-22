export const calculateDistributeWeights = (
	variants: unknown[],
	weightSteps: number[]
): number[] => {
	const necessarySteps = weightSteps;
	const repetitionsPerStep = Math.floor(variants.length / necessarySteps.length);
	let extraSpaces = variants.length - repetitionsPerStep * necessarySteps.length;
	const variantWeights: number[] = [];

	for (let i = 0; i < necessarySteps.length; i++) {
		for (let j = 0; j < repetitionsPerStep; j++) {
			variantWeights.push(necessarySteps[i]);
			if (extraSpaces > 0) {
				variantWeights.push(necessarySteps[i]);
				extraSpaces--;
			}
		}
	}

	return variantWeights;
};
