from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import EmailLog
from schemas import FeedbackIn, FeedbackOut

router = APIRouter(tags=["feedback"])

REWARD_MAP = {
    "approved": 1.0,
    "edited": -0.3,
    "discarded": -1.0,
}


def compute_reward(user_action: str, edit_distance: int = 0) -> float:
    base = REWARD_MAP.get(user_action, 0.0)
    if user_action == "edited" and edit_distance > 0:
        extra_penalty = min(0.7, edit_distance / 500)
        base = base - extra_penalty
    return round(base, 3)


@router.post("/emails/{email_id}/feedback", response_model=FeedbackOut)
def submit_feedback(email_id: int, feedback: FeedbackIn, db: Session = Depends(get_db)):
    from models import Email
    email = db.query(Email).filter(Email.id == email_id).first()
    if not email:
        raise HTTPException(status_code=404, detail="Email not found")

    reward = compute_reward(feedback.user_action, feedback.edit_distance or 0)

    log = EmailLog(
        email_id=email_id,
        model_output={"tone": feedback.tone_used},
        user_action=feedback.user_action,
        final_output=feedback.final_output,
        reward=reward,
        tone_used=feedback.tone_used,
        edit_distance=feedback.edit_distance or 0,
    )
    db.add(log)
    db.commit()
    db.refresh(log)

    return log


@router.get("/feedback", response_model=List[FeedbackOut])
def list_feedback(limit: int = 50, db: Session = Depends(get_db)):
    logs = db.query(EmailLog).order_by(EmailLog.created_at.desc()).limit(limit).all()
    return logs
