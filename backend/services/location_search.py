"""Shared, database-backed location search and nearby discovery for WayFinder.

Search always returns real campus records. The small alias groups below map
common words to equivalent search vocabulary; they never create locations.
"""

import re
import unicodedata
from collections import Counter

from sqlalchemy import select
from sqlalchemy.orm import Session

from models import Category, Location
from routers.routes import haversine_meters


SEARCH_ALIAS_GROUPS = (
    ("canteen", "cafeteria", "cafe", "mess", "dining"),
    ("hostel", "hostels", "dorm", "dormitory", "residence", "accommodation"),
    ("laboratory", "laboratories", "lab", "labs"),
    ("office", "offices", "administration", "administrative", "admin"),
    ("sports", "athletics", "sports ground", "sports facilities", "sport facility", "field", "gym", "track"),
    ("facilities", "facility", "amenities", "amenity"),
    ("landmark", "monument", "statue", "attraction"),
    ("academic", "academics", "education"),
    ("parking", "parking area", "vehicle parking"),
    ("computer", "computing", "computer lab", "computer department", "computer center"),
)

CATEGORY_ALIASES = {
    "academic": ("academics", "education"),
    "facilities": ("facility", "amenity", "amenities"),
    "food": ("dining", "canteen", "cafeteria", "cafe", "mess"),
    "hostel": ("hostels", "dorm", "dormitory", "residence", "accommodation"),
    "landmark": ("monument", "statue", "attraction"),
    "sports": ("athletics", "field", "gym", "track", "sports ground", "sports facilities", "sport facility"),
}

SEARCH_FILLER_WORDS = {
    "a", "an", "the", "please", "where", "is", "are", "could", "you",
    "i", "me", "my", "find", "show", "locate", "tell", "about", "get", "take",
    "to", "how", "do", "does", "reach", "route", "directions", "walk", "go",
    "what", "near", "nearby", "nearest", "closest", "want", "visit", "from", "at",
    "all", "places", "place", "buildings", "building", "campus", "around", "for",
}


def normalize_text(value: str) -> str:
    plain = unicodedata.normalize("NFKD", value.casefold())
    plain = "".join(char for char in plain if not unicodedata.combining(char))
    return re.sub(r"[^a-z0-9]+", " ", plain).strip()


def clean_search_query(query: str) -> str:
    """Trim conversational filler while keeping useful user search terms."""
    normalized = normalize_text(query)
    # Keep the one-letter-prefix example "can", but remove conversational
    # "can you ..." when it is clearly sentence framing.
    normalized = re.sub(r"\bcan you\b", " ", normalized)
    terms = [word for word in normalized.split() if word not in SEARCH_FILLER_WORDS]
    return " ".join(terms)


def _query_variants(query: str) -> list[str]:
    """Return the original query plus relevant aliases, not unrelated records."""
    normalized = clean_search_query(query)
    if not normalized:
        return []
    matching_groups = []
    first_word = normalized.split()[0]
    for group in SEARCH_ALIAS_GROUPS:
        normalized_aliases = [normalize_text(alias) for alias in group]
        relevant = any(
            len(normalized) >= 2 and (
                alias.startswith(normalized)
                or (len(first_word) >= 2 and (alias.startswith(first_word) or first_word.startswith(alias)))
            )
            for alias in normalized_aliases
        )
        if relevant:
            matching_groups.append(normalized_aliases)
    variants = {alias for group in matching_groups for alias in group} if matching_groups else {normalized}
    return sorted(variants, key=lambda item: (len(item.split()), len(item), item))


def _score_normalized(query: str, searchable: str) -> int:
    if not query or not searchable:
        return 0
    if query == searchable:
        return 120
    if searchable.startswith(query):
        return 105
    terms = [term for term in query.split() if len(term) >= 2]
    record_words = searchable.split()
    matched = sum(any(word.startswith(term) for word in record_words) for term in terms)
    if not terms or matched != len(terms):
        return 0
    return 62 + round(26 * matched / len(terms))


def _score_text(query: str, searchable: str) -> int:
    normalized_searchable = normalize_text(searchable)
    return max(
        (_score_normalized(variant, normalized_searchable) for variant in _query_variants(query)),
        default=0,
    )


