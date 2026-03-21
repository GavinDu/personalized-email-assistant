from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Email, SenderPreference, ToneRule, EmailLog
from schemas import DraftRequest, DraftOut
from services.draft_generator import generate_draft

router = APIRouter(tags=["drafts"])


@router.post("/emails/{email_id}/draft", response_model=DraftOut)
def generate_email_draft(email_id: int, request: DraftRequest, db: Session = Depends(get_db)):
    email = db.query(Email).filter(Email.id == email_id).first()
    if not email:
        raise HTTPException(status_code=404, detail="Email not found")

    pref = db.query(SenderPreference).filter(
        SenderPreference.sender_email == email.sender_email
    ).first()

    importance = pref.importance if pref else "medium"
    tone = request.tone_override or (pref.default_tone if pref else "professional")

    active_rules = db.query(ToneRule).filter(ToneRule.is_active == True).all()
    tone_rule_values = [r.value for r in active_rules]

    past_logs = (
        db.query(EmailLog)
        .filter(EmailLog.user_action == "approved")
        .order_by(EmailLog.created_at.desc())
        .limit(5)
        .all()
    )
    similar_emails = []
    for log in past_logs:
        past_email = db.query(Email).filter(Email.id == log.email_id).first()
        if past_email:
            similar_emails.append({
                "subject": past_email.subject,
                "sender": past_email.sender_name,
                "reply": log.final_output or "",
                "tone": log.tone_used or "professional",
            })

    result = generate_draft(
        sender_name=email.sender_name,
        sender_email=email.sender_email,
        subject=email.subject,
        body=email.body,
        tone=tone,
        importance=importance,
        tone_rules=tone_rule_values,
        similar_emails=similar_emails,
    )

    return DraftOut(
        email_id=email_id,
        draft=result["draft"],
        tone_used=result["tone_used"],
        style_notes=result["style_notes"],
        similar_past_emails=result["similar_past_emails"],
    )
