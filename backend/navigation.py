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


# These points model the main walkable paths between the sample campus locations.
# Update this small graph when a real campus survey or GIS map becomes available.
CAMPUS_NODES = {
    "main_gate": CampusNode("Main Gate Junction", 16.845935, 74.602656),
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


def haversine_meters(a_lat: float, a_lon: float, b_lat: float, b_lon: float) -> float:
    radius = 6_371_000
    phi1, phi2 = math.radians(a_lat), math.radians(b_lat)
    d_phi, d_lambda = math.radians(b_lat - a_lat), math.radians(b_lon - a_lon)
    value = math.sin(d_phi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2
    return 2 * radius * math.asin(math.sqrt(value))


def _build_graph() -> dict[str, list[tuple[str, float]]]:
    graph = {node_id: [] for node_id in CAMPUS_NODES}
    for first, second in PATH_EDGES:
        first_node, second_node = CAMPUS_NODES[first], CAMPUS_NODES[second]
        distance = haversine_meters(first_node.latitude, first_node.longitude, second_node.latitude, second_node.longitude)
        graph[first].append((second, distance))
        graph[second].append((first, distance))
    return graph


WALKING_GRAPH = _build_graph()


def closest_node(latitude: float, longitude: float) -> tuple[str, float]:
    """Return the closest mapped pedestrian-path node and access distance."""
    return min(
        ((node_id, haversine_meters(latitude, longitude, node.latitude, node.longitude)) for node_id, node in CAMPUS_NODES.items()),
        key=lambda item: item[1],
    )


def dijkstra_shortest_path(start: str, end: str) -> tuple[list[str], float]:
    """Find the least-distance route in the campus pedestrian graph."""
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
    directions = ["Start from your selected location."]
    segment_distances = [haversine_meters(*points[index], *points[index + 1]) for index in range(len(points) - 1)]
    if not segment_distances:
        return directions

    destination_label = destination_name or "your destination"

    def point_label(index: int) -> str:
        node_id = point_nodes[index]
        return CAMPUS_NODES[node_id].name if node_id else destination_label

    directions.append(f"Go straight for {max(1, round(segment_distances[0]))} m toward {point_label(1)}.")
    for index in range(1, len(segment_distances)):
        previous_bearing = bearing_degrees(points[index - 1], points[index])
        next_bearing = bearing_degrees(points[index], points[index + 1])
        landmark = point_label(index)
        directions.append(
            f"{turn_instruction(previous_bearing, next_bearing)} at {landmark}, then continue for {max(1, round(segment_distances[index]))} m toward {point_label(index + 1)}."
        )

    directions.append(f"You have reached {destination_label}.")
    return directions


def campus_route(source: tuple[float, float], destination: tuple[float, float], destination_name: str | None = None) -> tuple[list[list[float]], int, list[str]]:
    """Build a shortest route from access legs plus a Dijkstra graph path."""
    start_node, start_access = closest_node(*source)
    end_node, end_access = closest_node(*destination)
    if max(start_access, end_access) > 500:
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
