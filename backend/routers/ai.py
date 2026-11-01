"""Natural-language campus assistant endpoint."""

import logging
import os

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database.database import get_db
from schemas.schemas import ChatRequest, ChatResponse
from services.campus_assistant import build_chat_response
from services.rate_limit import check_chat_rate_limit
from services.response_provider import has_provider_config, rephrase_answer

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/ai", tags=["AI campus assistant"])


@router.get("/health")
def assistant_health() -> dict[str, str | bool]:
    """Report API readiness; local chat works even when an LLM is not configured."""
    provider_ready = bool(os.getenv("AI_API_KEY", "").strip() and os.getenv("AI_MODEL", "").strip())
    return {"available": True, "mode": "provider-assisted" if provider_ready else "local"}


@router.post("/chat", response_model=ChatResponse, dependencies=[Depends(check_chat_rate_limit)])
def chat(payload: ChatRequest, db: Session = Depends(get_db)) -> ChatResponse:
    """Answer a campus question using safe database and route tools."""
    try:
        response = build_chat_response(payload, db)
        response.conversation_id = payload.conversation_id or response.conversation_id
        if not has_provider_config():
            response.answer = rephrase_answer(payload, response)
        return response
    except HTTPException:
        raise
    except Exception as error:
        logger.exception("Campus assistant request failed")
        raise HTTPException(
            status_code=503,
            detail="The campus assistant is temporarily unavailable. Please try again.",
        ) from error
