"""Campus pedestrian routing over a typed, status-aware walkway graph."""

import heapq
import math
from dataclasses import dataclass
from typing import Literal

from fastapi import APIRouter, HTTPException

from schemas.schemas import RouteOut, RouteRequest

router = APIRouter(tags=["Navigation"])

WALKING_METERS_PER_MINUTE = 80
MAX_ACCESS_DISTANCE_METERS = 150

# Each graph node is a known campus landmark. Edges describe the sample
# pedestrian connections between landmarks; Dijkstra chooses among these
# connections instead of drawing a direct source-to-destination segment.
CAMPUS_NODES: dict[str, tuple[str, float, float]] = {
    "main_gate": ("Main Gate", 16.845935, 74.602656),
    "parking": ("Parking", 16.845892, 74.601999),
    "engineering_statue": ("Engineering Statue", 16.845815, 74.601301),
    "it_hut": ("IT Hut", 16.845548, 74.601036),
    "main_ccf": ("Main CCF", 16.845974, 74.600427),
    "electrical": ("Department of Electrical Engineering", 16.845055, 74.601484),
    "faculty_rooms": ("Faculty Rooms", 16.844847, 74.600666),
    "open_theatre": ("Open Theatre", 16.844575, 74.600607),
    "class_room_8": ("Class Room 8", 16.844115, 74.601261),
    "gymkhana": ("Gymkhana", 16.843695, 74.601527),
    "government_canteen": ("Government Canteen", 16.843346, 74.601883),
    "running_track": ("Running Track", 16.842761, 74.600907),
    "exam_center": ("Exam Center", 16.843905, 74.602320),
    "d1_block": ("D1 Block", 16.845186, 74.603356),
    "d2_block": ("D2 Block", 16.844695, 74.603254),
    "cyber_hostel": ("Cyber Hostel", 16.845342, 74.602194),
    "walchand_hostel": ("Walchand Hostel", 16.844085, 74.603557),
    "girls_hostel_mess": ("Girls Hostel Mess", 16.845021, 74.604198),
}

WALKWAY_EDGES = (
    ("main_gate", "parking"),
    ("parking", "engineering_statue"),
    ("engineering_statue", "it_hut"),
    ("it_hut", "main_ccf"),
    ("it_hut", "electrical"),
    ("main_ccf", "faculty_rooms"),
    ("faculty_rooms", "open_theatre"),
    ("open_theatre", "running_track"),
    ("electrical", "class_room_8"),
    ("class_room_8", "government_canteen"),
    ("government_canteen", "gymkhana"),
    ("gymkhana", "running_track"),
    ("parking", "cyber_hostel"),
    ("cyber_hostel", "d1_block"),
    ("d1_block", "d2_block"),
    ("d1_block", "girls_hostel_mess"),
    ("girls_hostel_mess", "walchand_hostel"),
    ("d2_block", "walchand_hostel"),
    ("d2_block", "exam_center"),
    ("exam_center", "class_room_8"),
    ("exam_center", "gymkhana"),
)


@dataclass(frozen=True)
class EdgePolicy:
    """Access state for a walkway segment; unlisted segments default to public/open."""

    status: Literal["open", "closed", "restricted"] = "open"
    access: Literal["public", "staff", "residents"] = "public"
    note: str | None = None


# Junctions are graph branching points, not guesses about building doors.
# The seed locations still act as provisional access anchors until surveyed.
WALKWAY_NODE_ROLES = {
    "main_gate": "entrance",
    "parking": "junction",
    "it_hut": "junction",
    "gymkhana": "junction",
    "exam_center": "junction",
    "d1_block": "junction",
}

# Add a verified polyline here as (start_node, end_node): ((lat, lon), ...).
# Until then each sample link uses its endpoint coordinates and is provisional.
WALKWAY_EDGE_GEOMETRY: dict[tuple[str, str], tuple[tuple[float, float], ...]] = {}

