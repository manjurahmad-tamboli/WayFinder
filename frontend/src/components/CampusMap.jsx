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
        scrollWheelZoom
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
              location.latitude,
              location.longitude,
            ]}
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