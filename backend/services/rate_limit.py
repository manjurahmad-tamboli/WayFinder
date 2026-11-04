"""Small per-process sliding-window limiter for the public assistant endpoint."""

from collections import deque
from threading import Lock
from time import monotonic

from fastapi import HTTPException, Request

_WINDOW_SECONDS = 60
_MAX_REQUESTS = 30
_MAX_CLIENTS = 2000
_requests_by_client: dict[str, deque[float]] = {}
_lock = Lock()


def check_chat_rate_limit(request: Request) -> None:
    client_key = request.client.host if request.client else "unknown"
    now = monotonic()
    with _lock:
        history = _requests_by_client.setdefault(client_key, deque())
        while history and now - history[0] >= _WINDOW_SECONDS:
            history.popleft()
        if len(history) >= _MAX_REQUESTS:
            raise HTTPException(status_code=429, detail="Too many assistant requests. Please wait a minute and try again.")
        history.append(now)
        if len(_requests_by_client) > _MAX_CLIENTS:
            stale_keys = [key for key, values in _requests_by_client.items() if not values or now - values[-1] >= _WINDOW_SECONDS]
            for key in stale_keys[:500]:
                _requests_by_client.pop(key, None)