# Only put closures/restrictions here after confirming them with campus staff.
# The router automatically omits closed, non-public, or restricted edges.
WALKWAY_EDGE_POLICIES: dict[tuple[str, str], EdgePolicy] = {}
PUBLIC_ROUTE_NOTE = (
    "The sample walkway links and building access anchors are provisional, not yet "
    "field-surveyed. Confirmed closed or restricted links are excluded from routes."
)


def haversine_meters(a_lat: float, a_lon: float, b_lat: float, b_lon: float) -> float:
    """Return the great-circle distance between two latitude/longitude points."""
    radius = 6_371_000
    phi1, phi2 = math.radians(a_lat), math.radians(b_lat)
    d_phi = math.radians(b_lat - a_lat)
    d_lambda = math.radians(b_lon - a_lon)
    value = (
        math.sin(d_phi / 2) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2
    )
    return 2 * radius * math.asin(math.sqrt(value))


def _node_coordinates(node_id: str) -> tuple[float, float]:
    _, latitude, longitude = CAMPUS_NODES[node_id]
    return latitude, longitude


def _edge_policy(start: str, end: str) -> EdgePolicy:
    return WALKWAY_EDGE_POLICIES.get((start, end)) or WALKWAY_EDGE_POLICIES.get(
        (end, start), EdgePolicy()
    )


def _edge_coordinates(start: str, end: str) -> list[tuple[float, float]]:
    """Return an edge's ordered path geometry, falling back to seed endpoints."""
    intermediate = WALKWAY_EDGE_GEOMETRY.get((start, end))
    if intermediate is None:
        intermediate = tuple(reversed(WALKWAY_EDGE_GEOMETRY.get((end, start), ())))
    return [_node_coordinates(start), *intermediate, _node_coordinates(end)]


def _polyline_distance(points: list[tuple[float, float]]) -> float:
    return sum(haversine_meters(*a, *b) for a, b in zip(points, points[1:]))


def _project_to_segment(
    point: tuple[float, float],
    start: tuple[float, float],
    end: tuple[float, float],
) -> tuple[tuple[float, float], float]:
    """Project a GPS point onto a short campus segment using local metre coordinates."""
    latitude, longitude = point
    longitude_scale = 111_320 * math.cos(math.radians(latitude))
    latitude_scale = 110_574
    start_xy = ((start[1] - longitude) * longitude_scale, (start[0] - latitude) * latitude_scale)
    end_xy = ((end[1] - longitude) * longitude_scale, (end[0] - latitude) * latitude_scale)
    delta_x = end_xy[0] - start_xy[0]
    delta_y = end_xy[1] - start_xy[1]
    length_squared = delta_x * delta_x + delta_y * delta_y
    fraction = 0.0 if length_squared == 0 else -(
        start_xy[0] * delta_x + start_xy[1] * delta_y
    ) / length_squared
    fraction = min(1.0, max(0.0, fraction))
    projected = (
        start[0] + (end[0] - start[0]) * fraction,
        start[1] + (end[1] - start[1]) * fraction,
    )
    return projected, haversine_meters(*point, *projected)


def _point_at_distance(points: list[tuple[float, float]], target: float) -> tuple[float, float]:
    walked = 0.0
    for start, end in zip(points, points[1:]):
        segment_length = haversine_meters(*start, *end)
        if walked + segment_length >= target:
            fraction = 0 if segment_length == 0 else (target - walked) / segment_length
            return (
                start[0] + (end[0] - start[0]) * fraction,
                start[1] + (end[1] - start[1]) * fraction,
            )
        walked += segment_length
    return points[-1]


def _slice_polyline(
    points: list[tuple[float, float]],
    start_distance: float,
    end_distance: float,
) -> list[tuple[float, float]]:
    """Return the part of a polyline between two distances from its first point."""
    if start_distance > end_distance:
        return list(reversed(_slice_polyline(points, end_distance, start_distance)))

    result = [_point_at_distance(points, start_distance)]
    walked = 0.0
    for point_a, point_b in zip(points, points[1:]):
        walked += haversine_meters(*point_a, *point_b)
        if start_distance < walked < end_distance:
            result.append(point_b)
    result.append(_point_at_distance(points, end_distance))
    return result