def _category_score(query: str, category_name: str) -> int:
    normalized_query = clean_search_query(query)
    if not normalized_query:
        return 0
    aliases = CATEGORY_ALIASES.get(normalize_text(category_name), ())
    scores = [_score_normalized(normalized_query, normalize_text(category_name))]
    query_is_single_word = len(normalized_query.split()) == 1
    for alias in aliases:
        normalized_alias = normalize_text(alias)
        alias_is_single_word = len(normalized_alias.split()) == 1
        if query_is_single_word and not alias_is_single_word and not normalized_alias.startswith(normalized_query):
            continue
        scores.append(_score_normalized(normalized_query, normalized_alias))
    return max(scores, default=0)


def category_matches_query(query: str, category_name: str) -> bool:
    """Shared category matching for the web search and AI assistant."""
    return bool(clean_search_query(query)) and _category_score(query, category_name) > 0


def search_campus_locations(
    db: Session,
    query: str,
    category: str | None = None,
    limit: int = 12,
    known_locations: list[Location] | None = None,
    known_categories: list[Category] | None = None,
) -> tuple[list[Location], list[dict[str, int | str]]]:
    """Load campus data in two queries and return ranked locations/categories."""
    if not clean_search_query(query):
        return [], []

    locations = list(known_locations) if known_locations is not None else list(db.scalars(select(Location).order_by(Location.name)).all())
    categories = list(known_categories) if known_categories is not None else list(db.scalars(select(Category).order_by(Category.name)).all())
    category_counts = Counter(normalize_text(location.category) for location in locations)

    matching_categories = []
    for item in categories:
        score = _category_score(query, item.name)
        if score:
            matching_categories.append((score, item.name.casefold(), {
                "id": item.id,
                "name": item.name,
                "location_count": category_counts[normalize_text(item.name)],
            }))
    matching_categories.sort(key=lambda entry: (-entry[0], entry[1]))
    category_results = [entry[2] for entry in matching_categories[:5]]
    matched_category_keys = {normalize_text(item["name"]) for item in category_results}
    category_only_keys = set()
    if len(clean_search_query(query).split()) == 1:
        category_only_keys = {
            normalize_text(item.name)
            for item in categories
            if _category_score(query, item.name) >= 70
        }

    wanted_category = normalize_text(category or "")
    ranked_locations = []
    for location in locations:
        if wanted_category and normalize_text(location.category) != wanted_category:
            continue

        # A category query deliberately returns all records in that category.
        category_key = normalize_text(location.category)
        if category_only_keys and category_key not in category_only_keys:
            continue
        category_score = _category_score(query, location.category)
        if category_key in matched_category_keys and category_score >= 70:
            score = category_score
        else:
            name_score = _score_text(query, location.name)
            description_score = _score_text(query, location.description)
            category_field_score = _score_text(query, location.category)
            score = max(
                name_score + 35 if name_score else 0,
                description_score + 15 if description_score else 0,
                category_field_score + 20 if category_field_score else 0,
            )

        if score:
            ranked_locations.append((score, location.name.casefold(), location))

    ranked_locations.sort(key=lambda entry: (-entry[0], entry[1]))
    return [entry[2] for entry in ranked_locations[:limit]], category_results


def find_nearby_locations(
    db: Session,
    latitude: float,
    longitude: float,
    query: str = "",
    category: str | None = None,
    limit: int = 10,
    known_locations: list[Location] | None = None,
    known_categories: list[Category] | None = None,
) -> list[tuple[Location, float]]:
    """Sort real matching records by great-circle distance from the origin."""
    if clean_search_query(query):
        locations, _ = search_campus_locations(
            db,
            query,
            category=category,
            limit=100,
            known_locations=known_locations,
            known_categories=known_categories,
        )
    else:
        locations = list(known_locations) if known_locations is not None else list(db.scalars(select(Location).order_by(Location.name)).all())
        wanted_category = normalize_text(category or "")
        if wanted_category:
            locations = [item for item in locations if normalize_text(item.category) == wanted_category]

    measured = [
        (location, haversine_meters(latitude, longitude, location.latitude, location.longitude))
        for location in locations
    ]
    measured.sort(key=lambda entry: (entry[1], entry[0].name.casefold()))
    return measured[:limit]
