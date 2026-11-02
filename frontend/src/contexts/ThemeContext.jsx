import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { getInitialTheme, readSavedTheme, saveTheme } from "./themeStore";

const ThemeContext = createContext(null);
const DARK_MODE_QUERY = "(prefers-color-scheme: dark)";

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme);
  const [hasManualPreference, setHasManualPreference] = useState(() => Boolean(readSavedTheme()));

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.classList.toggle("dark", theme === "dark");
    root.style.colorScheme = theme;
  }, [theme]);

  useEffect(() => {
    if (hasManualPreference || typeof window.matchMedia !== "function") return undefined;

    const mediaPreference = window.matchMedia(DARK_MODE_QUERY);
    const updateFromSystem = (event) => setTheme(event.matches ? "dark" : "light");

    if (mediaPreference.addEventListener) {
      mediaPreference.addEventListener("change", updateFromSystem);
      return () => mediaPreference.removeEventListener("change", updateFromSystem);
    }

    mediaPreference.addListener?.(updateFromSystem);
    return () => mediaPreference.removeListener?.(updateFromSystem);
  }, [hasManualPreference]);

  const toggleTheme = useCallback(() => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    saveTheme(nextTheme);
    setHasManualPreference(true);
    setTheme(nextTheme);
  }, [theme]);

  const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within a ThemeProvider");
  return context;
}
