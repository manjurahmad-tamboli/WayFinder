# WayFinder – Campus Navigation Guide

WayFinder is a friendly campus navigation web app built for a college hackathon. Visitors can browse campus locations, search by name, filter categories, view an OpenStreetMap-based map, generate walking routes, and contact the team.

## Features

- Interactive Leaflet map with OpenStreetMap tiles, markers, popups, and route lines
- Search and category filtering for ten sample campus locations
- Location pages with image, opening hours, category, and coordinates
- Dijkstra shortest-path routing on a weighted campus walkway graph, including route geometry, estimated distance and time, and turn-by-turn guidance
- Toast notifications for search, navigation, feedback, and errors
- Contact form persisted to SQLite
- Responsive React interface, custom 404 page, and API health endpoint

## Technology

Frontend: React, Vite, Tailwind CSS, React Router, Axios, React Leaflet, Leaflet

Backend: Python, FastAPI, SQLAlchemy, SQLite

## Run locally

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

The first startup creates `backend/database.db` and seeds the locations. API documentation is available at `http://localhost:8000/docs`.

### Frontend

```bash
cd frontend
copy .env.example .env
npm install
npm run dev
```

Open the printed Vite URL (normally `http://localhost:5173`). The frontend uses `VITE_API_BASE_URL`, which defaults to `http://localhost:8000` when unset.

## API

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/health` | API status |
| GET | `/locations` | List locations; optional `category` query |
| GET | `/locations/{id}` | Get one location |
| GET | `/categories` | List categories |
| POST | `/search` | Search: `{ "query": "Library", "category": null }` |
| POST | `/route` | Dijkstra route between `{ source, destination }` coordinates, optionally with `source_name` and `destination_name`; returns route points, distance, estimated walking minutes, directions, algorithm, and a route-network note |
| POST | `/contact` | Store a name, email, and message |

## Project structure

```text
WayFinder/
├── frontend/
│   └── src/{components,hooks,pages,services}
├── backend/
│   ├── database/  models/  routers/  schemas/
│   ├── main.py
│   └── seed.py
├── .env.example
└── README.md
```

The route graph in `backend/routers/routes.py` identifies the Main Gate entrance and the modeled branching junctions, validates graph references, supports surveyed polyline geometry, and skips any edge marked closed, restricted, or non-public. Unlisted edges default to open/public. No closure or restricted-path entries are currently configured because none could be confirmed from the available campus map information; do not add them without checking with campus staff. The current seed links and building access anchors are still provisional and are shown as such in each route response. Add measured path vertices to `WALKWAY_EDGE_GEOMETRY` and confirmed access rules to `WALKWAY_EDGE_POLICIES` after a campus walk-through. Walking time is estimated at 80 metres per minute.

For the campus survey, compare the graph with the [official WCE virtual campus tour](https://walchandsangli.ac.in/campus-life/virtual-campus-tour/) and its [infrastructure page](https://walchandsangli.ac.in/campus-life/infrastructure/), then confirm gate/building entrance points and temporary closures with campus staff. OpenStreetMap can provide additional volunteered geographic context, but verify its paths on site before treating them as walkable or public.

## Deployment

### Vercel (frontend)

Import the repository, set the root directory to `frontend`, and add `VITE_API_BASE_URL` with the public Render API URL. `frontend/vercel.json` enables React Router route fallbacks.

### Render (backend)

Create a Blueprint from the repository or create a Python Web Service using `backend/render.yaml`: root directory `backend`, build command `pip install -r requirements.txt`, and start command `uvicorn main:app --host 0.0.0.0 --port $PORT`. Set CORS origins in `backend/main.py` to include the deployed frontend domain.

## Screenshots

Add screenshots here after running the application:

- Home page and interactive campus map
- Navigation route view
- Location details view
