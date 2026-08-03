from datetime import datetime
from pydantic import BaseModel, EmailStr, Field


class CategoryOut(BaseModel):
    id: int
    name: str
    model_config = {"from_attributes": True}


class LocationOut(BaseModel):
    id: int
    name: str
    category: str
    latitude: float
    longitude: float
    description: str
    image: str
    opening_hours: str
    model_config = {"from_attributes": True}


class SearchRequest(BaseModel):
    query: str = Field(min_length=1, max_length=100)
    category: str | None = None


class Point(BaseModel):
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)


class RouteRequest(BaseModel):
    source: Point
    destination: Point


class RouteOut(BaseModel):
    route: list[list[float]]
    distance_meters: int
    walking_minutes: int
    directions: list[str]


class ContactCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    message: str = Field(min_length=5, max_length=2000)


class ContactOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    message: str
    created_at: datetime
    model_config = {"from_attributes": True}