def _nearest_walkway_segment(point: tuple[float, float]) -> dict:
    nearest = None
    for start_node, end_node in WALKWAY_EDGES:
        policy = _edge_policy(start_node, end_node)
        if policy.status != "open" or policy.access != "public":
            continue

        points = _edge_coordinates(start_node, end_node)
        distance_along = 0.0
        for index, (segment_start, segment_end) in enumerate(zip(points, points[1:])):
            projected, access_distance = _project_to_segment(point, segment_start, segment_end)
            segment_length = haversine_meters(*segment_start, *segment_end)
            candidate = {
                "edge": (start_node, end_node),
                "geometry": points,
                "offset": distance_along + haversine_meters(*segment_start, *projected),
                "point": projected,
                "distance": access_distance,
                "segment_index": index,
            }
            if nearest is None or candidate["distance"] < nearest["distance"]:
                nearest = candidate
            distance_along += segment_length

    if nearest is None or nearest["distance"] > MAX_ACCESS_DISTANCE_METERS:
        raise HTTPException(
            status_code=422,
            detail="The selected point is too far from a mapped public walking path.",
        )
    return nearest


def _add_graph_arc(
    graph: dict[str, list[tuple[str, float, list[tuple[float, float]]]]],
    start: str,
    end: str,
    geometry: list[tuple[float, float]],
) -> None:
    distance = _polyline_distance(geometry)
    graph.setdefault(start, []).append((end, distance, geometry))
    graph.setdefault(end, []).append((start, distance, list(reversed(geometry))))


def _build_routing_graph(source_snap: dict, destination_snap: dict):
    """Split walkway edges at GPS access points so routes begin/end on-path."""
    graph: dict[str, list[tuple[str, float, list[tuple[float, float]]]]] = {
        node_id: [] for node_id in CAMPUS_NODES
    }
    snap_specs = (
        ("__route_source_snap__", source_snap),
        ("__route_destination_snap__", destination_snap),
    )
    snaps_by_edge: dict[frozenset[str], list[tuple[float, str, tuple[float, float]]]] = {}
    for snap_id, snap in snap_specs:
        start_node, end_node = snap["edge"]
        edge_key = frozenset((start_node, end_node))
        snaps_by_edge.setdefault(edge_key, []).append((snap["offset"], snap_id, snap["point"]))
        graph[snap_id] = []

    for start_node, end_node in WALKWAY_EDGES:
        policy = _edge_policy(start_node, end_node)
        if policy.status != "open" or policy.access != "public":
            continue

        geometry = _edge_coordinates(start_node, end_node)
        edge_snaps = sorted(snaps_by_edge.get(frozenset((start_node, end_node)), []))
        if not edge_snaps:
            _add_graph_arc(graph, start_node, end_node, geometry)
            continue

        total_length = _polyline_distance(geometry)
        split_points = [(0.0, start_node)]
        split_points.extend((offset, snap_id) for offset, snap_id, _ in edge_snaps)
        split_points.append((total_length, end_node))
        for (from_distance, from_node), (to_distance, to_node) in zip(split_points, split_points[1:]):
            segment = _slice_polyline(geometry, from_distance, to_distance)
            _add_graph_arc(graph, from_node, to_node, segment)

    for snap_id, snap in snap_specs:
        source_id = "__route_source__" if snap_id == "__route_source_snap__" else "__route_destination__"
        graph[source_id] = []
        _add_graph_arc(graph, source_id, snap_id, [snap["requested_point"], snap["point"]])

    return graph


