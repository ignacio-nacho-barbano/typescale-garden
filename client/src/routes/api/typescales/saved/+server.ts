import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { parseFloatProps } from '$lib/server/utils';

// Helper function to get user's typescales
async function getUserTypescales(userId: string) {
	try {
		const typescales = await prisma.typescale.findMany({
			where: {
				authorId: {
					in: [userId || 'none', 'typescale-garden']
				}
			},
			orderBy: {
				lastModifiedAt: 'desc'
			}
		});

		return typescales;
	} catch (error) {
		throw new Error('Unable to gather typescales from database');
	}
}

// GET /api/typescales/saved - Get user's typescales (+ defaults)
export const GET: RequestHandler = async (event) => {
	try {
		if (!event.locals.auth) {
			return json({ message: 'Unauthorized' }, { status: 401 });
		}

		const userId = event.locals.auth.payload.sub;
		const typescales = await getUserTypescales(userId);

		return json({ typescales });
	} catch (error) {
		console.error('Error fetching user typescales:', error);
		return json(
			{ message: 'Unable to gather typescales from database' },
			{ status: 500 }
		);
	}
};

// POST /api/typescales/saved - Create new typescale
export const POST: RequestHandler = async (event) => {
	try {
		if (!event.locals.auth) {
			return json({ message: 'Unauthorized' }, { status: 401 });
		}

		const userId = event.locals.auth.payload.sub;
		const permissions = event.locals.auth.payload.permissions || [];
		const { data } = await event.request.json();

		data.authorId = userId;

		// Check existing typescales count
		const existingTypescales = await prisma.typescale.findMany({
			where: { authorId: userId }
		});

		const maxTypescales = permissions.includes('store:typescales-premium') ? 100 : 5;

		if (existingTypescales.length >= maxTypescales) {
			return json(
				{ message: 'You have reached the maximum amount of typescales' },
				{ status: 401 }
			);
		}

		// Parse float properties
		parseFloatProps(data.base);

		// Create typescale
		await prisma.typescale.create({ data });

		// Return updated list
		const typescales = await getUserTypescales(userId);
		return json({ typescales });
	} catch (error) {
		console.error('Error creating typescale:', error);
		return json({ message: 'Server could not save the typescale', error }, { status: 500 });
	}
};
