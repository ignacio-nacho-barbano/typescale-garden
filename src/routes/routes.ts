import type { Route } from '../models';

export const routes: Route[] = [
	{
		name: 'How it Works',
		url: '/',
		id: 'how-it-works'
	},
	{
		name: 'Your Typescale',
		url: '/table',
		id: 'typescale'
	},
	{
		name: 'About',
		url: '/about',
		id: 'about'
	},
	{
		name: 'Contrast',
		url: '/contrast',
		id: 'contrast'
	}
];

export const getInTouch = {
	name: 'Get in Touch',
	url: 'mailto:nacho.barbano.dev@gmail.com'
};