def _route_geometry_between(source: tuple[float, float], destination: tuple[float, float]):
    if haversine_meters(*source, *destination) < 1:
        raise HTTPException(status_code=422, detail="Start and destination are the same location.")

    source_snap = _nearest_walkway_segment(source)
    destination_snap = _nearest_walkway_segment(destination)
    source_snap["requested_point"] = source
    destination_snap["requested_point"] = destination
    graph = _build_routing_graph(source_snap, destination_snap)

    source_id = "__route_source__"
    destination_id = "__route_destination__"
    distances = {node_id: math.inf for node_id in graph}
    previous: dict[str, tuple[str, list[tuple[float, float]]] | None] = {
        node_id: None for node_id in graph
    }
    distances[source_id] = 0.0
    queue = [(0.0, source_id)]

    while queue:
        current_distance, current = heapq.heappop(queue)
        if current_distance != distances[current]:
            continue
        if current == destination_id:
            break
        for neighbor, edge_distance, geometry in graph[current]:
            candidate = current_distance + edge_distance
            if candidate < distances[neighbor]:
                distances[neighbor] = candidate
                previous[neighbor] = (current, geometry)
                heapq.heappush(queue, (candidate, neighbor))

    if math.isinf(distances[destination_id]):
        raise HTTPException(status_code=422, detail="No public campus walking route connects these locations.")

    geometry_parts = []
    current = destination_id
    while current != source_id:
        parent = previous[current]
        if parent is None:
            raise HTTPException(status_code=422, detail="Unable to reconstruct the walking route.")
        previous_node, geometry = parent
        geometry_parts.append(geometry)
        current = previous_node

    route_points = []
    for geometry in reversed(geometry_parts):
        for point in geometry:
            if not route_points or haversine_meters(*route_points[-1], *point) > 0.5:
                route_points.append(point)
    return route_points, distances[destination_id]


def _build_graph() -> dict[str, list[tuple[str, float]]]:
    graph = {node_id: [] for node_id in CAMPUS_NODES}
    for start, end in WALKWAY_EDGES:
        policy = _edge_policy(start, end)
        if policy.status != "open" or policy.access != "public":
            continue
        distance = _polyline_distance(_edge_coordinates(start, end))
        graph[start].append((end, distance))
        graph[end].append((start, distance))
    return graph


def _validate_walkway_graph() -> None:
    """Fail early on malformed map data instead of returning a misleading route."""
    seen_edges = set()
    for start, end in WALKWAY_EDGES:
        if start not in CAMPUS_NODES or end not in CAMPUS_NODES:
            raise ValueError(f"Walkway edge references an unknown node: {start} -> {end}")
        key = frozenset((start, end))
        if start == end or key in seen_edges:
            raise ValueError(f"Walkway graph contains a self-loop or duplicate edge: {start} -> {end}")
        seen_edges.add(key)
        for latitude, longitude in _edge_coordinates(start, end):
            if not -90 <= latitude <= 90 or not -180 <= longitude <= 180:
                raise ValueError(f"Invalid coordinate on walkway edge: {start} -> {end}")


_validate_walkway_graph()


def shortest_path(start: str, end: str) -> tuple[list[str], float]:
    """Return the minimum-distance landmark path and its graph cost."""
    if start not in CAMPUS_NODES or end not in CAMPUS_NODES:
        raise HTTPException(status_code=422, detail="The selected point is not a mapped campus location.")
    graph = _build_graph()
    distances = {node_id: math.inf for node_id in graph}
    previous: dict[str, str | None] = {node_id: None for node_id in graph}
    distances[start] = 0
    queue = [(0.0, start)]

    while queue:
        current_distance, current = heapq.heappop(queue)
        if current_distance != distances[current]:
            continue
        if current == end:
            break

        for neighbor, edge_distance in graph[current]:
            candidate = current_distance + edge_distance
            if candidate < distances[neighbor]:
                distances[neighbor] = candidate
                previous[neighbor] = current
                heapq.heappush(queue, (candidate, neighbor))

    if math.isinf(distances[end]):
        raise HTTPException(status_code=422, detail="No campus walking route connects these locations.")

    path = []
    current: str | None = end
    while current is not None:
        path.append(current)
        current = previous[current]
    path.reverse()
    return path, distances[end]


