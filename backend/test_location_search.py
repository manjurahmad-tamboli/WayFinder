import unittest

from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from database.database import Base
from models import Category, Location
from routers.locations import autocomplete_locations, get_nearby_locations, search_campus
from schemas.schemas import LocationSearchOut, NearbyLocationOut
from services.campus_assistant import _search_locations
from services.location_search import (
    category_matches_query,
    find_nearby_locations,
    search_campus_locations,
)


class UniversalLocationSearchTests(unittest.TestCase):
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
        for name in ("Academic", "Facilities", "Food", "Hostel", "Landmark", "Sports", "Arts & Culture"):
            self.db.add(Category(name=name))
        self.db.flush()
        self.db.add_all([
            Location(name="IT Hut", category="Academic", latitude=16.8455, longitude=74.6010, description="Computer Lab", image="it.jpg", opening_hours="9 AM - 5 PM"),
            Location(name="Main CCF", category="Academic", latitude=16.8460, longitude=74.6004, description="Computer Center", image="ccf.jpg", opening_hours="9 AM - 5 PM"),
            Location(name="Government Canteen", category="Food", latitude=16.8433, longitude=74.6018, description="College Canteen", image="canteen.jpg", opening_hours="8 AM - 8 PM"),
            Location(name="Girls Hostel Mess", category="Food", latitude=16.8450, longitude=74.6042, description="Mess", image="mess.jpg", opening_hours="8 AM - 8 PM"),
            Location(name="Cyber Hostel", category="Hostel", latitude=16.8453, longitude=74.6022, description="Student residence", image="hostel.jpg", opening_hours="24 Hours"),
            Location(name="Main Gate", category="Facilities", latitude=16.8459, longitude=74.6026, description="Main Entrance", image="gate.jpg", opening_hours="Open 24 Hours"),
            Location(name="Open Theatre", category="Facilities", latitude=16.8445, longitude=74.6006, description="Events Area", image="theatre.jpg", opening_hours="Open"),
            Location(name="Parking", category="Facilities", latitude=16.8458, longitude=74.6020, description="Vehicle Parking", image="parking.jpg", opening_hours="Open"),
            Location(name="Art Studio", category="Arts & Culture", latitude=16.8447, longitude=74.6007, description="Student arts space", image="arts.jpg", opening_hours="9 AM - 5 PM"),
        ])
        self.db.commit()

    def tearDown(self):
        self.db.close()

    def names(self, query, **kwargs):
        locations, _ = search_campus_locations(self.db, query, **kwargs)
        return {item.name for item in locations}

    def test_partial_canteen_keyword_matches_real_food_records(self):
        self.assertEqual(
            self.names("can"),
            {"Government Canteen", "Girls Hostel Mess"},
        )

    def test_computer_and_lab_aliases_search_actual_descriptions(self):
        self.assertEqual(self.names("comp"), {"IT Hut", "Main CCF"})
        self.assertEqual(self.names("lab"), {"IT Hut"})
        self.assertEqual({item.name for item in _search_locations(self.db, "Computer Department")}, {"IT Hut", "Main CCF"})

    def test_short_prefixes_do_not_match_unrelated_substrings(self):
        self.assertEqual(self.names("par"), {"Parking"})
        self.assertEqual(self.names("fac"), {"Main Gate", "Open Theatre", "Parking"})

    def test_category_search_returns_dynamic_category_and_all_its_records(self):
        matches, categories = search_campus_locations(self.db, "food")
        self.assertEqual({item.name for item in matches}, {"Government Canteen", "Girls Hostel Mess"})
        self.assertEqual(categories[0]["name"], "Food")
        self.assertEqual(categories[0]["location_count"], 2)

    def test_categories_added_to_database_are_searchable(self):
        matches, categories = search_campus_locations(self.db, "arts")
        self.assertEqual({item.name for item in matches}, {"Art Studio"})
        self.assertEqual(categories[0]["name"], "Arts & Culture")
        self.assertTrue(category_matches_query("show all arts places", "Arts & Culture"))

    def test_human_readable_aliases_and_category_filter_are_normalized(self):
        self.assertEqual(self.names("find nearby hostels"), {"Cyber Hostel"})
        self.assertEqual(self.names("comp", category=" academic "), {"IT Hut", "Main CCF"})
        self.assertEqual(self.names("library"), set())

    def test_nearby_search_sorts_by_haversine_distance(self):
        nearby = find_nearby_locations(self.db, 16.8432, 74.6018, query="food")
        self.assertEqual(nearby[0][0].name, "Government Canteen")
        self.assertLess(nearby[0][1], nearby[1][1])
        hostel = find_nearby_locations(self.db, 16.8454, 74.6020, category="hostel")
        self.assertEqual([item.name for item, _ in hostel], ["Cyber Hostel"])

    def test_search_and_nearby_api_shapes_match_response_schemas(self):
        autocomplete = LocationSearchOut.model_validate(autocomplete_locations(q="can", limit=8, db=self.db))
        self.assertIn("Government Canteen", {item.name for item in autocomplete.locations})
        self.assertLessEqual(len(autocomplete.locations) + len(autocomplete.categories), 8)
        full_search = LocationSearchOut.model_validate(search_campus(q="food", category=None, limit=12, db=self.db))
        self.assertEqual(full_search.categories[0].name, "Food")
        nearby = get_nearby_locations(
            latitude=16.8432,
            longitude=74.6018,
            q="food",
            category=None,
            limit=10,
            db=self.db,
        )
        records = [NearbyLocationOut.model_validate(item) for item in nearby]
        self.assertGreaterEqual(records[0].distance_meters, 0)
        self.assertEqual(records[0].name, "Government Canteen")


if __name__ == "__main__":
    unittest.main()
