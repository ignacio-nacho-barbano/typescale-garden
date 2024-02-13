import { writable } from "svelte/store";
import type { StoredTypescale } from "../models";

export const storedTypescales = writable<StoredTypescale[]>([]);
