import { describe, expect, test } from 'vitest';
import {
	distributedWeights,
	fontName,
	headingsFinalWeight,
	headingsInitialWeight,
	typescale
} from './config';
import { get } from 'svelte/store';
const expectedRange = (value: number, from: number, to: number) => value >= from && value <= to;

describe('tpyographyc scale config', () => {
	fontName.set('Roboto');

	test('The letterSpacing values fall within the expected ranges', () => {
		expect(get(typescale)[0].letterSpacing).toSatisfy((val: number) =>
			expectedRange(val, -0.01, 0.06)
		);
		expect(get(typescale).at(-1)!.letterSpacing).toSatisfy((val: number) =>
			expectedRange(val, -0.01, 0.06)
		);
	});

	test('The weight distributions are correct for the default ascending set of values', () => {
		expect(get(distributedWeights).at(-1)!).toBeLessThan(get(distributedWeights)[0]);
	});

	test('The weight distributions are correct fonts with a single weight', () => {
		fontName.set('Noto Sans Glagolitic');
		expect(get(distributedWeights).at(-1)!).toBe(get(distributedWeights)[0]);
	});

	test('The weight distributions are correct for an descending range', () => {
		fontName.set('Roboto');
		headingsInitialWeight.set(900);
		headingsFinalWeight.set(400);
		expect(get(distributedWeights).at(-1)!).toBeGreaterThan(get(distributedWeights)[0]);
		get(distributedWeights).forEach((weight) => {
			expect(weight).toSatisfy((val: number) => expectedRange(val, 400, 900));
		});
	});

	test('The weight initial assiged weight is ussed', () => {
		fontName.set('Roboto');
		headingsInitialWeight.set(900);
		headingsFinalWeight.set(400);
		expect(get(headingsInitialWeight)).toEqual(900);
	});
	test('The weight final assiged weight is ussed', () => {
		fontName.set('Roboto');
		headingsInitialWeight.set(900);
		headingsFinalWeight.set(400);
		expect(get(headingsFinalWeight)).toEqual(400);
	});
});
