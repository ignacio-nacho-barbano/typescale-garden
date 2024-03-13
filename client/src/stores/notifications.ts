import { derived, writable, type Writable } from "svelte/store";
import type { Notification } from "../models";

const notifications: Writable<Notification[]> = writable([]);
const deleteById = (id: string) =>
	notifications.update((prev) => prev.filter(({ id: idToDelete }) => id !== idToDelete));
notifications.update((prev) => prev.filter(({ id: idToDelete }) => id !== idToDelete));
export const notificationsQueue = derived(notifications, ($notif) => $notif);

export const showNotification = (text: string) => {
	const id = Math.random().toString();

	notifications.update((prev) => [...prev, { id, text, timestamp: new Date() }]);

	setTimeout(() => deleteById(id), 10000);
};

export const removeNotification = (id: string) => {
	deleteById(id);
};
