export const THEME_STORAGE_KEY = "wayfinder-theme";
export const DEFAULT_THEME = "dark";

function getBrowserStorage() {
  try {
    return globalThis.localStorage;
  } catch {
    return null;
  }
}

function getMatchMedia() {
  const browserWindow = globalThis.window;
  return browserWindow?.matchMedia?.bind(browserWindow);
}

export function isValidTheme(theme) {
  return theme === "light" || theme === "dark";
}

export function readSavedTheme(storage = getBrowserStorage()) {
  if (!storage) return null;
  try {
    const savedTheme = storage.getItem(THEME_STORAGE_KEY);
    return isValidTheme(savedTheme) ? savedTheme : null;
  } catch {
    return null;
  }
}

export function saveTheme(theme, storage = getBrowserStorage()) {
  if (!isValidTheme(theme) || !storage) return false;
  try {
    storage.setItem(THEME_STORAGE_KEY, theme);
    return true;
  } catch {
    return false;
  }
}

export function getInitialTheme({ storage = getBrowserStorage(), matchMedia = getMatchMedia() } = {}) {
  const savedTheme = readSavedTheme(storage);
  if (savedTheme) return savedTheme;

  try {
    return matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  } catch {
    return DEFAULT_THEME;
  }
}
