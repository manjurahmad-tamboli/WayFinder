"""Focused tests for the AI campus tools using an isolated in-memory database."""

import json
import unittest
from unittest.mock import patch

from pydantic import ValidationError
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from database.database import Base
from models import Category, Location
from schemas.schemas import AIIntentHint, ChatMessage, ChatRequest, Point
from routers.ai import assistant_health, chat
from services.campus_assistant import build_chat_response
from services.response_provider import _request_provider, classify_intent, rephrase_answer


class CampusAssistantTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.engine = create_engine(
            "sqlite://",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        Base.metadata.create_all(cls.engine)

    @classmethod
    def tearDownClass(cls):
        Base.metadata.drop_all(cls.engine)
        cls.engine.dispose()

    def setUp(self):
        self.db = Session(self.engine)
        self.db.query(Location).delete()
        self.db.query(Category).delete()
        self.db.add_all([Category(name="Academic"), Category(name="Facilities"), Category(name="Food"), Category(name="Hostel")])
        self.db.flush()
        self.gate = Location(
            name="Main Gate", category="Facilities", latitude=16.845935, longitude=74.602656,
            description="Main campus entrance", image="main_gate.jpeg", opening_hours="Open 24 Hours",
        )
        self.it_hut = Location(
            name="IT Hut", category="Academic", latitude=16.845548, longitude=74.601036,
            description="Computer Lab", image="it_hut.jpeg", opening_hours="9 AM - 5 PM",
        )
        self.canteen = Location(
            name="Government Canteen", category="Food", latitude=16.843346, longitude=74.601883,
            description="College Canteen", image="gov_canteen.jpeg", opening_hours="8 AM - 8 PM",
        )
        self.hostel = Location(
            name="Cyber Hostel", category="Hostel", latitude=16.845342, longitude=74.602194,
            description="Student hostel", image="cyber_hostel.jpg", opening_hours="24 Hours",
        )
        self.db.add_all([self.gate, self.it_hut, self.canteen, self.hostel])
        self.db.commit()
        self.db.refresh(self.gate)
        self.db.refresh(self.it_hut)
        self.db.refresh(self.canteen)
        self.db.refresh(self.hostel)

    def tearDown(self):
        self.db.close()

    def test_location_matching_uses_existing_records_and_map_action(self):
        response = build_chat_response(ChatRequest(message="Where is the Computer Department?", conversation_id="test-session"), self.db)
        self.assertEqual(response.intent, "find_location")
        self.assertEqual(response.locations[0].id, self.it_hut.id)
        self.assertEqual(response.map_action.type, "show_location")
        self.assertEqual(response.conversation_id, "test-session")

    def test_category_filter_returns_only_matching_category(self):
        response = build_chat_response(ChatRequest(message="Show all academic buildings"), self.db)
        self.assertEqual(response.intent, "category_search")
        self.assertEqual([place.category for place in response.locations], ["Academic"])
        self.assertEqual(response.map_action.type, "filter_category")

    def test_location_details_include_verified_opening_hours(self):
        response = build_chat_response(ChatRequest(message="What are the opening hours for Cyber Hostel?"), self.db)
        self.assertEqual(response.intent, "location_info")
        self.assertIn("24 Hours", response.answer)
        self.assertEqual(response.locations[0].id, self.hostel.id)

    def test_nearby_search_sorts_and_returns_real_distances(self):
        response = build_chat_response(
            ChatRequest(message="Find the nearest canteen", user_location=Point(latitude=16.8434, longitude=74.6019)),
            self.db,
        )
        self.assertEqual(response.intent, "nearby_search")
        self.assertEqual(response.locations[0].id, self.canteen.id)
        self.assertIsNotNone(response.locations[0].distance_meters)
        self.assertIn("m)", response.answer)

    def test_nearby_search_supports_a_manually_selected_campus_place(self):
        response = build_chat_response(
            ChatRequest(message="What is nearby?", user_location_id=self.hostel.id),
            self.db,
        )
        self.assertEqual(response.intent, "nearby_search")
        self.assertIn("Cyber Hostel", response.answer)
        self.assertTrue(all(place.distance_meters is not None for place in response.locations))

    def test_natural_short_forms_resolve_to_existing_places(self):
        lab_response = build_chat_response(ChatRequest(message="Show all laboratories"), self.db)
        self.assertEqual([place.id for place in lab_response.locations], [self.it_hut.id])
        route_response = build_chat_response(ChatRequest(message="Take me to the canteen"), self.db)
        self.assertEqual(route_response.map_action.type, "request_location")
        self.assertEqual(route_response.locations[0].id, self.canteen.id)

    def test_follow_up_near_it_uses_previous_user_location_reference(self):
        response = build_chat_response(
            ChatRequest(
                message="What is near it?",
                conversation_history=[ChatMessage(role="user", content="Where is Cyber Hostel?")],
            ),
            self.db,
        )
        self.assertEqual(response.intent, "nearby_search")
        self.assertIn("Cyber Hostel", response.answer)
        self.assertIsNotNone(response.locations)

    def test_named_route_reuses_dijkstra_and_returns_turn_directions(self):
        response = build_chat_response(ChatRequest(message="How do I get to IT Hut from Main Gate?"), self.db)
        self.assertEqual(response.intent, "get_directions")
        self.assertEqual(response.route.algorithm, "Dijkstra")
        self.assertGreater(response.route.distance_meters, 0)
        self.assertTrue(response.route.directions)
        self.assertIn("IT Hut", response.route.directions[-1])
        self.assertEqual(response.map_action.source_id, self.gate.id)
        self.assertEqual(response.map_action.destination_id, self.it_hut.id)
        self.assertEqual(response.map_action.type, "show_route")

    def test_route_can_start_from_current_gps_coordinates(self):
        response = build_chat_response(
            ChatRequest(
                message="How do I get to IT Hut?",
                user_location=Point(latitude=self.gate.latitude, longitude=self.gate.longitude),
            ),
            self.db,
        )
        self.assertEqual(response.map_action.type, "show_route")
        self.assertTrue(response.map_action.source_is_current)
        self.assertEqual(response.map_action.destination_id, self.it_hut.id)
        self.assertGreater(response.route.distance_meters, 0)

    def test_multi_stop_route_uses_existing_route_graph_for_each_leg(self):
        response = build_chat_response(
            ChatRequest(message="I want to visit Main Gate, Government Canteen and IT Hut"),
            self.db,
        )
        self.assertEqual(response.intent, "multi_stop_route")
        self.assertEqual(response.route.algorithm, "Dijkstra")
        self.assertEqual(len(response.map_action.location_ids), 3)

    def test_empty_chat_message_is_rejected_by_request_schema(self):
        with self.assertRaises(ValidationError):
            ChatRequest(message="")

    def test_chat_endpoint_returns_structured_response(self):
        response = chat(ChatRequest(message="Show all food places", conversation_id="endpoint-session"), self.db)
        self.assertEqual(response.conversation_id, "endpoint-session")
        self.assertEqual(response.map_action.type, "filter_category")
        self.assertEqual(response.intent, "category_search")

    def test_assistant_health_is_available_without_a_provider_key(self):
        with patch.dict("os.environ", {"AI_API_KEY": "", "AI_MODEL": ""}):
            self.assertEqual(assistant_health(), {"available": True, "mode": "local"})

    def test_provider_timeout_and_invalid_payload_fall_back_to_local_answer(self):
        with patch("services.response_provider.urlopen", side_effect=TimeoutError()):
            result = _request_provider("https://example.test/v1", "test-key", "test-model", "hi", {})
        self.assertIsNone(result)

        class BadResponse:
            def __enter__(self):
                return self

            def __exit__(self, *_):
                return False

            def read(self, _):
                return b"not json"

        response = build_chat_response(ChatRequest(message="hello"), self.db)
        with patch("services.response_provider._provider_config", return_value=("https://example.test/v1", "key", "model")):
            with patch("services.response_provider.urlopen", return_value=BadResponse()):
                answer = rephrase_answer(ChatRequest(message="hello"), response)
        self.assertEqual(answer, response.answer)

    def test_provider_intent_hint_is_structured_and_rejects_unknown_records(self):
        class JsonResponse:
            def __init__(self, data):
                self.data = data

            def __enter__(self):
                return self

            def __exit__(self, *_):
                return False

            def read(self, _):
                return json.dumps({"choices": [{"message": {"content": json.dumps(self.data)}}]}).encode()

        request = ChatRequest(message="Please guide me to the computer department")
        with patch("services.response_provider._provider_config", return_value=("https://example.test/v1", "key", "model")):
            with patch("services.response_provider.urlopen", return_value=JsonResponse({"intent": "find_location", "location_names": ["IT Hut"], "category": "Academic"})):
                hint = classify_intent(request, ["IT Hut"], ["Academic", "Food"])
            self.assertEqual(hint.intent, "find_location")
            self.assertEqual(hint.location_names, ["IT Hut"])
            with patch("services.response_provider.urlopen", return_value=JsonResponse({"intent": "find_location", "location_names": ["Imaginary Tower"], "category": None})):
                self.assertIsNone(classify_intent(request, ["IT Hut"], ["Academic", "Food"]))

    def test_provider_guided_route_still_uses_validated_records_and_dijkstra(self):
        hint = AIIntentHint(intent="get_directions", location_names=["Main Gate", "IT Hut"])
        with patch("services.campus_assistant.classify_intent", return_value=hint):
            response = build_chat_response(ChatRequest(message="Please guide me to IT Hut from Main Gate"), self.db)
        self.assertEqual(response.map_action.source_id, self.gate.id)
        self.assertEqual(response.map_action.destination_id, self.it_hut.id)
        self.assertEqual(response.route.algorithm, "Dijkstra")

    def test_unavailable_location_does_not_invent_database_record(self):
        response = build_chat_response(ChatRequest(message="Where is the Library?"), self.db)
        self.assertFalse(response.locations)
        self.assertIsNone(response.map_action)
        self.assertIn("couldn’t find", response.answer)
        self.assertEqual(len(self.db.scalars(select(Location)).all()), 4)


if __name__ == "__main__":
    unittest.main()
