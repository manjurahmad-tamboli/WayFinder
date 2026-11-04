"""Safe campus-data tools and lightweight intent handling for WayFinder AI."""

import re
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from models import Category, Location
from routers.routes import create_route
from schemas.schemas import AssistantAction, ChatLocationOut, ChatRequest, ChatResponse, Point, RouteOut, RouteRequest
from services.location_search import category_matches_query, clean_search_query, find_nearby_locations, normalize_text, search_campus_locations
from services.response_provider import classify_intent


INTENT_SUGGESTIONS = {
    "find_location": ["Show campus categories", "Find places near me", "Plan a walking route"],
    "get_directions": ["Find the nearest facilities", "Show all academic buildings"],
    "nearby_search": ["Show all food places", "Find nearby facilities"],
    "category_search": ["Show the campus map", "Find the nearest place"],
    "location_info": ["Show this place on the map", "Plan a route here"],
    "recommendation": ["Show academic buildings", "Find food places"],
    "multi_stop_route": ["Show this route on the map", "Plan another route"],
    "general_question": ["Where is the Computer Department?", "Find nearby places"],
}

# Small entity aliases help English, Hindi and Marathi queries resolve to the
# existing English database names; aliases never create new campus records.
ENTITY_ALIASES = {
    "कैंटीन": "canteen", "कॅन्टीन": "canteen", "वसतिगृह": "hostel",
    "छात्रावास": "hostel", "हॉस्टेल": "hostel", "प्रयोगशाला": "laboratory",
    "प्रयोगशाळा": "laboratory", "मैदान": "sports ground", "प्रवेशद्वार": "gate",
    "ग्रंथालय": "library", "पुस्तकालय": "library", "कार्यालय": "office",
    "कैंपस में": "campus", "जवळ": "near", "जवळचे": "near", "जवळचा": "near",
    "कुठे आहे": "where is", "कुठे": "where", "कहाँ है": "where is", "कहाँ": "where",
    "laboratories": "lab", "laboratory": "lab", "labs": "lab",
}


def _normalize(value: str) -> str:
    return normalize_text(value)


def _translated_query(value: str) -> str:
    translated = value.casefold()
    for source, target in ENTITY_ALIASES.items():
        translated = translated.replace(source, target)
    return translated


def _response_language(message: str) -> str:
    if re.search(r"[\u0900-\u097f]", message):
        # Keep database matching on English names, but let an enabled provider
        # phrase the final answer in Hindi/Marathi. Local replies stay clear.
        if any(token in message for token in ("आहे", "काय", "कुठे", "ळ", "ऱ")):
            return "Marathi"
        return "Hindi"
    return "English"


def _load_locations(db: Session) -> list[Location]:
    return list(db.scalars(select(Location).order_by(Location.name)).all())


def _load_categories(db: Session) -> list[Category]:
    return list(db.scalars(select(Category).order_by(Category.name)).all())


def _search_locations(
    db: Session,
    query: str,
    limit: int = 6,
    known_locations: list[Location] | None = None,
    known_categories: list[Category] | None = None,
) -> list[Location]:
    """Use the same database-backed search as autocomplete and map search."""
    query_text = _translated_query(query)
    clean_query = clean_search_query(query_text)
    if not clean_query:
        return []
    locations, _ = search_campus_locations(
        db,
        clean_query,
        limit=limit,
        known_locations=known_locations,
        known_categories=known_categories,
    )
    return locations


def _locations_named_in_message(message: str, locations: list[Location]) -> list[Location]:
    translated = _normalize(_translated_query(message))
    normalized_message = f" {translated} "
    message_words = set(normalized_message.split())
    found: list[tuple[int, Location]] = []
    generic_name_words = {"main", "department", "block", "building", "college", "campus"}
    for location in locations:
        normalized_name = _normalize(location.name)
        exact_position = normalized_message.find(f" {normalized_name} ")
        if exact_position >= 0:
            found.append((exact_position, location))
            continue
        meaningful_tokens = [
            token for token in normalized_name.split()
            if token not in generic_name_words and (len(token) >= 4 or re.fullmatch(r"[a-z]\d+", token))
        ]
        positions = [normalized_message.find(f" {token} ") for token in meaningful_tokens if token in message_words]
        if positions:
            found.append((min(positions), location))
    found.sort(key=lambda item: (item[0], item[1].name.casefold()))
    return [location for _, location in found]


