"""Campus pedestrian routing using Dijkstra's shortest-path algorithm.

The sample walkway network is a hand-authored graph based on this project's
campus seed coordinates. Replace or verify these path connections against a
campus survey before relying on them for real-world navigation.
"""

import heapq
import math

from fastapi import APIRouter, HTTPException

from schemas.schemas import RouteOut, RouteRequest

router = APIRouter(tags=["Navigation"])

WALKING_METERS_PER_MINUTE = 80
MAX_ACCESS_DISTANCE_METERS = 500

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


def _build_graph() -> dict[str, list[tuple[str, float]]]:
    graph = {node_id: [] for node_id in CAMPUS_NODES}
    for start, end in WALKWAY_EDGES:
        start_lat, start_lon = _node_coordinates(start)
        end_lat, end_lon = _node_coordinates(end)
        distance = haversine_meters(start_lat, start_lon, end_lat, end_lon)
        graph[start].append((end, distance))
        graph[end].append((start, distance))
    return graph


def shortest_path(start: str, end: str) -> tuple[list[str], float]:
    """Return the minimum-distance landmark path and its graph cost."""
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


def _nearest_node(latitude: float, longitude: float) -> tuple[str, float]:
    distance, node_id = min(
        (
            haversine_meters(latitude, longitude, node_lat, node_lon),
            node_id,
        )
        for node_id, (_, node_lat, node_lon) in CAMPUS_NODES.items()
    )
    if distance > MAX_ACCESS_DISTANCE_METERS:
        raise HTTPException(
            status_code=422,
            detail="The selected point is too far from the mapped campus walking paths.",
        )
    return node_id, distance


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
    directions = []
    if len(route_points) < 2:
        return [f"You are already at {destination_name}."]

    previous_bearing = None
    for index, (start, end) in enumerate(zip(route_points, route_points[1:])):
        distance = round(haversine_meters(*start, *end))
        bearing = _bearing_degrees(start, end)

        if index == 0:
            directions.append(
                f"Start at {source_name}. Head {_compass_direction(bearing)} for {distance} m."
            )
        else:
            action = _turn_instruction(previous_bearing, bearing)
            if action == "Continue straight":
                directions.append(f"{action} for {distance} m.")
            else:
                directions.append(f"{action} and continue for {distance} m.")
        previous_bearing = bearing

    directions.append(f"You have arrived at {destination_name}.")
    return directions


@router.post("/route", response_model=RouteOut)
def create_route(payload: RouteRequest):
    source = (payload.source.latitude, payload.source.longitude)
    destination = (payload.destination.latitude, payload.destination.longitude)
    source_node, source_access_distance = _nearest_node(*source)
    destination_node, destination_access_distance = _nearest_node(*destination)

    if source_node == destination_node and haversine_meters(*source, *destination) < 1:
        raise HTTPException(status_code=422, detail="Start and destination are the same location.")

    node_path, _graph_distance = shortest_path(source_node, destination_node)
    route_points = [source]
    route_points.extend(_node_coordinates(node_id) for node_id in node_path)
    route_points.append(destination)

    # Collapse duplicate points (common when a selected place is itself a graph node).
    compact_points = []
    for point in route_points:
        if not compact_points or haversine_meters(*compact_points[-1], *point) > 0.5:
            compact_points.append(point)

    distance_meters = round(
        sum(haversine_meters(*start, *end) for start, end in zip(compact_points, compact_points[1:]))
    )
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
    )
