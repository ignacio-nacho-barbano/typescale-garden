export const calculateDistributeWeights = (variants: any[], weightSteps: number[]): number[] => {
	const necessarySteps = weightSteps.reverse().slice(0, variants.length - 1);
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

	console.log(variantWeights);

	return variantWeights;
};
