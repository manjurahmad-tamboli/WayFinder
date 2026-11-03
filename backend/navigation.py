"""Campus walking network and route helpers used by the navigation API."""

from __future__ import annotations

import heapq
import math
from dataclasses import dataclass


@dataclass(frozen=True)
class CampusNode:
    name: str
    latitude: float
    longitude: float
    kind: str = "junction"


# These points model the main walkable paths between the sample campus locations.
# Update this small graph when a real campus survey or GIS map becomes available.
CAMPUS_NODES = {
    "main_gate": CampusNode("Main Gate Entrance", 16.845935, 74.602656, "entrance"),
    "north_hub": CampusNode("North Campus Walk", 16.845710, 74.602090),
    "central_hub": CampusNode("Central Junction", 16.845350, 74.602180),
    "east_academic": CampusNode("Academic Block Junction", 16.845120, 74.603100),
    "south_east": CampusNode("East Hostel Walk", 16.844640, 74.603220),
    "hostel_walk": CampusNode("Hostel Walk", 16.844200, 74.603500),
    "south_hub": CampusNode("South Campus Junction", 16.843920, 74.602420),
    "west_academic": CampusNode("Academic Walk", 16.844820, 74.601380),
    "west_hub": CampusNode("West Campus Walk", 16.844260, 74.601230),
    "north_west": CampusNode("Northwest Walk", 16.845530, 74.601000),
    "canteen_walk": CampusNode("Canteen Walk", 16.843480, 74.601760),
    "sports_walk": CampusNode("Sports Walk", 16.842930, 74.601020),
}

# Undirected pedestrian paths. Edge weights are calculated from coordinates so
# the Dijkstra result always represents the shortest total walking distance.
PATH_EDGES = (
    ("main_gate", "north_hub"), ("north_hub", "central_hub"),
    ("north_hub", "north_west"), ("central_hub", "east_academic"),
    ("central_hub", "west_academic"), ("central_hub", "south_hub"),
    ("east_academic", "south_east"), ("south_east", "hostel_walk"),
    ("south_east", "south_hub"), ("south_hub", "west_hub"),
    ("south_hub", "canteen_walk"), ("west_academic", "west_hub"),
    ("west_academic", "north_west"), ("west_hub", "canteen_walk"),
    ("canteen_walk", "sports_walk"),
)

# Add a normalized (unordered) pair here only after a closure or access rule is
# confirmed by the campus. No path is marked closed by default because the public
# map sources do not provide a current campus-wide restriction list.
CLOSED_PATH_EDGES: set[frozenset[str]] = set()
RESTRICTED_PATH_EDGES: set[frozenset[str]] = set()


