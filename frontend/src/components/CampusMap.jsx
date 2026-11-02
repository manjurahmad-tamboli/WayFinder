import { useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import CategoryLegend from "./CategoryLegend";
import CategoryMarker from "./CategoryMarker";
import useCategoryFilter from "../hooks/useCategoryFilter";
import { isValidCoordinates } from "../services/distanceUtils";

const EMPTY_LIST = [];

const currentLocationIcon = L.divIcon({
  className: "wayfinder-current-location-wrap",
  html: '<span class="wayfinder-current-location"><span></span></span>',
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

function FitMap({ locations, route }) {
  const map = useMap();

  useEffect(() => {
    const points = route?.length
      ? route
      : locations.filter((location) => isValidCoordinates(location.latitude, location.longitude)).map((location) => [
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

function FocusSelected({ locations, selectedLocationId, route }) {
  const map = useMap();
  useEffect(() => {
    if (route?.length || selectedLocationId == null) return;
    const location = locations.find((item) => Number(item.id) === Number(selectedLocationId));
    if (location && isValidCoordinates(location.latitude, location.longitude)) {
      map.flyTo([location.latitude, location.longitude], Math.max(map.getZoom(), 18), { duration: 0.55 });
    }
  }, [locations, map, route, selectedLocationId]);
  return null;
}

export default function CampusMap({
  locations = EMPTY_LIST,
  route = EMPTY_LIST,
  userPosition = null,
  selectedLocationId,
  onSelectLocation,
  mapAction = null,
}) {
  const [localSelectedId, setLocalSelectedId] = useState(null);
  const [highlightedIds, setHighlightedIds] = useState([]);
  const lastHandledActionId = useRef(null);
  const activeSelectedId = selectedLocationId !== undefined
    ? selectedLocationId
    : localSelectedId;
  const {
    selectedCategories,
    filteredLocations,
    toggleCategory,
    selectAllCategories,
    selectOnlyCategory,
    clearAllCategories,
  } = useCategoryFilter(locations);

  const actionRoute = mapAction?.type === "show_route" ? mapAction.route?.route : null;
  const activeRoute = route?.length ? route : actionRoute || EMPTY_LIST;
  const visibleLocations = useMemo(() => {
    const visibleIds = new Set(filteredLocations.map((location) => Number(location.id)));
    const selectedOnly = locations.filter((location) =>
      highlightedIds.includes(Number(location.id)) && !visibleIds.has(Number(location.id)),
    );
    return [...filteredLocations, ...selectedOnly];
  }, [filteredLocations, highlightedIds, locations]);

  function selectLocation(locationId) {
    setLocalSelectedId(locationId);
    setHighlightedIds([]);
    onSelectLocation?.(locationId);
  }

  function changeCategoryFilter(callback, ...args) {
    setHighlightedIds([]);
    callback(...args);
  }

  useEffect(() => {
    if (!mapAction?.eventId || lastHandledActionId.current === mapAction.eventId) return;
    lastHandledActionId.current = mapAction.eventId;
    if (mapAction.type === "filter_category" && mapAction.category) {
      selectOnlyCategory(mapAction.category);
      setHighlightedIds([]);
      setLocalSelectedId(null);
      onSelectLocation?.(null);
      return;
    }
    if (["show_location", "show_multiple_locations", "show_route"].includes(mapAction.type)) {
      const ids = (mapAction.location_ids || (mapAction.location_id ? [mapAction.location_id] : []))
        .map(Number);
      const selectedId = mapAction.destination_id ?? ids[0] ?? mapAction.location_id ?? null;
      setHighlightedIds(ids);
      setLocalSelectedId(selectedId);
      onSelectLocation?.(selectedId);
      return;
    }
    if (mapAction.type === "clear_selection") {
      setHighlightedIds([]);
      setLocalSelectedId(null);
      onSelectLocation?.(null);
      return;
    }
  }, [locations, mapAction, onSelectLocation, selectOnlyCategory]);

  useEffect(() => {
    if (activeSelectedId == null) return;
    const selectionIsVisible = visibleLocations.some(
      (location) => Number(location.id) === Number(activeSelectedId),
    );
    const selectionExistsInCurrentResults = locations.some(
      (location) => Number(location.id) === Number(activeSelectedId),
    );
    if (!selectionIsVisible && selectionExistsInCurrentResults) {
      setLocalSelectedId(null);
      onSelectLocation?.(null);
    }
  }, [activeSelectedId, locations, onSelectLocation, visibleLocations]);

  return (
    <div className="map-card">
      <MapContainer
        center={[16.8454, 74.6017]}
        zoom={18}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FitMap locations={locations} route={activeRoute} />
        <FocusSelected locations={locations} selectedLocationId={activeSelectedId} route={activeRoute} />

        {visibleLocations.map((location) => (
          <CategoryMarker
            key={location.id}
            location={location}
            selected={highlightedIds.includes(Number(location.id)) || Number(activeSelectedId) === Number(location.id)}
            openPopup={Number(activeSelectedId) === Number(location.id)}
            onSelect={selectLocation}
          />
        ))}

        {userPosition && (
          <Marker
            position={[userPosition.latitude, userPosition.longitude]}
            icon={currentLocationIcon}
            zIndexOffset={1000}
          >
            <Popup>Your current location</Popup>
          </Marker>
        )}

        {activeRoute.length > 0 && (
          <Polyline
            positions={activeRoute}
            pathOptions={{
              className: "wayfinder-route-line",
              color: "#d92342",
              weight: 6,
              opacity: 0.95,
            }}
          />
        )}
      </MapContainer>
      <CategoryLegend
        locations={locations}
        selectedCategories={selectedCategories}
        onToggleCategory={(category) => changeCategoryFilter(toggleCategory, category)}
        onSelectAll={() => changeCategoryFilter(selectAllCategories)}
        onClearAll={() => changeCategoryFilter(clearAllCategories)}
      />
    </div>
  );
}
