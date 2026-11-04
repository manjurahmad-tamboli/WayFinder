export const FAVORITES_STORAGE_KEY = "wayfinder:favorites:v1";

export function normalizeFavoriteId(value) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export function normalizeFavoriteIds(values) {
  if (!Array.isArray(values) && !(values instanceof Set)) return new Set();
  return new Set(Array.from(values, normalizeFavoriteId).filter((id) => id !== null));
}

export function parseFavoriteIds(serializedValue) {
  try {
    return normalizeFavoriteIds(JSON.parse(serializedValue || "[]"));
  } catch {
    return new Set();
  }
}

export function readFavoriteIds(storage) {
  try {
    const target = storage ?? globalThis.localStorage;
    return parseFavoriteIds(target.getItem(FAVORITES_STORAGE_KEY));
  } catch {
    return new Set();
  }
}

export function writeFavoriteIds(ids, storage) {
  try {
    const target = storage ?? globalThis.localStorage;
    target.setItem(FAVORITES_STORAGE_KEY, JSON.stringify([...normalizeFavoriteIds(ids)]));
    return true;
  } catch {
    return false;
  }
}

export function toggleFavoriteId(currentIds, locationId) {
  const id = normalizeFavoriteId(locationId);
  const ids = normalizeFavoriteIds(currentIds);
  if (id === null) return { ids, added: false, changed: false };
  if (ids.has(id)) {
    ids.delete(id);
    return { ids, added: false, changed: true };
  }
  ids.add(id);
  return { ids, added: true, changed: true };
}

export function retainValidFavoriteIds(currentIds, validIds) {
  const valid = normalizeFavoriteIds(Array.from(validIds || []));
  return new Set([...normalizeFavoriteIds(currentIds)].filter((id) => valid.has(id)));
}
