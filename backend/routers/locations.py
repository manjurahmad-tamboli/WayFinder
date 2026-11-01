from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session
from database.database import get_db
from models import Category, Location
from schemas.schemas import CategoryOut, LocationOut, LocationSearchOut, NearbyLocationOut, SearchRequest
from services.location_search import find_nearby_locations, search_campus_locations

router = APIRouter(tags=["Campus locations"])


@router.get("/locations", response_model=list[LocationOut])
def get_locations(category: str | None = Query(default=None), db: Session = Depends(get_db)):
    statement = select(Location).order_by(Location.name)
    if category:
        statement = statement.where(Location.category.ilike(category))
    return db.scalars(statement).all()


@router.get("/locations/autocomplete", response_model=LocationSearchOut)
def autocomplete_locations(
    q: str = Query(min_length=1, max_length=100),
    limit: int = Query(default=8, ge=1, le=20),
    db: Session = Depends(get_db),
):
    locations, categories = search_campus_locations(db, q, limit=limit)
    categories = categories[: min(3, limit)]
    locations = locations[: max(0, limit - len(categories))]
    return {"query": q, "locations": locations, "categories": categories}


@router.get("/locations/search", response_model=LocationSearchOut)
def search_campus(
    q: str = Query(min_length=1, max_length=100),
    category: str | None = Query(default=None, max_length=60),
    limit: int = Query(default=12, ge=1, le=50),
    db: Session = Depends(get_db),
):
    locations, categories = search_campus_locations(db, q, category=category, limit=limit)
    return {"query": q, "locations": locations, "categories": categories}


@router.get("/locations/nearby", response_model=list[NearbyLocationOut])
def get_nearby_locations(
    latitude: float = Query(ge=-90, le=90),
    longitude: float = Query(ge=-180, le=180),
    q: str | None = Query(default=None, max_length=100),
    category: str | None = Query(default=None, max_length=60),
    limit: int = Query(default=10, ge=1, le=25),
    db: Session = Depends(get_db),
):
    nearby = find_nearby_locations(
        db,
        latitude,
        longitude,
        query=q or "",
        category=category,
        limit=limit,
    )
    return [
        {
            "id": location.id,
            "name": location.name,
            "category": location.category,
            "latitude": location.latitude,
            "longitude": location.longitude,
            "description": location.description,
            "image": location.image,
            "opening_hours": location.opening_hours,
            "distance_meters": round(distance),
        }
        for location, distance in nearby
    ]


@router.get("/locations/{location_id}", response_model=LocationOut)
def get_location(location_id: int, db: Session = Depends(get_db)):
    location = db.get(Location, location_id)
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    return location


@router.get("/categories", response_model=list[CategoryOut])
def get_categories(db: Session = Depends(get_db)):
    return db.scalars(select(Category).order_by(Category.name)).all()


@router.post("/search", response_model=list[LocationOut])
def search_locations(payload: SearchRequest, db: Session = Depends(get_db)):
    locations, _ = search_campus_locations(
        db,
        payload.query,
        category=payload.category,
        limit=50,
    )
    return locations
