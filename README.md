# WayFinder – Campus Navigation Guide

WayFinder is a friendly campus navigation web app built for a college hackathon. Visitors can browse campus locations, search by name, filter categories, view an OpenStreetMap-based map, generate simple walking routes, and contact the team.

## Features

- Interactive Leaflet map with OpenStreetMap tiles, markers, popups, and route lines
- Search and category filtering for ten sample campus locations
- Location pages with image, opening hours, category, and coordinates
- Walking distance, estimated time, and written route guidance
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
| POST | `/route` | Route between `{ source, destination }` coordinates |
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
