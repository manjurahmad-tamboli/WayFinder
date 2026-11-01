import unittest
from unittest.mock import patch

from schemas.schemas import Point, RouteRequest
from routers import routes


class CampusRouteTests(unittest.TestCase):
    def test_seed_graph_is_valid_and_connected(self):
        routes._validate_walkway_graph()
        graph = routes._build_graph()
        reached = {"main_gate"}
        pending = ["main_gate"]

        while pending:
            current = pending.pop()
            for neighbor, _ in graph[current]:
                if neighbor not in reached:
                    reached.add(neighbor)
                    pending.append(neighbor)

        self.assertEqual(reached, set(routes.CAMPUS_NODES))
        self.assertEqual(routes.WALKWAY_NODE_ROLES["main_gate"], "entrance")
        self.assertGreaterEqual(
            sum(role == "junction" for role in routes.WALKWAY_NODE_ROLES.values()), 4
        )

    def test_dijkstra_reroutes_around_a_closed_edge(self):
        closed_edge = ("exam_center", "gymkhana")
        policy = routes.EdgePolicy(status="closed", note="temporary closure")
        with patch.dict(routes.WALKWAY_EDGE_POLICIES, {closed_edge: policy}):
            path, _ = routes.shortest_path("exam_center", "gymkhana")

        self.assertNotEqual(path, ["exam_center", "gymkhana"])
        self.assertIn("class_room_8", path)

    def test_dijkstra_avoids_restricted_edge_for_public_routes(self):
        restricted_edge = ("d1_block", "girls_hostel_mess")
        policy = routes.EdgePolicy(status="restricted", access="residents")
        with patch.dict(routes.WALKWAY_EDGE_POLICIES, {restricted_edge: policy}):
            path, _ = routes.shortest_path("d1_block", "girls_hostel_mess")

        self.assertNotIn(("d1_block", "girls_hostel_mess"), list(zip(path, path[1:])))
        self.assertIn("walchand_hostel", path)

    def test_route_uses_edge_geometry_and_returns_network_note(self):
        waypoint = (16.845970, 74.602520)
        with patch.dict(
            routes.WALKWAY_EDGE_GEOMETRY,
            {("main_gate", "parking"): (waypoint,)},
        ):
            response = routes.create_route(
                RouteRequest(
                    source=Point(latitude=16.845935, longitude=74.602656),
                    destination=Point(latitude=16.845892, longitude=74.601999),
                    source_name="Main Gate",
                    destination_name="Parking",
                )
            )

        self.assertIn([waypoint[0], waypoint[1]], response.route)
        self.assertIn("provisional", response.network_note)
        self.assertGreater(response.distance_meters, 0)
        self.assertGreaterEqual(response.walking_minutes, 1)

    def test_straight_segments_are_merged_in_directions(self):
        points = [
            (16.845935, 74.602656),
            (16.845892, 74.601999),
            (16.845815, 74.601301),
        ]
        directions = routes._build_directions(points, "Main Gate", "Engineering Statue")

        self.assertEqual(len(directions), 2)
        self.assertTrue(directions[0].startswith("Start at Main Gate."))
        self.assertTrue(directions[-1].startswith("You have arrived"))

    def test_turn_instruction_names_a_modeled_junction(self):
        points = [
            routes._node_coordinates("main_gate"),
            routes._node_coordinates("parking"),
            routes._node_coordinates("cyber_hostel"),
        ]
        directions = routes._build_directions(points, "Main Gate", "Cyber Hostel")

        self.assertTrue(any("At Parking" in direction for direction in directions))


if __name__ == "__main__":
    unittest.main()
