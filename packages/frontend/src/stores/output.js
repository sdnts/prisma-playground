import { writable } from "svelte/store";

export const visible = writable(false);
export const stdout = writable("");
export const stderr = writable("");
