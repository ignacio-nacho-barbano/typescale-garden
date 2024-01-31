export const getFromLocalStorage = (name: string) => {
	let value;
	try {
		value = localStorage.getItem(name);
	} catch (error) {
		console.error("could not retrieve " + name + " from local storage", error);
	}

	return value;
};

export const saveInLocalStorage = (name: string, value: string) => {
	try {
		localStorage.setItem(name, value);
	} catch (error) {
		console.error("could not store " + name + " on local storage", error);
	}

	return value;
};
