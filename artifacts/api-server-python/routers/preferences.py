from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import SenderPreference
from schemas import SenderPreferenceIn, SenderPreferenceOut

router = APIRouter(tags=["preferences"])


@router.get("/preferences", response_model=List[SenderPreferenceOut])
def list_preferences(db: Session = Depends(get_db)):
    return db.query(SenderPreference).order_by(SenderPreference.sender_name).all()


@router.post("/preferences", response_model=SenderPreferenceOut)
def create_preference(pref: SenderPreferenceIn, db: Session = Depends(get_db)):
    existing = db.query(SenderPreference).filter(
        SenderPreference.sender_email == pref.sender_email
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Preference for this sender already exists")

    record = SenderPreference(**pref.model_dump())
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.put("/preferences/{pref_id}", response_model=SenderPreferenceOut)
def update_preference(pref_id: int, pref: SenderPreferenceIn, db: Session = Depends(get_db)):
    record = db.query(SenderPreference).filter(SenderPreference.id == pref_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Preference not found")

    for key, value in pref.model_dump().items():
        setattr(record, key, value)

    db.commit()
    db.refresh(record)
    return record


@router.delete("/preferences/{pref_id}")
def delete_preference(pref_id: int, db: Session = Depends(get_db)):
    record = db.query(SenderPreference).filter(SenderPreference.id == pref_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Preference not found")

    db.delete(record)
    db.commit()
    return {"message": "Deleted successfully"}
