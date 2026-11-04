export function getLocationMapUrl(locationId, action = "focus") {
  const id = String(locationId ?? "").trim();
  if (!id) return "/map";
  const params = new URLSearchParams();
  if (action === "navigate") {
    params.set("destination", id);
    params.set("navigate", "1");
    params.set("request", String(Date.now()) + "-" + Math.random().toString(36).slice(2, 8));
  } else params.set("focus", id);
  return "/map?" + params.toString();
}
