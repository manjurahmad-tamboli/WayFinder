# WayFinder – Campus Navigation Guide

WayFinder is a friendly campus navigation web app built for a college hackathon. Visitors can browse campus locations, search by name, filter categories, view an OpenStreetMap-based map, generate walking routes, and contact the team.

## Features

- Interactive Leaflet map with OpenStreetMap tiles, markers, popups, and route lines
- Shared, debounced autocomplete across actual location names, descriptions, categories and configured generic aliases
- Nearby discovery for any saved location/category, using browser GPS on request or a manually selected campus starting point, with Haversine distances
- Search suggestions with category matches, keyboard selection, highlighted terms, map focus and route-planning actions
- Location pages with image, opening hours, category, and coordinates
- Dijkstra shortest-path routing on a weighted campus walkway graph, including route geometry, estimated distance and time, and turn-by-turn guidance
- Toast notifications for search, navigation, feedback, and errors
- Floating WayFinder AI assistant for natural-language campus search, details, category browsing, recommendations, nearby places, and one- or multi-stop directions
- Structured AI map actions that reuse the existing Leaflet map, category filters, markers, popups, and Dijkstra route planner
- Client-side conversation context for follow-up questions; geolocation is requested only after a user chooses “Use my location,” with a campus-place fallback
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
| GET | `/locations/autocomplete?q=can&limit=8` | Search suggestions; returns matching locations and database-backed categories within the result limit |
| GET | `/locations/search?q=computer&category=Academic` | Ranked search across names, categories, descriptions and configured aliases |
| GET | `/locations/nearby?latitude=16.8454&longitude=74.6017&q=hostel&limit=10` | Real saved locations sorted by Haversine distance; optional query and category filters |
| GET | `/locations/{id}` | Get one location |
| GET | `/categories` | List categories |
| POST | `/search` | Search: `{ "query": "Library", "category": null }` |
| POST | `/route` | Dijkstra route between `{ source, destination }` coordinates, optionally with `source_name` and `destination_name`; returns route points, distance, estimated walking minutes, directions, algorithm, and a route-network note |
| POST | `/contact` | Store a name, email, and message |
| GET | `/api/ai/health` | Assistant readiness and local/provider-assisted mode |
| POST | `/api/ai/chat` | Natural-language campus assistant; returns answer, intent, locations, suggestions, conversation ID, optional route details, and a structured `map_action` |

Example assistant request:

```json
{
  "message": "How do I get to IT Hut from Main Gate?",
  "conversation_id": "session_123",
  "conversation_history": [],
  "user_location": null,
  "user_location_id": null
}
```

For follow-up questions, send up to 12 validated turns in `conversation_history` and reuse the returned `conversation_id`. The initial version keeps this history in the browser session and does not persist chats. Nearby search accepts GPS coordinates in `user_location` or a campus `user_location_id`. Available map actions are `show_location`, `show_multiple_locations`, `filter_category`, `show_route`, `clear_selection`, and `request_location`.

The chat endpoint allows 30 requests per client per minute per backend process. It works without model credentials using local intent matching and approved campus-data tools. An optional OpenAI-compatible model can interpret more natural phrasing through a constrained JSON intent hint; the backend validates every selected location and category before running tools. The model cannot execute SQL or change campus data. Provider errors, timeouts and malformed replies fall back to local intent matching.

The existing campus database remains the source of truth. The current seed data does not include a Library or Administration Office, so the assistant reports those as unavailable instead of inventing a location; add verified campus records before expecting those searches to resolve.

## Project structure

```text
WayFinder/
├── frontend/
│   └── src/{components,contexts,hooks,pages,services}
├── backend/
│   ├── database/  models/  routers/  schemas/  services/
│   ├── test_location_search.py
│   ├── test_ai_assistant.py
│   ├── main.py
│   └── seed.py
├── .env.example
└── README.md
```

The route graph in `backend/routers/routes.py` identifies the Main Gate entrance and the modeled branching junctions, validates graph references, supports surveyed polyline geometry, and skips any edge marked closed, restricted, or non-public. Unlisted edges default to open/public. No closure or restricted-path entries are currently configured because none could be confirmed from the available campus map information; do not add them without checking with campus staff. The current seed links and building access anchors are still provisional and are shown as such in each route response. Add measured path vertices to `WALKWAY_EDGE_GEOMETRY` and confirmed access rules to `WALKWAY_EDGE_POLICIES` after a campus walk-through. Walking time is estimated at 80 metres per minute.

For the campus survey, compare the graph with the [official WCE virtual campus tour](https://walchandsangli.ac.in/campus-life/virtual-campus-tour/) and its [infrastructure page](https://walchandsangli.ac.in/campus-life/infrastructure/), then confirm gate/building entrance points and temporary closures with campus staff. OpenStreetMap can provide additional volunteered geographic context, but verify its paths on site before treating them as walkable or public.

## Deployment

### Vercel (frontend)

Import the repository, set the root directory to `frontend`, and add `VITE_API_BASE_URL` with the public Render API URL. `frontend/vercel.json` enables React Router route fallbacks. The AI panel uses this same backend URL; never put a provider secret in a frontend variable.

### Render (backend)

Create a Blueprint from the repository or create a Python Web Service using `backend/render.yaml`: root directory `backend`, build command `pip install -r requirements.txt`, and start command `uvicorn main:app --host 0.0.0.0 --port $PORT`. Set CORS origins in `backend/main.py` to include the deployed frontend domain. WayFinder AI works without a paid API key. To enable optional model-assisted intent understanding, set these backend-only variables (see `backend/.env.example`):

```text
AI_API_BASE_URL=https://api.openai.com/v1
AI_API_KEY=<secret>
AI_MODEL=<a model available to your account>
```

`AI_API_BASE_URL` can point to another OpenAI-compatible chat-completions endpoint. The key remains on the backend. Provider requests have a six-second timeout and failures fall back to local responses.

## Screenshots

Add screenshots here after running the application:

- Home page and interactive campus map
- Navigation route view
- Location details view
