import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";

import {
  FAVORITES_STORAGE_KEY,
  normalizeFavoriteId,
  parseFavoriteIds,
  readFavoriteIds,
  retainValidFavoriteIds,
  toggleFavoriteId,
  writeFavoriteIds,
} from "./favoritesStore";

const FavoritesContext = createContext(null);

export function FavoritesProvider({ children }) {
  const [favoriteIds, setFavoriteIds] = useState(readFavoriteIds);
  const latestIds = useRef(favoriteIds);

  useEffect(() => {
    latestIds.current = favoriteIds;
    writeFavoriteIds(favoriteIds);
  }, [favoriteIds]);

  useEffect(() => {
    function syncStorage(event) {
      if (event.key !== FAVORITES_STORAGE_KEY && event.key !== null) return;
      const nextIds = event.key === null ? readFavoriteIds() : parseFavoriteIds(event.newValue);
      latestIds.current = nextIds;
      setFavoriteIds(nextIds);
    }

    window.addEventListener("storage", syncStorage);
    return () => window.removeEventListener("storage", syncStorage);
  }, []);

  const toggleFavorite = useCallback((locationOrId) => {
    const id = normalizeFavoriteId(typeof locationOrId === "object" ? locationOrId?.id : locationOrId);
    if (id === null) return false;
    const result = toggleFavoriteId(latestIds.current, id);
    latestIds.current = result.ids;
    setFavoriteIds(result.ids);
    const persisted = writeFavoriteIds(result.ids);
    if (persisted) toast.success(result.added ? "Added to favorites" : "Removed from favorites");
    else toast.error("Browser storage is unavailable; favorites may not survive a refresh");
    return result.added;
  }, []);

  const removeFavorite = useCallback((locationOrId) => {
    const id = normalizeFavoriteId(typeof locationOrId === "object" ? locationOrId?.id : locationOrId);
    if (id === null || !latestIds.current.has(id)) return false;
    const nextIds = new Set(latestIds.current);
    nextIds.delete(id);
    latestIds.current = nextIds;
    setFavoriteIds(nextIds);
    if (writeFavoriteIds(nextIds)) toast.success("Removed from favorites");
    else toast.error("Browser storage is unavailable; favorites may not survive a refresh");
    return true;
  }, []);

  const pruneFavorites = useCallback((validIds) => {
    const nextIds = retainValidFavoriteIds(latestIds.current, validIds);
    const unchanged = nextIds.size === latestIds.current.size && [...nextIds].every((id) => latestIds.current.has(id));
    if (!unchanged) {
      latestIds.current = nextIds;
      setFavoriteIds(nextIds);
    }
  }, []);

  const value = useMemo(() => ({
    favoriteIds,
    isFavorite: (locationOrId) => {
      const id = normalizeFavoriteId(typeof locationOrId === "object" ? locationOrId?.id : locationOrId);
      return id !== null && favoriteIds.has(id);
    },
    toggleFavorite,
    removeFavorite,
    pruneFavorites,
  }), [favoriteIds, toggleFavorite, removeFavorite, pruneFavorites]);

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) throw new Error("useFavorites must be used inside FavoritesProvider");
  return context;
}
