import os
from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

DATABASE_URL = os.environ.get("DATABASE_URL", "")

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL environment variable is not set")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    from models import Email, EmailLog, SenderPreference, ToneRule
    Base.metadata.create_all(bind=engine)
    _migrate_columns()


def _migrate_columns():
    """Add new columns to existing tables without dropping data."""
    new_columns = [
        ("emails", "rl_model", "VARCHAR(100)"),
        ("emails", "rl_model_key", "VARCHAR(20)"),
        ("emails", "rl_positive_examples", "INTEGER DEFAULT 0"),
        ("emails", "rl_negative_examples", "INTEGER DEFAULT 0"),
        ("emails", "rl_latency_ms", "INTEGER"),
        ("emails", "rl_active", "BOOLEAN DEFAULT FALSE"),
    ]
    with engine.connect() as conn:
        for table, col, col_type in new_columns:
            try:
                conn.execute(text(f"ALTER TABLE {table} ADD COLUMN IF NOT EXISTS {col} {col_type}"))
                conn.commit()
            except Exception:
                conn.rollback()
