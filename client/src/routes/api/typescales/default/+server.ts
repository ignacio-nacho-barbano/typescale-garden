import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';

export const GET: RequestHandler = async () => {
	try {
		const typescales = await prisma.typescale.findMany({
			where: { authorId: 'typescale-garden' }
		});

		return json({ typescales });
	} catch (error) {
		console.error('Error fetching default typescales:', error);
		return json(
			{ message: 'The server was unable to request the default typescales', error },
			{ status: 500 }
		);
	}
};
