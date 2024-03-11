import { Axios } from "axios";
import { showNotification } from "../stores/notifications";
import { storedTypescales } from "../stores/typescales";

export const deleteTypescale = async (fetch: Axios, id: string) => {
	try {
		const res = await fetch.delete("/typescales/saved/" + id);

		storedTypescales.set(res.data.typescales);
		showNotification("Typescale deleted successfully");
	} catch (error) {
		const message = "ERROR: Could not delete the typescale please try again or contact support.";

		showNotification(message);
		console.error(message, error);
	}
};
