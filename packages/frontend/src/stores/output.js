import { writable } from "svelte/store";

export const visible = writable(true);
export const stdout = writable("");
export const stderr = writable("");