def haversine_meters(a_lat: float, a_lon: float, b_lat: float, b_lon: float) -> float:
    radius = 6_371_000
    phi1, phi2 = math.radians(a_lat), math.radians(b_lat)
    d_phi, d_lambda = math.radians(b_lat - a_lat), math.radians(b_lon - a_lon)
    value = math.sin(d_phi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2
    return 2 * radius * math.asin(math.sqrt(value))


def _build_graph() -> dict[str, list[tuple[str, float]]]:
    graph = {node_id: [] for node_id in CAMPUS_NODES}
    for first, second in PATH_EDGES:
        edge_key = frozenset((first, second))
        if edge_key in CLOSED_PATH_EDGES or edge_key in RESTRICTED_PATH_EDGES:
            continue
        first_node, second_node = CAMPUS_NODES[first], CAMPUS_NODES[second]
        distance = haversine_meters(first_node.latitude, first_node.longitude, second_node.latitude, second_node.longitude)
        graph[first].append((second, distance))
        graph[second].append((first, distance))
    return graph


WALKING_GRAPH = _build_graph()
MAX_ACCESS_DISTANCE_METERS = 500
WALKING_SPEED_METERS_PER_MINUTE = 80


def closest_node(latitude: float, longitude: float) -> tuple[str, float]:
    """Return the closest mapped pedestrian-path node and access distance."""
    return min(
        ((node_id, haversine_meters(latitude, longitude, node.latitude, node.longitude)) for node_id, node in CAMPUS_NODES.items()),
        key=lambda item: item[1],
    )


def dijkstra_shortest_path(start: str, end: str) -> tuple[list[str], float]:
    """Find the least-distance route in the campus pedestrian graph."""
    if start not in WALKING_GRAPH or end not in WALKING_GRAPH:
        raise ValueError("The selected point is not connected to the campus walking network")

    queue: list[tuple[float, str]] = [(0, start)]
    distances = {node_id: math.inf for node_id in WALKING_GRAPH}
    previous: dict[str, str] = {}
    distances[start] = 0

    while queue:
        current_distance, current = heapq.heappop(queue)
        if current_distance != distances[current]:
            continue
        if current == end:
            break
        for neighbor, edge_distance in WALKING_GRAPH[current]:
            proposed_distance = current_distance + edge_distance
            if proposed_distance < distances[neighbor]:
                distances[neighbor] = proposed_distance
                previous[neighbor] = current
                heapq.heappush(queue, (proposed_distance, neighbor))

    if math.isinf(distances[end]):
        raise ValueError("No pedestrian path connects these locations")

    path = [end]
    while path[-1] != start:
        path.append(previous[path[-1]])
    path.reverse()
    return path, distances[end]


def bearing_degrees(start: tuple[float, float], end: tuple[float, float]) -> float:
    start_lat, start_lon = map(math.radians, start)
    end_lat, end_lon = map(math.radians, end)
    longitude_difference = end_lon - start_lon
    x = math.sin(longitude_difference) * math.cos(end_lat)
    y = math.cos(start_lat) * math.sin(end_lat) - math.sin(start_lat) * math.cos(end_lat) * math.cos(longitude_difference)
    return (math.degrees(math.atan2(x, y)) + 360) % 360


def turn_instruction(previous_bearing: float, next_bearing: float) -> str:
    difference = (next_bearing - previous_bearing + 540) % 360 - 180
    if abs(difference) < 25:
        return "Continue straight"
    if abs(difference) > 150:
        return "Make a U-turn"
    return "Turn right" if difference > 0 else "Turn left"


def route_directions(
    points: list[tuple[float, float]],
    point_nodes: list[str | None],
    destination_name: str | None,
) -> list[str]:
    directions = ["Start at your selected location."]
    segment_distances = [
        haversine_meters(*points[index], *points[index + 1])
        for index in range(len(points) - 1)
    ]
    if not segment_distances:
        return [*directions, f"You have reached {destination_name or 'your destination'}."]

    bearings = [
        bearing_degrees(points[index], points[index + 1])
        for index in range(len(points) - 1)
    ]
    destination_label = destination_name or "your destination"

    def point_label(index: int) -> str:
        node_id = point_nodes[index]
        return CAMPUS_NODES[node_id].name if node_id else destination_label

    # Combine small bends into one instruction. This keeps the directions readable
    # while still announcing a turn at a meaningful junction.
    groups: list[tuple[int, int]] = []
    group_start = 0
    for segment_index in range(1, len(segment_distances)):
        change = (bearings[segment_index] - bearings[segment_index - 1] + 540) % 360 - 180
        if abs(change) >= 25:
            groups.append((group_start, segment_index - 1))
            group_start = segment_index
    groups.append((group_start, len(segment_distances) - 1))

    for group_index, (first_segment, last_segment) in enumerate(groups):
        distance = max(1, round(sum(segment_distances[first_segment:last_segment + 1])))
        target = point_label(last_segment + 1)
        if group_index == 0:
            directions.append(f"Walk straight for {distance} m toward {target}.")
            continue

        turn = turn_instruction(bearings[first_segment - 1], bearings[first_segment])
        junction = point_label(first_segment)
        directions.append(f"{turn} at {junction}, then continue for {distance} m toward {target}.")

    directions.append(f"You have reached {destination_label}.")
    return directions


def campus_route(source: tuple[float, float], destination: tuple[float, float], destination_name: str | None = None) -> tuple[list[list[float]], int, list[str]]:
    """Build a shortest route from access legs plus a Dijkstra graph path."""
    for latitude, longitude in (source, destination):
        if not math.isfinite(latitude) or not math.isfinite(longitude):
            raise ValueError("Coordinates must be finite numbers")
        if not -90 <= latitude <= 90 or not -180 <= longitude <= 180:
            raise ValueError("Coordinates are outside the valid latitude/longitude range")

    start_node, start_access = closest_node(*source)
    end_node, end_access = closest_node(*destination)
    if max(start_access, end_access) > MAX_ACCESS_DISTANCE_METERS:
        raise ValueError("A selected point is outside the mapped campus walking network")

    path_nodes, graph_distance = dijkstra_shortest_path(start_node, end_node)
    node_points = [(CAMPUS_NODES[node_id].latitude, CAMPUS_NODES[node_id].longitude) for node_id in path_nodes]
    points = [source, *node_points, destination]
    point_nodes: list[str | None] = [None, *path_nodes, None]
    unique_points: list[tuple[float, float]] = []
    unique_point_nodes: list[str | None] = []
    for point, node_id in zip(points, point_nodes):
        if unique_points and point == unique_points[-1]:
            unique_point_nodes[-1] = node_id or unique_point_nodes[-1]
            continue
        unique_points.append(point)
        unique_point_nodes.append(node_id)
    total_distance = round(start_access + graph_distance + end_access)
    route = [[latitude, longitude] for latitude, longitude in unique_points]
    return route, total_distance, route_directions(unique_points, unique_point_nodes, destination_name)
