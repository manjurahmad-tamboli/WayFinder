import assert from "node:assert/strict";
import test from "node:test";

import {
  getInitialTheme,
  readSavedTheme,
  saveTheme,
  THEME_STORAGE_KEY,
} from "./themeStore.js";

function makeStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
  };
}

test("a saved theme takes priority over the system preference", () => {
  const storage = makeStorage({ [THEME_STORAGE_KEY]: "light" });
  const matchMedia = () => ({ matches: true });

  assert.equal(getInitialTheme({ storage, matchMedia }), "light");
});

test("first visit follows the system preference", () => {
  const storage = makeStorage();

  assert.equal(getInitialTheme({ storage, matchMedia: () => ({ matches: true }) }), "dark");
  assert.equal(getInitialTheme({ storage, matchMedia: () => ({ matches: false }) }), "light");
});

test("manual theme choices persist and invalid saved values are ignored", () => {
  const storage = makeStorage();

  assert.equal(saveTheme("dark", storage), true);
  assert.equal(readSavedTheme(storage), "dark");
  storage.setItem(THEME_STORAGE_KEY, "blue");
  assert.equal(readSavedTheme(storage), null);
  assert.equal(saveTheme("blue", storage), false);
});
