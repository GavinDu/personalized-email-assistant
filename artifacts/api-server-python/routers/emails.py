from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from database import get_db
from models import Email
from schemas import EmailOut, EmailList
from services.classifier import classify_email
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(tags=["emails"])


class EmailCreateIn(BaseModel):
    subject: str
    sender_name: str
    sender_email: str
    body: str
    received_at: Optional[datetime] = None


@router.post("/emails", response_model=EmailOut, status_code=201)
def create_email(payload: EmailCreateIn, db: Session = Depends(get_db)):
    classification = classify_email(
        sender_name=payload.sender_name,
        sender_email=payload.sender_email,
        subject=payload.subject,
        body=payload.body,
    )
    email = Email(
        subject=payload.subject,
        sender_name=payload.sender_name,
        sender_email=payload.sender_email,
        body=payload.body,
        received_at=payload.received_at or datetime.now(),
        priority=classification.get("priority", "medium"),
        intent=classification.get("intent", "unknown"),
        recommended_action=classification.get("recommended_action", "reply"),
        classification_confidence=classification.get("confidence", 0.5),
        classification_notes=classification.get("notes", ""),
    )
    db.add(email)
    db.commit()
    db.refresh(email)
    return email


@router.post("/emails/{email_id}/classify", response_model=EmailOut)
def reclassify_email(email_id: int, db: Session = Depends(get_db)):
    email = db.query(Email).filter(Email.id == email_id).first()
    if not email:
        raise HTTPException(status_code=404, detail="Email not found")

    classification = classify_email(
        sender_name=email.sender_name,
        sender_email=email.sender_email,
        subject=email.subject,
        body=email.body,
    )
    email.priority = classification.get("priority", email.priority)
    email.intent = classification.get("intent", email.intent)
    email.recommended_action = classification.get("recommended_action", email.recommended_action)
    email.classification_confidence = classification.get("confidence", email.classification_confidence)
    email.classification_notes = classification.get("notes", email.classification_notes)

    db.commit()
    db.refresh(email)
    return email


@router.get("/emails", response_model=EmailList)
def list_emails(
    priority: Optional[str] = Query(None),
    intent: Optional[str] = Query(None),
    action: Optional[str] = Query(None),
    is_read: Optional[bool] = Query(None),
    limit: int = Query(50, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    query = db.query(Email)

    if priority:
        query = query.filter(Email.priority == priority)
    if intent:
        query = query.filter(Email.intent == intent)
    if action:
        query = query.filter(Email.recommended_action == action)
    if is_read is not None:
        query = query.filter(Email.is_read == is_read)

    total = query.count()
    emails = query.order_by(Email.received_at.desc()).offset(offset).limit(limit).all()

    return EmailList(emails=emails, total=total)


@router.get("/emails/{email_id}", response_model=EmailOut)
def get_email(email_id: int, db: Session = Depends(get_db)):
    email = db.query(Email).filter(Email.id == email_id).first()
    if not email:
        raise HTTPException(status_code=404, detail="Email not found")

    if not email.is_read:
        email.is_read = True
        db.commit()
        db.refresh(email)

    return email
