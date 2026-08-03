from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session
from database.database import get_db
from models import Category, Location
from schemas.schemas import CategoryOut, LocationOut, SearchRequest

router = APIRouter(tags=["Campus locations"])


@router.get("/locations", response_model=list[LocationOut])
def get_locations(category: str | None = Query(default=None), db: Session = Depends(get_db)):
    statement = select(Location).order_by(Location.name)
    if category:
        statement = statement.where(Location.category.ilike(category))
    return db.scalars(statement).all()


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
    term = f"%{payload.query.strip()}%"
    statement = select(Location).where(Location.name.ilike(term) | Location.description.ilike(term))
    if payload.category:
        statement = statement.where(Location.category.ilike(payload.category))
    return db.scalars(statement.order_by(Location.name)).all()
