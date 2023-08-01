import { projects } from '../../../constants/projects';
import type { PageLoad } from './$types';

export const load = (async ({ params: { id } }) => {
	return { id: +id, data: projects[+id] };
}) satisfies PageLoad;
