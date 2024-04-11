export const asyncRetry = async <T>(request: () => Promise<T>, attempts = 3, seconds = 5) => {
	return new Promise(async (resolve, reject) => {
		let attemptsCount = 0;
		let res: T | null;
		let lastError = "Unknown";

		try {
			res = await request();

			if (res) {
				resolve(res);
			}
		} catch (e) {
			const intervalId = setInterval(async () => {
				attemptsCount++;

				if (!res && attemptsCount <= attempts) {
					res = await request().catch((e) => {
						lastError = e as string;
						return null;
					});

					if (res) {
						resolve(res);
					}
				} else {
					clearInterval(intervalId);

					reject(lastError);
				}
			}, seconds * 1000);
		}
	});
};
