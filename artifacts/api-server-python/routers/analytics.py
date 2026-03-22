from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, cast, Date
from database import get_db
from models import EmailLog, Email
from schemas import AnalyticsOut, RewardTrendPoint, ToneDistributionItem, ActionBreakdownItem, BanditState, HistoryItem, ClassificationBreakdownItem, RLBufferStats, RLModelBreakdownItem
from services.experience_buffer import get_buffer_stats
from services.rl_classifier import SUPPORTED_MODELS
from typing import List
import math

router = APIRouter(tags=["analytics"])


@router.get("/analytics", response_model=AnalyticsOut)
def get_analytics(db: Session = Depends(get_db)):
    reward_rows = (
        db.query(
            cast(EmailLog.created_at, Date).label("date"),
            func.avg(EmailLog.reward).label("avg_reward"),
            func.count(EmailLog.id).label("count"),
        )
        .group_by(cast(EmailLog.created_at, Date))
        .order_by(cast(EmailLog.created_at, Date).asc())
        .limit(30)
        .all()
    )
    reward_trend = [
        RewardTrendPoint(
            date=str(row.date),
            avg_reward=round(row.avg_reward, 3),
            count=row.count,
        )
        for row in reward_rows
    ]

    tone_rows = (
        db.query(
            EmailLog.tone_used,
            func.count(EmailLog.id).label("count"),
            func.avg(EmailLog.reward).label("avg_reward"),
        )
        .filter(EmailLog.tone_used.isnot(None))
        .group_by(EmailLog.tone_used)
        .all()
    )
    tone_distribution = [
        ToneDistributionItem(
            tone=row.tone_used or "unknown",
            count=row.count,
            avg_reward=round(row.avg_reward, 3),
        )
        for row in tone_rows
    ]

    action_rows = (
        db.query(
            EmailLog.user_action,
            func.count(EmailLog.id).label("count"),
        )
        .group_by(EmailLog.user_action)
        .all()
    )
    total_actions = sum(r.count for r in action_rows)
    action_breakdown = [
        ActionBreakdownItem(
            action=row.user_action,
            count=row.count,
            percentage=round((row.count / total_actions * 100) if total_actions > 0 else 0, 1),
        )
        for row in action_rows
    ]

    bandit_state = []
    for item in tone_distribution:
        exploration_bonus = 1.0 / math.sqrt(max(item.count, 1))
        expected = item.avg_reward + exploration_bonus
        bandit_state.append(
            BanditState(
                tone=item.tone,
                avg_reward=item.avg_reward,
                count=item.count,
                expected_reward=round(expected, 3),
            )
        )
    bandit_state.sort(key=lambda x: x.expected_reward, reverse=True)

    priority_rows = (
        db.query(Email.priority, func.count(Email.id).label("count"))
        .group_by(Email.priority)
        .all()
    )
    total_emails = sum(r.count for r in priority_rows)
    priority_breakdown = [
        ClassificationBreakdownItem(
            label=row.priority or "unknown",
            count=row.count,
            percentage=round((row.count / total_emails * 100) if total_emails > 0 else 0, 1),
        )
        for row in sorted(priority_rows, key=lambda r: r.count, reverse=True)
    ]

    intent_rows = (
        db.query(Email.intent, func.count(Email.id).label("count"))
        .group_by(Email.intent)
        .all()
    )
    intent_breakdown = [
        ClassificationBreakdownItem(
            label=row.intent or "unknown",
            count=row.count,
            percentage=round((row.count / total_emails * 100) if total_emails > 0 else 0, 1),
        )
        for row in sorted(intent_rows, key=lambda r: r.count, reverse=True)
    ]

    total = db.query(func.count(EmailLog.id)).scalar() or 0
    avg_reward_val = db.query(func.avg(EmailLog.reward)).scalar()
    avg_reward = round(avg_reward_val, 3) if avg_reward_val is not None else 0.0

    # RL buffer stats
    buffer_stats_raw = get_buffer_stats(db)
    rl_buffer = RLBufferStats(**buffer_stats_raw)

    # Per-model breakdown from emails table
    rl_rows = (
        db.query(
            Email.rl_model_key,
            Email.rl_model,
            func.count(Email.id),
            func.avg(Email.classification_confidence),
        )
        .filter(Email.rl_model_key.isnot(None))
        .group_by(Email.rl_model_key, Email.rl_model)
        .all()
    )
    rl_model_breakdown = [
        RLModelBreakdownItem(
            model_key=row[0] or "unknown",
            model_id=row[1] or SUPPORTED_MODELS.get(row[0], "unknown"),
            count=row[2],
            avg_confidence=round(float(row[3]), 3) if row[3] else 0.0,
        )
        for row in rl_rows
    ]

    return AnalyticsOut(
        reward_trend=reward_trend,
        tone_distribution=tone_distribution,
        action_breakdown=action_breakdown,
        bandit_state=bandit_state,
        priority_breakdown=priority_breakdown,
        intent_breakdown=intent_breakdown,
        rl_buffer=rl_buffer,
        rl_model_breakdown=rl_model_breakdown,
        total_emails_processed=total,
        avg_overall_reward=avg_reward,
    )


@router.get("/history", response_model=List[HistoryItem])
def get_history(limit: int = 50, db: Session = Depends(get_db)):
    rows = (
        db.query(EmailLog, Email)
        .join(Email, EmailLog.email_id == Email.id)
        .order_by(EmailLog.created_at.desc())
        .limit(limit)
        .all()
    )
    result = []
    for log, email in rows:
        result.append(HistoryItem(
            id=log.id,
            email_id=log.email_id,
            user_action=log.user_action,
            reward=log.reward,
            tone_used=log.tone_used,
            edit_distance=log.edit_distance,
            created_at=log.created_at,
            email_subject=email.subject,
            email_sender=email.sender_name,
        ))
    return result
