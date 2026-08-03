from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from database.database import get_db
from models import ContactMessage
from schemas.schemas import ContactCreate, ContactOut

router = APIRouter(tags=["Contact"])


@router.post("/contact", response_model=ContactOut, status_code=status.HTTP_201_CREATED)
def create_contact(payload: ContactCreate, db: Session = Depends(get_db)):
    contact = ContactMessage(**payload.model_dump())
    db.add(contact)
    db.commit()
    db.refresh(contact)
    return contact