def _location_position(message: str, location: Location) -> int:
    normalized_message = f" {_normalize(_translated_query(message))} "
    normalized_name = _normalize(location.name)
    exact = normalized_message.find(f" {normalized_name} ")
    if exact >= 0:
        return exact
    common = {"main", "department", "block", "building", "college", "campus"}
    positions = [
        normalized_message.find(f" {token} ")
        for token in normalized_name.split()
        if token not in common and (len(token) >= 4 or re.fullmatch(r"[a-z]\d+", token))
    ]
    return min((position for position in positions if position >= 0), default=-1)


def _route_endpoints(message: str, named: list[Location]) -> tuple[Location | None, Location | None, list[Location]]:
    normalized = _normalize(_translated_query(message))
    from_match = re.search(r"\bfrom\b", normalized)
    to_match = re.search(r"\bto\b", normalized)
    if from_match and to_match:
        positions = [( _location_position(message, item), item) for item in named]
        positions = [(position, item) for position, item in positions if position >= 0]
        if from_match.start() < to_match.start():
            source_candidates = [item for position, item in positions if from_match.end() <= position < to_match.start()]
            destination_candidates = [item for position, item in positions if position > to_match.end()]
        else:
            destination_candidates = [item for position, item in positions if to_match.end() <= position < from_match.start()]
            source_candidates = [item for position, item in positions if position > from_match.end()]
        if len(source_candidates) == 1 and len(destination_candidates) == 1:
            return source_candidates[0], destination_candidates[0], []
        candidates = list(dict.fromkeys(source_candidates + destination_candidates))
        if candidates:
            return None, None, candidates

    exact = [item for item in named if f" {_normalize(item.name)} " in f" {normalized} "]
    if len(exact) >= 2:
        return exact[0], exact[-1], []
    if len(exact) == 1:
        return None, exact[0], []
    if len(named) == 1:
        return None, named[0], []
    if len(named) > 1:
        return None, None, named
    return None, None, []


def _category_in_message(message: str, categories: list[Category]) -> Category | None:
    for category in categories:
        if category_matches_query(_translated_query(message), category.name):
            return category
    return None


def _classify(message: str, categories: list[Category], locations: list[Location]) -> tuple[str, Category | None]:
    normalized = _normalize(_translated_query(message))
    category = _category_in_message(message, categories)
    named_count = len(_locations_named_in_message(message, locations))

    if any(phrase in normalized for phrase in ("visit", "stop at", "go to all", "tour")) and named_count >= 2:
        return "multi_stop_route", category
    if any(phrase in normalized for phrase in (
        "how do i get to", "how can i reach", "directions to", "route to",
        "navigate to", "take me to", "path to", "get me to", "walk to", "reach", "go to",
    )) or re.search(r"\b(from|route|directions|navigate)\b.+\b(to|toward|towards)\b", normalized):
        return "get_directions", category
    if any(phrase in normalized for phrase in ("near me", "nearby", "closest", "nearest", "around me", "near my location", "near it", "near there", "near that")):
        return "nearby_search", category
    if any(word in normalized.split() for word in ("category", "categories", "types")) or "what can i find" in normalized:
        return "recommendation", None
    if any(word in normalized.split() for word in ("lab", "laboratories")) and any(word in normalized.split() for word in ("show", "find", "list", "all")):
        return "category_search", None
    if category and any(word in normalized.split() for word in ("show", "find", "list", "browse", "places", "buildings", "all")):
        return "category_search", category
    if any(phrase in normalized for phrase in (
        "opening hours", "open at", "what time", "hours", "tell me about", "what is in",
        "what does", "facilities in", "details for", "hours for", "hours of",
    )):
        return "location_info", category
    if any(phrase in normalized for phrase in ("recommend", "what should i visit", "popular", "good place")):
        return "recommendation", category
    if any(phrase in normalized for phrase in ("where is", "where can i find", "show me", "find", "locate")):
        return "find_location", category
    if re.fullmatch(r"(hi|hello|hey|good morning|good afternoon|good evening|thanks|thank you)[.! ]*", normalized):
        return "general_question", None
    return "general_question", category


