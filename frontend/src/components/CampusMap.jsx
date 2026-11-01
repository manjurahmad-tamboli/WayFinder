import { useEffect, useState } from "react";
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
  locations = EMPTY_LIST,
  route = EMPTY_LIST,
  userPosition = null,
  selectedLocationId,
  onSelectLocation,
}) {
  const [localSelectedId, setLocalSelectedId] = useState(null);
  const activeSelectedId = selectedLocationId !== undefined
    ? selectedLocationId
    : localSelectedId;
  const {
    selectedCategories,
    filteredLocations,
    toggleCategory,
    selectAllCategories,
    clearAllCategories,
  } = useCategoryFilter(locations);

  function selectLocation(locationId) {
    setLocalSelectedId(locationId);
    onSelectLocation?.(locationId);
  }

  useEffect(() => {
    if (activeSelectedId == null) return;
    const selectionIsVisible = filteredLocations.some(
      (location) => Number(location.id) === Number(activeSelectedId),
    );
    if (!selectionIsVisible) {
      setLocalSelectedId(null);
      onSelectLocation?.(null);
    }
  }, [activeSelectedId, filteredLocations, onSelectLocation]);

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
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FitMap locations={locations} route={route} />

        {filteredLocations.map((location) => (
          <CategoryMarker
            key={location.id}
            location={location}
            selected={Number(activeSelectedId) === Number(location.id)}
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

        {route.length > 0 && (
          <Polyline
            positions={route}
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
        onToggleCategory={toggleCategory}
        onSelectAll={selectAllCategories}
        onClearAll={clearAllCategories}
      />
    </div>
  );
}
