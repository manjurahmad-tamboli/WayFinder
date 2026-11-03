import { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  Polyline,
  CircleMarker,
  TileLayer,
  Tooltip,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import CategoryMarker from "./CategoryMarker";
import CategoryLegend from "./CategoryLegend";
import {
  filterLocationsByCategories,
  LOCATION_CATEGORY_KEYS,
  normalizeCategoryName,
} from "../data/locationCategories";

function FitMap({ locations, route }) {
  const map = useMap();

  useEffect(() => {
    const points = route?.length
      ? route
      : locations.map((location) => [
          location.latitude,
          location.longitude,
        ]);

    if (points.length) {
      map.fitBounds(points, {
        padding: [35, 35],
        maxZoom: 17,
      });
    }
  }, [locations, route, map]);

  return null;
}

export default function CampusMap({
  locations = [],
  route = [],
  selectedLocationId,
  onLocationSelect,
}) {
  const [activeLocationId, setActiveLocationId] = useState(null);
  const [selectedCategories, setSelectedCategories] = useState(
    () => new Set(LOCATION_CATEGORY_KEYS)
  );
  const visibleLocations = useMemo(
    () => filterLocationsByCategories(locations, selectedCategories),
    [locations, selectedCategories]
  );
  const selectedId = selectedLocationId === undefined
    ? activeLocationId
    : selectedLocationId;

  useEffect(() => {
    if (selectedId == null) return;
    const stillVisible = visibleLocations.some((location) => location.id === selectedId);
    if (!stillVisible) {
      if (selectedLocationId === undefined) setActiveLocationId(null);
      else onLocationSelect?.(null);
    }
  }, [onLocationSelect, selectedId, selectedLocationId, visibleLocations]);

  function selectLocation(locationId) {
    if (selectedLocationId === undefined) setActiveLocationId(locationId);
    onLocationSelect?.(locationId);
  }

  function toggleCategory(category) {
    const categoryKey = normalizeCategoryName(category);
    setSelectedCategories((current) => {
      const next = new Set(current);
      if (next.has(categoryKey)) next.delete(categoryKey);
      else next.add(categoryKey);
      return next;
    });
  }

  function selectAllCategories() {
    setSelectedCategories(new Set(LOCATION_CATEGORY_KEYS));
  }

  function clearAllCategories() {
    setSelectedCategories(new Set());
  }

  return (
    <div className="map-card relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm">
      <MapContainer
        center={[16.8454, 74.6017]}
        zoom={18}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%" }}
      >
        {/* OpenStreetMap Tiles */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Auto Fit Map */}
        <FitMap
          locations={locations}
          route={route}
        />

        {/* Walking route beneath location pins */}
        {route.length > 1 && (
          <>
            <Polyline
              positions={route}
              pathOptions={{ color: "#ff5578", weight: 8, opacity: 0.2 }}
            />
            <Polyline
              positions={route}
              pathOptions={{
                color: "#ff5578",
                weight: 4,
                opacity: 0.95,
                className: "route-flow-line",
              }}
            />
            <CircleMarker
              center={route[0]}
              radius={8}
              pathOptions={{ color: "#ffffff", weight: 3, fillColor: "#16a34a", fillOpacity: 1 }}
            >
              <Tooltip direction="top" offset={[0, -8]} permanent>
                Start
              </Tooltip>
            </CircleMarker>
            <CircleMarker
              center={route[route.length - 1]}
              radius={8}
              pathOptions={{ color: "#ffffff", weight: 3, fillColor: "#dc2626", fillOpacity: 1 }}
            >
              <Tooltip direction="top" offset={[0, -8]} permanent>
                Destination
              </Tooltip>
            </CircleMarker>
          </>
        )}

        {/* Location Markers */}
        {visibleLocations.map((location) => (
          <CategoryMarker
            key={location.id}
            location={location}
            selected={selectedId === location.id}
            onSelect={selectLocation}
          />
        ))}
      </MapContainer>
      <CategoryLegend
        selectedCategories={selectedCategories}
        onToggleCategory={toggleCategory}
        onSelectAll={selectAllCategories}
        onClearAll={clearAllCategories}
      />
    </div>
  );
}
