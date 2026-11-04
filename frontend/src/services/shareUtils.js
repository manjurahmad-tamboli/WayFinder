import { normalizeFavoriteId } from "../contexts/favoritesStore.js";

export function makeLocationShareUrl(locationId, origin = globalThis.location?.origin || "") {
  const id = normalizeFavoriteId(locationId);
  if (id === null || !origin) return "";
  return `${origin.replace(/\/$/, "")}/locations/${id}`;
}

export function formatLocationCoordinates(location) {
  if (!location) return "";
  const hasValue = (value) => value !== null && value !== undefined && String(value).trim() !== "";
  if (!hasValue(location.latitude) || !hasValue(location.longitude)) return "";
  const latitude = Number(location.latitude);
  const longitude = Number(location.longitude);
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) return "";
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) return "";
  return `${latitude}, ${longitude}`;
}

export async function copyTextToClipboard(text, environment = {}) {
  const navigatorObject = environment.navigatorObject ?? globalThis.navigator;
  const documentObject = environment.documentObject ?? globalThis.document;
  if (!text) return false;

  if (typeof navigatorObject?.clipboard?.writeText === "function") {
    try {
      await navigatorObject.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to the legacy selection-based copy path.
    }
  }

  if (!documentObject?.createElement || !documentObject?.body || typeof documentObject.execCommand !== "function") return false;

  let field;
  try {
    field = documentObject.createElement("textarea");
    field.value = text;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.opacity = "0";
    documentObject.body.appendChild(field);
    field.focus();
    field.select();
    return Boolean(documentObject.execCommand("copy"));
  } catch {
    return false;
  } finally {
    if (field?.parentNode) field.parentNode.removeChild(field);
  }
}
