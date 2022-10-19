import { ref } from "vue";
import { defineStore } from "pinia";

export const useGlobalStore = defineStore("global", () => {
  const darkMode = ref(false);

  return { darkMode };
});
