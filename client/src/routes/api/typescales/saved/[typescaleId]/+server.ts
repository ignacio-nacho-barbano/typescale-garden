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

// PUT /api/typescales/saved/[typescaleId] - Update typescale
export const PUT: RequestHandler = async (event) => {
	try {
		if (!event.locals.auth) {
			return json({ message: 'Unauthorized' }, { status: 401 });
		}

		const userId = event.locals.auth.payload.sub;
		const typescaleId = event.params.typescaleId;
		const { data } = await event.request.json();

		data.authorId = userId;

		// Parse float properties
		parseFloatProps(data.base);

		// Update typescale (only if owned by user)
		await prisma.typescale.update({
			where: { id: typescaleId, authorId: userId },
			data
		});

		// Return updated list
		const typescales = await getUserTypescales(userId);
		return json({ typescales });
	} catch (error) {
		console.error('Error updating typescale:', error);
		return json({ message: 'Server could not save the typescale', error }, { status: 500 });
	}
};

// DELETE /api/typescales/saved/[typescaleId] - Delete typescale
export const DELETE: RequestHandler = async (event) => {
	try {
		if (!event.locals.auth) {
			return json({ message: 'Unauthorized' }, { status: 401 });
		}

		const userId = event.locals.auth.payload.sub;
		const typescaleId = event.params.typescaleId;

		// Delete typescale (only if owned by user)
		await prisma.typescale.delete({
			where: { id: typescaleId, authorId: userId }
		});

		// Return updated list
		const typescales = await getUserTypescales(userId);
		return json({ typescales });
	} catch (error) {
		console.error('Error deleting typescale:', error);
		return json({ message: 'Server could not delete the typescale', error }, { status: 500 });
	}
};
