import test from "node:test";
import assert from "node:assert/strict";

import {
  FAVORITES_STORAGE_KEY,
  normalizeFavoriteIds,
  readFavoriteIds,
  retainValidFavoriteIds,
  toggleFavoriteId,
  writeFavoriteIds,
} from "./favoritesStore.js";

function makeStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
  };
}

test("favorites add and remove without allowing duplicate IDs", () => {
  const first = toggleFavoriteId(new Set(), "12");
  assert.equal(first.added, true);
  assert.deepEqual([...first.ids], [12]);

  const second = toggleFavoriteId(first.ids, 12);
  assert.equal(second.added, false);
  assert.deepEqual([...second.ids], []);
  assert.deepEqual([...normalizeFavoriteIds([12, "12", -1, "bad", 2.5])], [12]);
});

test("favorites survive a reload through browser storage", () => {
  const storage = makeStorage();
  writeFavoriteIds(new Set([3, 9]), storage);
  assert.deepEqual([...readFavoriteIds(storage)], [3, 9]);
  assert.equal(storage.getItem(FAVORITES_STORAGE_KEY), "[3,9]");
});

test("outdated or deleted location IDs can be pruned safely", () => {
  const saved = new Set([1, 2, 900]);
  assert.deepEqual([...retainValidFavoriteIds(saved, [1, 2, 3])], [1, 2]);
  assert.deepEqual([...retainValidFavoriteIds(saved, [])], []);
});
