from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import ToneRule
from schemas import ToneRuleIn, ToneRuleOut

router = APIRouter(tags=["tone-rules"])


@router.get("/tone-rules", response_model=List[ToneRuleOut])
def list_tone_rules(db: Session = Depends(get_db)):
    return db.query(ToneRule).order_by(ToneRule.rule_type, ToneRule.name).all()


@router.post("/tone-rules", response_model=ToneRuleOut)
def create_tone_rule(rule: ToneRuleIn, db: Session = Depends(get_db)):
    record = ToneRule(**rule.model_dump())
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.put("/tone-rules/{rule_id}", response_model=ToneRuleOut)
def update_tone_rule(rule_id: int, rule: ToneRuleIn, db: Session = Depends(get_db)):
    record = db.query(ToneRule).filter(ToneRule.id == rule_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Tone rule not found")

    for key, value in rule.model_dump().items():
        setattr(record, key, value)

    db.commit()
    db.refresh(record)
    return record


@router.delete("/tone-rules/{rule_id}")
def delete_tone_rule(rule_id: int, db: Session = Depends(get_db)):
    record = db.query(ToneRule).filter(ToneRule.id == rule_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Tone rule not found")

    db.delete(record)
    db.commit()
    return {"message": "Deleted successfully"}
