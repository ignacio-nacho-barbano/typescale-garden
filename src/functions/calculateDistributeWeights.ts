export const calculateDistributeWeights = (
	headingsFinalWeight: number,
	headingsInitialWeight: number,
	variants: any[],
	weightSteps: number[]
): number[] => {
	//  add weight steps to cssOutput, correct extra values
	const variantWeights: number[] = variants.map(
		(_, i) => weightSteps[Math.ceil(weightSteps.length / i - 1)] || headingsFinalWeight
	);

	console.log(weightSteps.length, variantWeights, headingsInitialWeight, headingsFinalWeight);

	return variantWeights;
};
