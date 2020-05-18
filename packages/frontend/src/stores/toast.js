import { writable } from "svelte/store";

export const level = writable("INFO"); // "INFO" || "ERROR"
export const visible = writable(false);
export const messages = writable([]);
