/**
 * Spreads `weightSteps` across `variantCount` slots, repeating each step and
 * handing the remainder out to the earliest steps.
 *
 * Takes a count rather than the variants array: the original
 * (calculateDistributeWeights) accepted `unknown[]` and only ever read its
 * `.length`.
 *
 * Note the existing edge case, preserved: when there are more steps than slots,
 * repetitionsPerStep is 0 and the result is empty.
 */
export const distributeWeights = (
	variantCount: number,
	weightSteps: readonly number[]
): number[] => {
	const necessarySteps = weightSteps;
	const repetitionsPerStep = Math.floor(variantCount / necessarySteps.length);
	let extraSpaces = variantCount - repetitionsPerStep * necessarySteps.length;
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
