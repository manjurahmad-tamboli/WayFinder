import math
from fastapi import APIRouter
from schemas.schemas import RouteOut, RouteRequest

router = APIRouter(tags=["Navigation"])


def haversine_meters(a_lat: float, a_lon: float, b_lat: float, b_lon: float) -> float:
    radius = 6_371_000
    phi1, phi2 = math.radians(a_lat), math.radians(b_lat)
    d_phi, d_lambda = math.radians(b_lat - a_lat), math.radians(b_lon - a_lon)
    value = math.sin(d_phi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2
    return 2 * radius * math.asin(math.sqrt(value))


@router.post("/route", response_model=RouteOut)
def create_route(payload: RouteRequest):
    source, destination = payload.source, payload.destination
    distance = max(1, round(haversine_meters(source.latitude, source.longitude, destination.latitude, destination.longitude)))
    midpoint = [(source.latitude + destination.latitude) / 2, (source.longitude + destination.longitude) / 2]
    return RouteOut(
        route=[[source.latitude, source.longitude], midpoint, [destination.latitude, destination.longitude]],
        distance_meters=distance,
        walking_minutes=max(1, math.ceil(distance / 80)),
        directions=[
            "Start from your selected location.",
            "Walk straight along the main campus path.",
            "Follow the highlighted route and look for campus signs.",
            "Your destination is at the end of the route.",
        ],
    )
