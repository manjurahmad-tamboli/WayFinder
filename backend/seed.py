from sqlalchemy import select
from database.database import SessionLocal
from sqlalchemy import delete
from models.models import Category, Location

SEED_LOCATIONS = [
    ("Main Gate", "Facilities", 16.845935, 74.602656, "Main Entrance", "main_gate.jpeg", "Open 24 Hours"),
    ("IT Hut", "Academic", 16.845548, 74.601036, "Computer Lab", "it_hut.jpeg", "9 AM - 5 PM"),
    ("Department of Electrical Engineering", "Academic", 16.845055, 74.601484, "Electrical Department", "ee.jpeg", "9 AM - 5 PM"),
    ("Cyber Hostel", "Hostel", 16.845342, 74.602194, "Cyber Hostel", "cyber_hostel.jpg", "24 Hours"),
    ("Government Canteen", "Food", 16.843346, 74.601883, "College Canteen", "gov_canteen.jpeg", "8 AM - 8 PM"),
    ("Gymkhana", "Sports", 16.843695, 74.601527, "Sports Complex", "gymkhana.jpeg", "6 AM - 9 PM"),
    ("Exam Center", "Academic", 16.843905, 74.602320, "Exam Hall", "exam_center.jpeg", "9 AM - 5 PM"),
    ("Girls Hostel Mess", "Food", 16.845021, 74.604198, "Mess", "girls_hostel_mess.jpeg", "8 AM - 8 PM"),
    ("Walchand Hostel", "Hostel", 16.844085, 74.603557, "Boys Hostel", "walchand_hostel.jpeg", "24 Hours"),
    ("D1 Block", "Academic", 16.845186, 74.603356, "Department Block", "d1_block.jpeg", "9 AM - 5 PM"),
    ("D2 Block", "Academic", 16.844695, 74.603254, "Department Block", "d2_block.jpeg", "9 AM - 5 PM"),
    ("Running Track", "Sports", 16.842761, 74.600907, "Athletic Track", "running_track.jpeg", "6 AM - 9 PM"),
    ("Open Theatre", "Facilities", 16.844575, 74.600607, "Events Area", "open_theater.jpeg", "Open"),
    ("Faculty Rooms", "Academic", 16.844847, 74.600666, "Faculty Offices", "faculty_room.jpeg", "9 AM - 5 PM"),
    ("Class Room 8", "Academic", 16.844115, 74.601261, "Lecture Hall", "classroom8.jpeg", "9 AM - 5 PM"),
    ("Parking", "Facilities", 16.845892, 74.601999, "Vehicle Parking", "parking.jpeg", "Open"),
    ("Main CCF", "Academic", 16.845974, 74.600427, "Computer Center", "main_ccf.jpeg", "9 AM - 5 PM"),
    ("Engineering Statue", "Landmark", 16.845815, 74.601301, "Campus Landmark", "engine_statue.jpeg", "Always Open"),
]

def seed_database():
    db = SessionLocal()

    try:
        # Delete old data
        db.execute(delete(Location))
        db.execute(delete(Category))
        db.commit()

        categories = sorted(set(location[1] for location in SEED_LOCATIONS))

        for category in categories:
            db.add(Category(name=category))

        db.commit()

        # Insert all locations
        for (
            name,
            category,
            latitude,
            longitude,
            description,
            image,
            opening_hours,
        ) in SEED_LOCATIONS:

            db.add(
                Location(
                    name=name,
                    category=category,
                    latitude=latitude,
                    longitude=longitude,
                    description=description,
                    image=image,
                    opening_hours=opening_hours,
                )
            )

        db.commit()

    finally:
        db.close()