def _names(locations: list[Location], limit: int = 5) -> str:
    return ", ".join(location.name for location in locations[:limit])


def _conversation_context(request: ChatRequest, locations: list[Location]) -> list[Location]:
    """Resolve references from prior user turns only, never from AI assertions."""
    user_turns = [item.content for item in request.conversation_history if item.role == "user"][-8:]
    prior = []
    for turn in user_turns:
        prior.extend(_locations_named_in_message(turn, locations))
    unique = {item.id: item for item in prior}
    return list(unique.values())


def _resolve_user_start(request: ChatRequest, db: Session) -> tuple[Point | None, Location | None, str]:
    if request.user_location_id:
        location = db.get(Location, request.user_location_id)
        if location:
            return Point(latitude=location.latitude, longitude=location.longitude), location, location.name
        return None, None, ""
    if request.user_location:
        return request.user_location, None, request.user_location_name or "Your current location"
    return None, None, ""


def _chat_location(location: Location, distance_meters: float) -> ChatLocationOut:
    return ChatLocationOut(
        id=location.id,
        name=location.name,
        category=location.category,
        latitude=location.latitude,
        longitude=location.longitude,
        description=location.description,
        image=location.image,
        opening_hours=location.opening_hours,
        distance_meters=round(distance_meters),
    )


def _plan_segment(source_point: Point, destination: Location, source_name: str):
    return create_route(
        RouteRequest(
            source=source_point,
            destination=Point(latitude=destination.latitude, longitude=destination.longitude),
            source_name=source_name,
            destination_name=destination.name,
        )
    )


