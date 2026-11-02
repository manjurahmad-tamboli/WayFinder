import os
import re
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import SQLAlchemyError
from starlette.exceptions import HTTPException as StarletteHTTPException
from database.database import Base, engine
from routers import ai, contact, locations, routes
from seed import seed_database
from services.logging_utils import get_logger


logger = get_logger("api")
TECHNICAL_DETAIL = re.compile(r"(traceback|exception|sqlalchemy|sqlite|postgres|mysql|api[_ -]?key|password|secret|[a-z]:\\|/home/|/var/)", re.IGNORECASE)


def _error_body(code: str, message: str, **extra) -> dict:
    error = {"code": code, "message": message}
    error.update(extra)
    return {"detail": message, "error": error}


def _safe_http_message(exc: StarletteHTTPException) -> str:
    status_messages = {
        401: "Please sign in to continue.",
        403: "You do not have permission to complete this action.",
        404: "The requested location or page could not be found.",
        429: "Too many requests. Please wait a moment and try again.",
    }
    if exc.status_code in status_messages:
        return status_messages[exc.status_code]
    if 500 <= exc.status_code:
        return "WayFinder is temporarily unavailable. Please try again shortly."
    detail = exc.detail.strip() if isinstance(exc.detail, str) else ""
    if detail and len(detail) <= 240 and not TECHNICAL_DETAIL.search(detail):
        return detail
    if exc.status_code == 422:
        return "Please check the information and try again."
    return "The request could not be completed. Please try again."


@asynccontextmanager
async def lifespan(_: FastAPI):
    try:
        Base.metadata.create_all(bind=engine)
        seed_database()
    except SQLAlchemyError as error:
        logger.error(
            "Database initialization failed",
            extra={"event": "database_startup_error", "method": "STARTUP", "path": "/", "status_code": 500, "error_type": type(error).__name__},
        )
        raise
    yield


app = FastAPI(
    title="WayFinder API",
    version="1.0.0",
    lifespan=lifespan
)


@app.exception_handler(StarletteHTTPException)
async def handle_http_exception(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    message = _safe_http_message(exc)
    logger.warning(
        "HTTP request was rejected",
        extra={"event": "http_error", "method": request.method, "path": request.url.path, "status_code": exc.status_code},
    )
    return JSONResponse(
        status_code=exc.status_code,
        content=_error_body(f"http_{exc.status_code}", message),
        headers=exc.headers,
    )


@app.exception_handler(RequestValidationError)
async def handle_validation_exception(request: Request, exc: RequestValidationError) -> JSONResponse:
    fields = sorted({
        ".".join(str(part) for part in error.get("loc", ()) if part not in {"body", "query", "path", "header"})
        for error in exc.errors()
    } - {""})
    logger.warning(
        "Request validation failed",
        extra={"event": "validation_error", "method": request.method, "path": request.url.path, "status_code": 422},
    )
    message = "Please check the submitted information and try again."
    return JSONResponse(
        status_code=422,
        content=_error_body("validation_error", message, fields=fields),
    )


@app.exception_handler(SQLAlchemyError)
async def handle_database_exception(request: Request, exc: SQLAlchemyError) -> JSONResponse:
    logger.error(
        "Database operation failed",
        extra={"event": "database_error", "method": request.method, "path": request.url.path, "status_code": 500, "error_type": type(exc).__name__},
    )
    message = "WayFinder could not access the requested data. Please try again shortly."
    return JSONResponse(status_code=500, content=_error_body("database_error", message))


@app.exception_handler(Exception)
async def handle_unexpected_exception(request: Request, exc: Exception) -> JSONResponse:
    logger.error(
        "Unhandled request failure",
        extra={"event": "unhandled_error", "method": request.method, "path": request.url.path, "status_code": 500, "error_type": type(exc).__name__},
    )
    message = "Something went wrong. Please try again shortly."
    return JSONResponse(status_code=500, content=_error_body("internal_error", message))

app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/health", tags=["Health"])
def health_check() -> dict[str, str]:
    return {"status": "ok"}

allowed_origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "https://way-finder-nine.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(locations.router)
app.include_router(routes.router)
app.include_router(contact.router)
app.include_router(ai.router)
