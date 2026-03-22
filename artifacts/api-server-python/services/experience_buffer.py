"""
Experience Replay Buffer for RL-enhanced classification.

Manages the pool of past email classification experiences weighted by user reward.
High-reward (approved) experiences become positive few-shot examples.
Low-reward (discarded/edited) experiences become negative learning signals.
"""

from sqlalchemy.orm import Session
from sqlalchemy import func
from models import EmailLog, Email
from typing import List, Dict, Any


def get_positive_experiences(db: Session, n: int = 4) -> List[Dict[str, Any]]:
    """Retrieve top-N high-reward experiences for few-shot positive examples."""
    rows = (
        db.query(EmailLog, Email)
        .join(Email, EmailLog.email_id == Email.id)
        .filter(EmailLog.reward >= 0.5)
        .order_by(EmailLog.reward.desc(), EmailLog.created_at.desc())
        .limit(n)
        .all()
    )
    return [
        {
            "subject": email.subject,
            "sender_name": email.sender_name,
            "sender_email": email.sender_email,
            "body_snippet": email.body[:300],
            "priority": email.priority,
            "intent": email.intent,
            "recommended_action": email.recommended_action,
            "reward": log.reward,
            "user_action": log.user_action,
        }
        for log, email in rows
    ]


def get_negative_experiences(db: Session, n: int = 2) -> List[Dict[str, Any]]:
    """Retrieve top-N low-reward experiences for contrastive negative examples."""
    rows = (
        db.query(EmailLog, Email)
        .join(Email, EmailLog.email_id == Email.id)
        .filter(EmailLog.reward < -0.5)
        .order_by(EmailLog.reward.asc(), EmailLog.created_at.desc())
        .limit(n)
        .all()
    )
    return [
        {
            "subject": email.subject,
            "sender_name": email.sender_name,
            "body_snippet": email.body[:200],
            "priority": email.priority,
            "intent": email.intent,
            "recommended_action": email.recommended_action,
            "reward": log.reward,
            "user_action": log.user_action,
        }
        for log, email in rows
    ]


def get_buffer_stats(db: Session) -> Dict[str, Any]:
    """Compute buffer health metrics for the analytics dashboard."""
    total = db.query(func.count(EmailLog.id)).scalar() or 0
    positive = db.query(func.count(EmailLog.id)).filter(EmailLog.reward >= 0.5).scalar() or 0
    negative = db.query(func.count(EmailLog.id)).filter(EmailLog.reward < -0.5).scalar() or 0
    avg_reward = db.query(func.avg(EmailLog.reward)).scalar()
    avg_reward = round(float(avg_reward), 3) if avg_reward is not None else 0.0

    # Rolling window: last 10 experiences (subquery required for PostgreSQL GROUP BY rules)
    recent_ids = [r[0] for r in db.query(EmailLog.id).order_by(EmailLog.created_at.desc()).limit(10).all()]
    if recent_ids:
        recent = db.query(func.avg(EmailLog.reward)).filter(EmailLog.id.in_(recent_ids)).scalar()
        recent_avg = round(float(recent), 3) if recent is not None else 0.0
    else:
        recent_avg = 0.0

    return {
        "total_experiences": total,
        "positive_experiences": positive,
        "negative_experiences": negative,
        "neutral_experiences": total - positive - negative,
        "positive_ratio": round(positive / total, 3) if total > 0 else 0.0,
        "avg_reward": avg_reward,
        "recent_avg_reward": recent_avg,
        "learning_active": total >= 3,
    }
