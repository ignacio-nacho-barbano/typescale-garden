export const calculateDistributeWeights = (
	headingsFinalWeight: number,
	headingsInitialWeight: number,
	variants: any[]
): number[] => {
	const ascendingWeight = headingsFinalWeight >= headingsInitialWeight;
	const starting = ascendingWeight ? headingsInitialWeight : headingsFinalWeight;
	//  add weight steps to cssOutput, correct extra values
	const weightSteps = new Array(Math.abs(headingsInitialWeight - headingsFinalWeight) / 100 + 1)
		.fill(0)
		.map((_, i) => starting + (ascendingWeight ? 100 : -100) * i);
	const repetitionsPerWeight = Math.ceil(variants.length / weightSteps.length);

	const variantWeights: number[] = [];

	weightSteps.forEach((weight) => {
		for (let i = 0; i < repetitionsPerWeight; i++) {
			variantWeights.unshift(weight);
		}
	});
	console.log(variantWeights, headingsInitialWeight, headingsFinalWeight);

	return variantWeights;
};
