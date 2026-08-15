import { useEffect } from "react";
import {
  MapContainer,
  Marker,
  Popup,
  Polyline,
  TileLayer,
  useMap,
} from "react-leaflet";
import { Link } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Fix Leaflet marker icons for Vite/React production builds
const defaultMarkerIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = defaultMarkerIcon;

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
}) {
  return (
    <div className="map-card overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm">
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

        {/* Location Markers */}
        {locations.map((location) => (
          <Marker
            key={location.id}
            position={[
              Number(location.latitude),
              Number(location.longitude),
            ]}
            icon={defaultMarkerIcon}
          >
            <Popup>
              <strong>{location.name}</strong>

              <br />

              <span>{location.category}</span>

              <br />

              <Link
                to={`/locations/${location.id}`}
                className="text-blue-700"
              >
                View details
              </Link>
            </Popup>
          </Marker>
        ))}

        {/* Route Line */}
        {route.length > 0 && (
          <Polyline
            positions={route}
            pathOptions={{
              color: "#2563eb",
              weight: 5,
            }}
          />
        )}
      </MapContainer>
    </div>
  );
}