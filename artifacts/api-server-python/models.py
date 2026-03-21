from sqlalchemy import Column, Integer, String, Text, Float, Boolean, DateTime, JSON
from sqlalchemy.sql import func
from database import Base


class Email(Base):
    __tablename__ = "emails"

    id = Column(Integer, primary_key=True, index=True)
    subject = Column(String(500), nullable=False)
    sender_name = Column(String(200), nullable=False)
    sender_email = Column(String(200), nullable=False)
    body = Column(Text, nullable=False)
    received_at = Column(DateTime(timezone=True), server_default=func.now())
    is_read = Column(Boolean, default=False)

    priority = Column(String(20), default="medium")
    intent = Column(String(50), default="unknown")
    recommended_action = Column(String(50), default="reply")
    classification_confidence = Column(Float, default=0.0)
    classification_notes = Column(Text, default="")

    created_at = Column(DateTime(timezone=True), server_default=func.now())


class EmailLog(Base):
    __tablename__ = "email_logs"

    id = Column(Integer, primary_key=True, index=True)
    email_id = Column(Integer, nullable=False, index=True)
    model_output = Column(JSON, nullable=True)
    user_action = Column(String(50), nullable=False)
    final_output = Column(Text, nullable=True)
    reward = Column(Float, nullable=False)
    tone_used = Column(String(50), nullable=True)
    edit_distance = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class SenderPreference(Base):
    __tablename__ = "sender_preferences"

    id = Column(Integer, primary_key=True, index=True)
    sender_email = Column(String(200), nullable=False, unique=True, index=True)
    sender_name = Column(String(200), nullable=True)
    importance = Column(String(20), default="medium")
    default_tone = Column(String(50), default="professional")
    default_action = Column(String(50), default="reply")
    reply_priority = Column(String(20), default="medium")
    notes = Column(Text, default="")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class ToneRule(Base):
    __tablename__ = "tone_rules"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    rule_type = Column(String(50), nullable=False)
    value = Column(Text, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
