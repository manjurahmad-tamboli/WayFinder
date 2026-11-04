from datetime import datetime
import math
from typing import Literal
from uuid import uuid4

from pydantic import BaseModel, EmailStr, Field, field_serializer


class CategoryOut(BaseModel):
    id: int
    name: str
    model_config = {"from_attributes": True}


class LocationOut(BaseModel):
    id: int
    name: str
    category: str
    latitude: float | None
    longitude: float | None
    description: str
    image: str
    opening_hours: str
    model_config = {"from_attributes": True}

    @field_serializer("latitude")
    def sanitize_latitude(self, value: float | None):
        if value is None or not math.isfinite(value) or not -90 <= value <= 90:
            return None
        return value

    @field_serializer("longitude")
    def sanitize_longitude(self, value: float | None):
        if value is None or not math.isfinite(value) or not -180 <= value <= 180:
            return None
        return value


class CategoryMatchOut(CategoryOut):
    location_count: int = Field(ge=0)


class LocationSearchOut(BaseModel):
    query: str
    locations: list[LocationOut] = Field(default_factory=list)
    categories: list[CategoryMatchOut] = Field(default_factory=list)


class NearbyLocationOut(LocationOut):
    distance_meters: int | None = Field(default=None, ge=0)


class SearchRequest(BaseModel):
    query: str = Field(min_length=1, max_length=100)
    category: str | None = None


class Point(BaseModel):
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)


class RouteRequest(BaseModel):
    source: Point
    destination: Point
    source_name: str | None = Field(default=None, max_length=120)
    destination_name: str | None = Field(default=None, max_length=120)


class RouteOut(BaseModel):
    route: list[list[float]]
    distance_meters: int
    walking_minutes: int
    directions: list[str]
    algorithm: str
    network_note: str


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


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=2000)


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=1000)
    conversation_id: str | None = Field(default=None, min_length=1, max_length=100)
    conversation_history: list[ChatMessage] = Field(default_factory=list, max_length=12)
    user_location: Point | None = None
    user_location_id: int | None = Field(default=None, ge=1)
    user_location_name: str | None = Field(default=None, max_length=120)


class ChatLocationOut(LocationOut):
    distance_meters: int | None = Field(default=None, ge=0)


class AssistantAction(BaseModel):
    type: Literal[
        "show_location",
        "filter_category",
        "show_multiple_locations",
        "show_route",
        "clear_selection",
        "request_location",
    ]
    location_id: int | None = None
    location_ids: list[int] = Field(default_factory=list)
    source_id: int | None = None
    destination_id: int | None = None
    source_is_current: bool = False
    category: str | None = None


class AIIntentHint(BaseModel):
    """Constrained provider output; values are checked against server data."""
    intent: Literal[
        "find_location",
        "get_directions",
        "nearby_search",
        "category_search",
        "location_info",
        "recommendation",
        "multi_stop_route",
        "general_question",
    ]
    location_names: list[str] = Field(default_factory=list, max_length=5)
    category: str | None = Field(default=None, max_length=60)


class ChatResponse(BaseModel):
    answer: str
    intent: str
    locations: list[ChatLocationOut] = Field(default_factory=list)
    categories: list[CategoryOut] = Field(default_factory=list)
    map_action: AssistantAction | None = None
    route: RouteOut | None = None
    suggestions: list[str] = Field(default_factory=list)
    conversation_id: str = Field(default_factory=lambda: str(uuid4()))