def _bearing_degrees(start: tuple[float, float], end: tuple[float, float]) -> float:
    lat1, lon1 = map(math.radians, start)
    lat2, lon2 = map(math.radians, end)
    delta_lon = lon2 - lon1
    y = math.sin(delta_lon) * math.cos(lat2)
    x = math.cos(lat1) * math.sin(lat2) - math.sin(lat1) * math.cos(lat2) * math.cos(delta_lon)
    return (math.degrees(math.atan2(y, x)) + 360) % 360


def _compass_direction(bearing: float) -> str:
    directions = ("north", "northeast", "east", "southeast", "south", "southwest", "west", "northwest")
    return directions[round(bearing / 45) % len(directions)]


def _turn_instruction(previous_bearing: float, next_bearing: float) -> str:
    turn = (next_bearing - previous_bearing + 540) % 360 - 180
    if abs(turn) < 25:
        return "Continue straight"
    if abs(turn) > 155:
        return "Turn around"
    return "Turn right" if turn > 0 else "Turn left"


def _build_directions(
    route_points: list[tuple[float, float]],
    source_name: str,
    destination_name: str,
) -> list[str]:
    if len(route_points) < 2:
        return [f"You are already at {destination_name}."]

    segments = [
        (start, haversine_meters(*start, *end), _bearing_degrees(start, end))
        for start, end in zip(route_points, route_points[1:])
        if haversine_meters(*start, *end) > 0.5
    ]
    if not segments:
        return [f"You are already at {destination_name}."]

    turns = []
    previous_bearing = segments[0][2]
    for index in range(1, len(segments)):
        next_bearing = segments[index][2]
        turn = (next_bearing - previous_bearing + 540) % 360 - 180
        if abs(turn) >= 25:
            turns.append((index, _turn_instruction(previous_bearing, next_bearing), segments[index][0]))
        previous_bearing = next_bearing

    directions = []
    first_end = turns[0][0] if turns else len(segments)
    first_distance = round(sum(segment[1] for segment in segments[:first_end]))
    directions.append(
        f"Start at {source_name}. Head {_compass_direction(segments[0][2])} for {first_distance} m."
    )

    for turn_number, (segment_index, action, turn_point) in enumerate(turns):
        next_turn_index = (
            turns[turn_number + 1][0]
            if turn_number + 1 < len(turns)
            else len(segments)
        )
        distance = round(sum(segment[1] for segment in segments[segment_index:next_turn_index]))
        junction = min(
            (
                (haversine_meters(*turn_point, *_node_coordinates(node_id)), node_id)
                for node_id, role in WALKWAY_NODE_ROLES.items()
                if role == "junction"
            ),
            default=(math.inf, ""),
        )
        junction_name = CAMPUS_NODES[junction[1]][0] if junction[0] <= 15 else None
        prefix = f"At {junction_name}, " if junction_name else ""
        directions.append(f"{prefix}{action.lower()} and continue for {distance} m.")
    directions.append(f"You have arrived at {destination_name}.")
    return directions


@router.post("/route", response_model=RouteOut)
def create_route(payload: RouteRequest):
    source = (payload.source.latitude, payload.source.longitude)
    destination = (payload.destination.latitude, payload.destination.longitude)
    route_points, _graph_distance = _route_geometry_between(source, destination)

    # Collapse duplicate points (common when a selected place is itself a graph node).
    compact_points = []
    for point in route_points:
        if not compact_points or haversine_meters(*compact_points[-1], *point) > 0.5:
            compact_points.append(point)

    distance_meters = round(_polyline_distance(compact_points))
    walking_minutes = max(1, math.ceil(distance_meters / WALKING_METERS_PER_MINUTE))

    source_name = payload.source_name or "your starting point"
    destination_name = payload.destination_name or "your destination"
    directions = _build_directions(compact_points, source_name, destination_name)

    return RouteOut(
        route=[[latitude, longitude] for latitude, longitude in compact_points],
        distance_meters=distance_meters,
        walking_minutes=walking_minutes,
        directions=directions,
        algorithm="Dijkstra",
        network_note=PUBLIC_ROUTE_NOTE,
    )
