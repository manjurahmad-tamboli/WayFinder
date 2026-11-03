import math
import unittest
from unittest.mock import patch

import backend.navigation as navigation
from backend.navigation import (
    CAMPUS_NODES,
    WALKING_GRAPH,
    campus_route,
    dijkstra_shortest_path,
)


class DijkstraTests(unittest.TestCase):
    def test_returns_path_with_lowest_total_weight(self):
        sample_graph = {
            "start": [("short", 2), ("long", 7)],
            "short": [("start", 2), ("end", 2)],
            "long": [("start", 7), ("end", 1)],
            "end": [("short", 2), ("long", 1)],
        }

        with patch.dict(WALKING_GRAPH, sample_graph, clear=True):
            path, distance = dijkstra_shortest_path("start", "end")

        self.assertEqual(path, ["start", "short", "end"])
        self.assertEqual(distance, 4)

    def test_reports_unreachable_destination(self):
        sample_graph = {"start": [], "end": []}
        with patch.dict(WALKING_GRAPH, sample_graph, clear=True):
            with self.assertRaisesRegex(ValueError, "No pedestrian path"):
                dijkstra_shortest_path("start", "end")

    def test_reports_unknown_graph_node(self):
        with self.assertRaisesRegex(ValueError, "not connected"):
            dijkstra_shortest_path("missing", "main_gate")

    def test_closed_or_restricted_path_is_excluded_from_routing(self):
        blocked_edge = frozenset(("central_hub", "east_academic"))

        for status_field in ("CLOSED_PATH_EDGES", "RESTRICTED_PATH_EDGES"):
            with self.subTest(status=status_field):
                with patch.object(navigation, status_field, {blocked_edge}):
                    graph_without_blocked_edge = navigation._build_graph()

                with patch.dict(WALKING_GRAPH, graph_without_blocked_edge, clear=True):
                    path, _ = dijkstra_shortest_path("central_hub", "east_academic")

                self.assertTrue(
                    all(
                        frozenset((first, second)) != blocked_edge
                        for first, second in zip(path, path[1:])
                    )
                )


class CampusRouteTests(unittest.TestCase):
    def test_route_includes_endpoints_distance_and_turn_guidance(self):
        start = CAMPUS_NODES["main_gate"]
        destination = CAMPUS_NODES["hostel_walk"]

        route, distance, directions = campus_route(
            (start.latitude, start.longitude),
            (destination.latitude, destination.longitude),
            "Hostel",
        )

        self.assertEqual(route[0], [start.latitude, start.longitude])
        self.assertEqual(route[-1], [destination.latitude, destination.longitude])
        self.assertGreater(distance, 0)
        self.assertGreaterEqual(len(directions), 3)
        self.assertIn("Hostel", directions[-1])
        self.assertTrue(any("Turn left" in step or "Turn right" in step for step in directions))
        self.assertTrue(any(" m " in step for step in directions))

    def test_rejects_non_finite_or_invalid_coordinates(self):
        valid_point = (16.845935, 74.602656)
        with self.assertRaisesRegex(ValueError, "finite"):
            campus_route((math.nan, 74.6), valid_point)
        with self.assertRaisesRegex(ValueError, "valid latitude"):
            campus_route((91, 74.6), valid_point)

    def test_rejects_points_far_outside_campus_network(self):
        with self.assertRaisesRegex(ValueError, "outside the mapped campus"):
            campus_route((0, 0), (16.845935, 74.602656))


if __name__ == "__main__":
    unittest.main()