def _build_multi_stop_route(
    request: ChatRequest,
    db: Session,
    stops: list[Location],
) -> ChatResponse:
    start_point, start_location, start_name = _resolve_user_start(request, db)
    if len(stops) < 2:
        return ChatResponse(intent="multi_stop_route", answer="Name at least two campus places for a multi-stop route.")
    if start_point is None:
        start_location, *stops = stops
        start_point = Point(latitude=start_location.latitude, longitude=start_location.longitude)
        start_name = start_location.name
    ordered_stops = stops
    route_points: list[list[float]] = []
    directions: list[str] = []
    distance = 0
    try:
        for destination in ordered_stops:
            segment = _plan_segment(start_point, destination, start_name or "Your current location")
            for point in segment.route:
                if not route_points or route_points[-1] != point:
                    route_points.append(point)
            distance += segment.distance_meters
            directions.extend(segment.directions)
            start_point = Point(latitude=destination.latitude, longitude=destination.longitude)
            start_name = destination.name
    except HTTPException as error:
        return ChatResponse(intent="multi_stop_route", answer=str(error.detail), locations=ordered_stops)

    if not route_points:
        return ChatResponse(intent="multi_stop_route", answer="I couldn’t build a connected walking route for those stops.", locations=ordered_stops)
    walking_minutes = max(1, (distance + 79) // 80)
    route = RouteOut(
        route=route_points,
        distance_meters=distance,
        walking_minutes=walking_minutes,
        directions=directions,
        algorithm="Dijkstra",
        network_note="Each route leg uses the existing campus walkway graph. The sample graph is provisional; confirm it with campus signs.",
    )
    ids = [location.id for location in ordered_stops]
    return ChatResponse(
        intent="multi_stop_route",
        answer=f"I planned a {len(ordered_stops)}-stop walk covering about {distance} m ({walking_minutes} min).",
        locations=ordered_stops,
        route=route,
        map_action=AssistantAction(type="show_route", location_ids=([start_location.id] if start_location else []) + ids, source_id=start_location.id if start_location else None, destination_id=ordered_stops[-1].id, source_is_current=start_location is None),
    )


def _response_for_route(
    request: ChatRequest,
    db: Session,
    named_locations: list[Location],
    message: str,
    provider_ordered: bool = False,
) -> ChatResponse:
    if provider_ordered and len(named_locations) >= 2:
        source, destination, ambiguous = named_locations[0], named_locations[-1], []
    else:
        source, destination, ambiguous = _route_endpoints(message, named_locations)
    if ambiguous:
        return ChatResponse(
            intent="get_directions",
            answer=f"That name could refer to more than one place: {_names(ambiguous)}. Which one did you mean?",
            locations=ambiguous,
        )
    if destination is None:
        return ChatResponse(
            intent="get_directions",
            answer="Name your destination, for example, “How do I get to D1 Block?” or “Main Gate to Cyber Hostel.”",
        )

    source_point: Point | None = None
    source_name = "Your current location"
    if source is not None:
        source_point = Point(latitude=source.latitude, longitude=source.longitude)
        source_name = source.name
    else:
        source_point, source, source_name = _resolve_user_start(request, db)
        if source_point is None:
            return ChatResponse(
                intent="get_directions",
                answer=f"I found {destination.name}. Use your current location or choose a campus place as the start.",
                locations=[destination],
                map_action=AssistantAction(type="request_location", location_id=destination.id),
            )

    try:
        route = _plan_segment(source_point, destination, source_name or "Your current location")
    except HTTPException as error:
        return ChatResponse(intent="get_directions", answer=str(error.detail), locations=[item for item in (source, destination) if item])
    return ChatResponse(
        intent="get_directions",
        answer=f"The shortest mapped walk to {destination.name} is about {route.distance_meters} m ({route.walking_minutes} min). Step-by-step directions are ready.",
        locations=[item for item in (source, destination) if item],
        route=route,
        map_action=AssistantAction(
            type="show_route",
            location_ids=[item.id for item in (source, destination) if item],
            source_id=source.id if source else None,
            destination_id=destination.id,
            source_is_current=source is None,
        ),
    )


def _nearby_locations(
    db: Session,
    point: Point,
    category: str | None,
    message: str,
    known_locations: list[Location] | None = None,
    known_categories: list[Category] | None = None,
) -> list[tuple[Location, float]]:
    query = clean_search_query(_translated_query(message))
    return find_nearby_locations(
        db,
        point.latitude,
        point.longitude,
        query=query,
        category=category,
        limit=5,
        known_locations=known_locations,
        known_categories=known_categories,
    )


def _localize_for_language(answer: str, language: str) -> str:
    if language == "Hindi":
        return "मुझे इस सवाल से मेल खाने वाला कैंपस स्थान नहीं मिला। कृपया कोई भवन या स्थान का नाम बताएं।" if "couldn’t find" in answer else answer
    if language == "Marathi":
        return "या प्रश्नाशी जुळणारे कॅम्पस ठिकाण सापडले नाही. कृपया इमारत किंवा ठिकाणाचे नाव सांगा." if "couldn’t find" in answer else answer
    return answer


def build_chat_response(request: ChatRequest, db: Session) -> ChatResponse:
    """Run one assistant turn using bounded campus tools and validated history."""
    message = request.message.strip()
    language = _response_language(message)
    categories = _load_categories(db)
    locations = _load_locations(db)
    intent, category = _classify(message, categories, locations)
    context = _conversation_context(request, locations)
    candidate_locations = _locations_named_in_message(message, locations)
    candidate_locations.extend(_search_locations(db, message, limit=8, known_locations=locations, known_categories=categories))
    candidate_locations.extend(context)
    candidates_by_id = {item.id: item for item in candidate_locations}
    candidate_names = [item.name for item in list(candidates_by_id.values())[:10]]
    provider_hint = classify_intent(request, candidate_names, [item.name for item in categories])
    provider_named = []
    if provider_hint:
        locations_by_name = {item.name.casefold(): item for item in locations}
        provider_named = [
            locations_by_name[name.casefold()]
            for name in provider_hint.location_names
            if name.casefold() in locations_by_name and name.casefold() in {candidate.casefold() for candidate in candidate_names}
        ]
        intent = provider_hint.intent
        hinted_category = next(
            (item for item in categories if provider_hint.category and item.name.casefold() == provider_hint.category.casefold()),
            None,
        )
        category = hinted_category or category
    normalized = _normalize(_translated_query(message))
    if any(phrase in normalized for phrase in ("clear selection", "clear map selection", "unhighlight", "reset highlights")):
        return ChatResponse(
            intent="general_question",
            answer="Cleared the assistant’s map highlights. Your category filters are unchanged.",
            map_action=AssistantAction(type="clear_selection"),
            suggestions=INTENT_SUGGESTIONS["general_question"],
            conversation_id=request.conversation_id or ChatResponse.model_fields["conversation_id"].default_factory(),
        )
    if context and re.search(r"\b(show|map|locate)\b.+\b(it|there|that)\b", normalized):
        intent = "find_location"

    if intent == "general_question" and re.fullmatch(r"(hi|hello|hey|good morning|good afternoon|good evening|thanks|thank you)[.! ]*", normalized):
        return ChatResponse(
            intent=intent,
            answer="Hello! I’m your WayFinder campus assistant. I can find places, check available details, search nearby, or plan walking directions.",
            suggestions=INTENT_SUGGESTIONS["general_question"],
            conversation_id=request.conversation_id or ChatResponse.model_fields["conversation_id"].default_factory(),
        )

    if intent == "recommendation":
        recommended = locations[:5]
        return ChatResponse(
            intent=intent,
            answer=f"Here are a few places currently listed on the campus map: {_names(recommended)}.",
            locations=recommended,
            map_action=AssistantAction(type="show_multiple_locations", location_ids=[item.id for item in recommended]),
            suggestions=INTENT_SUGGESTIONS[intent],
            conversation_id=request.conversation_id or ChatResponse.model_fields["conversation_id"].default_factory(),
        )

    if intent == "multi_stop_route":
        named = provider_named or _locations_named_in_message(message, locations)
        if len(named) >= 2:
            response = _build_multi_stop_route(request, db, named)
            response.suggestions = INTENT_SUGGESTIONS[intent]
            response.conversation_id = request.conversation_id or response.conversation_id
            return response

    if intent == "get_directions":
        named = provider_named or _locations_named_in_message(message, locations)
        # Follow-up pronouns may refer to the last location named by the user.
        if not named and context and any(term in normalized.split() for term in ("there", "it", "that")):
            named = [context[-1]]
        if not named:
            ranked = _search_locations(db, message, limit=3, known_locations=locations, known_categories=categories)
            if len(ranked) == 1:
                named = ranked
        response = _response_for_route(
            request,
            db,
            named,
            message,
            provider_ordered=bool(provider_hint and len(provider_named) >= 2),
        )
        response.suggestions = INTENT_SUGGESTIONS[intent]
        response.conversation_id = request.conversation_id or response.conversation_id
        return response

    if intent == "nearby_search":
        point, manual_location, location_label = _resolve_user_start(request, db)
        referenced = bool(re.search(r"\b(it|there|that|near it|near there)\b", normalized))
        if point is None and referenced and context:
            manual_location = context[-1]
            point = Point(latitude=manual_location.latitude, longitude=manual_location.longitude)
            location_label = manual_location.name
        if point is None:
            category_hint = f" in {category.name}" if category else ""
            return ChatResponse(
                intent=intent,
                answer=f"I can find the closest campus places{category_hint}. Choose “Use my location” or select a campus place below; I won’t guess your position.",
                map_action=AssistantAction(type="request_location", category=category.name if category else None),
                suggestions=INTENT_SUGGESTIONS[intent],
                conversation_id=request.conversation_id or ChatResponse.model_fields["conversation_id"].default_factory(),
            )
        nearby = _nearby_locations(db, point, category.name if category else None, message, known_locations=locations, known_categories=categories)
        found = [item for item, _ in nearby]
        if not found:
            answer = "There are no matching campus locations in that category yet."
        else:
            distance_labels = ", ".join(
                f"{item.name} ({distance:.0f} m)" if distance < 1000 else f"{item.name} ({distance / 1000:.1f} km)"
                for item, distance in nearby
            )
            answer = f"Closest places from {location_label or 'your shared location'}: {distance_labels}."
        return ChatResponse(
            intent=intent,
            answer=answer,
            locations=[_chat_location(item, distance) for item, distance in nearby],
            map_action=AssistantAction(type="show_multiple_locations", location_ids=[item.id for item in found]) if found else None,
            suggestions=INTENT_SUGGESTIONS[intent],
            conversation_id=request.conversation_id or ChatResponse.model_fields["conversation_id"].default_factory(),
        )

    if intent == "category_search" and category:
        found = [item for item in locations if _normalize(item.category) == _normalize(category.name)]
        return ChatResponse(
            intent=intent,
            answer=f"I found {len(found)} {category.name.lower()} place(s): {_names(found)}." if found else f"There are no {category.name} locations listed yet.",
            locations=found[:8],
            map_action=AssistantAction(type="filter_category", category=category.name) if found else None,
            suggestions=INTENT_SUGGESTIONS[intent],
            conversation_id=request.conversation_id or ChatResponse.model_fields["conversation_id"].default_factory(),
        )

    named = provider_named or _locations_named_in_message(message, locations)
    if intent == "location_info" and not named and context and re.search(r"\b(it|there|that)\b", normalized):
        named = [context[-1]]
    if not named and intent == "find_location" and context and re.search(r"\b(it|there|that)\b", normalized):
        named = [context[-1]]
    if named:
        found = named[:5]
    else:
        query = _translated_query(message)
        if category:
            query = re.sub(re.escape(category.name), "", query, flags=re.IGNORECASE).strip()
        found = _search_locations(db, query, limit=6, known_locations=locations, known_categories=categories)
        if category:
            found = [item for item in found if _normalize(item.category) == _normalize(category.name)]

    if found and intent == "location_info" and len(found) == 1:
        place = found[0]
        answer = f"{place.name} is listed as {place.category}. {place.description} Opening hours: {place.opening_hours}."
        return ChatResponse(
            intent=intent,
            answer=_localize_for_language(answer, language),
            locations=found,
            map_action=AssistantAction(type="show_location", location_id=place.id, location_ids=[place.id]),
            suggestions=INTENT_SUGGESTIONS[intent],
            conversation_id=request.conversation_id or ChatResponse.model_fields["conversation_id"].default_factory(),
        )
    if found:
        answer = f"I found {len(found)} matching place(s): {_names(found)}."
        return ChatResponse(
            intent="find_location" if intent == "find_location" else intent,
            answer=answer,
            locations=found,
            map_action=(
                AssistantAction(type="show_location", location_id=found[0].id, location_ids=[found[0].id])
                if len(found) == 1
                else AssistantAction(type="show_multiple_locations", location_ids=[item.id for item in found])
            ),
            suggestions=INTENT_SUGGESTIONS["find_location"],
            conversation_id=request.conversation_id or ChatResponse.model_fields["conversation_id"].default_factory(),
        )

    answer = _localize_for_language(
        "I couldn’t find a matching campus place. Try a building name or ask me to browse a category.",
        language,
    )
    return ChatResponse(
        intent="general_question",
        answer=answer,
        suggestions=INTENT_SUGGESTIONS["general_question"],
        conversation_id=request.conversation_id or ChatResponse.model_fields["conversation_id"].default_factory(),
    )
