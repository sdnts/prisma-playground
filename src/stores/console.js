import { writable } from "svelte/store";

const { subscribe, set, update } = writable({
  visible: false,
  value: "",
});

const store = {
  subscribe,

  show: () =>
    update((s) => {
      s.visible = true;
      return s;
    }),

  hide: () =>
    update((s) => {
      s.visible = false;
      return s;
    }),

  toggle: () =>
    update((s) => {
      s.visible = !s.visible;
      return s;
    }),

  setValue: (v) =>
    update((s) => {
      s.value = v;
      return s;
    }),
};

export default store;
