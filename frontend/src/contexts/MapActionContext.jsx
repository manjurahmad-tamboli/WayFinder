import { createContext, useCallback, useContext, useMemo, useState } from "react";

const MapActionContext = createContext(null);

export function MapActionProvider({ children }) {
  const [mapAction, setMapAction] = useState(null);

  const dispatchMapAction = useCallback((action) => {
    setMapAction({ ...action, eventId: `${Date.now()}-${Math.random().toString(36).slice(2)}` });
  }, []);

  const value = useMemo(() => ({ mapAction, dispatchMapAction }), [mapAction, dispatchMapAction]);
  return <MapActionContext.Provider value={value}>{children}</MapActionContext.Provider>;
}

export function useMapActions() {
  const value = useContext(MapActionContext);
  if (!value) throw new Error("useMapActions must be used inside MapActionProvider");
  return value;
}
