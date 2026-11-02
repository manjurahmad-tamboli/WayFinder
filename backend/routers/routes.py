import math

from fastapi import APIRouter, HTTPException

from navigation import campus_route
from schemas.schemas import RouteOut, RouteRequest

router = APIRouter(tags=["Navigation"])

@router.post("/route", response_model=RouteOut)
def create_route(payload: RouteRequest):
    """Return the shortest route through the campus walking-path graph."""
    try:
        route, distance, directions = campus_route(
            (payload.source.latitude, payload.source.longitude),
            (payload.destination.latitude, payload.destination.longitude),
            payload.destination_name,
        )
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error

    return RouteOut(
        route=route,
        distance_meters=distance,
        walking_minutes=max(1, math.ceil(distance / 80)),
        directions=directions,
    )
