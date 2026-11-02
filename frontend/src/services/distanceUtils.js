const EARTH_RADIUS_METERS = 6_371_000;

function toFiniteNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function isValidCoordinates(latitude, longitude) {
  const lat = toFiniteNumber(latitude);
  const lon = toFiniteNumber(longitude);
  return lat !== null && lon !== null && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
}

export function haversineDistanceMeters(origin, destination) {
  if (!origin || !destination ||
      !isValidCoordinates(origin.latitude, origin.longitude) ||
      !isValidCoordinates(destination.latitude, destination.longitude)) return null;

  const lat1 = Number(origin.latitude);
  const lon1 = Number(origin.longitude);
  const lat2 = Number(destination.latitude);
  const lon2 = Number(destination.longitude);
  const toRadians = (degrees) => degrees * (Math.PI / 180);
  const phi1 = toRadians(lat1);
  const phi2 = toRadians(lat2);
  const deltaPhi = toRadians(lat2 - lat1);
  const deltaLambda = toRadians(lon2 - lon1);
  const a = Math.sin(deltaPhi / 2) ** 2
    + Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) ** 2;
  const boundedA = Math.min(1, Math.max(0, a));
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(boundedA));
}

export function formatDistance(distanceMeters) {
  if (distanceMeters === null || distanceMeters === undefined || distanceMeters === "") return "";
  const meters = Number(distanceMeters);
  if (!Number.isFinite(meters) || meters < 0) return "";
  if (Math.round(meters) < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(meters < 10000 ? 1 : 0)} km`;
}

export function sortLocationsByDistance(locations, origin) {
  if (!Array.isArray(locations)) return [];
  return locations
    .map((location, index) => ({ location, index, distance: haversineDistanceMeters(origin, location) }))
    .sort((left, right) => {
      if (left.distance === null && right.distance !== null) return 1;
      if (left.distance !== null && right.distance === null) return -1;
      if (left.distance !== null && right.distance !== null && left.distance !== right.distance) {
        return left.distance - right.distance;
      }
      return left.index - right.index;
    })
    .map(({ location }) => location);
}

export function createGpsOrigin(coords) {
  if (!coords || !isValidCoordinates(coords.latitude, coords.longitude)) return null;
  return {
    latitude: Number(coords.latitude),
    longitude: Number(coords.longitude),
    name: "Your current location",
    type: "gps",
  };
}

export function createCampusOrigin(location) {
  if (!location || !isValidCoordinates(location.latitude, location.longitude)) return null;
  return { ...location, latitude: Number(location.latitude), longitude: Number(location.longitude), type: "campus" };
}

export function resolveGpsFailureOrigin(reference) {
  if (!reference || !isValidCoordinates(reference.latitude, reference.longitude)) return null;
  return { ...reference, latitude: Number(reference.latitude), longitude: Number(reference.longitude), type: "reference" };
}

export function requestGpsOrigin(geolocation) {
  return new Promise((resolve, reject) => {
    if (!geolocation || typeof geolocation.getCurrentPosition !== "function") {
      reject(new Error("Browser location is unavailable"));
      return;
    }
    geolocation.getCurrentPosition(
      ({ coords }) => {
        const origin = createGpsOrigin(coords);
        if (origin) resolve(origin);
        else reject(new Error("The browser returned invalid coordinates"));
      },
      reject,
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
    );
  });
}
