"""
RL Settings endpoints — get/set the active model for RL-enhanced classification.
"""

from fastapi import APIRouter, Query
from pydantic import BaseModel
from services.rl_classifier import SUPPORTED_MODELS, DEFAULT_MODEL

router = APIRouter(tags=["rl"])

# In-memory model preference (persists for the server lifetime)
_current_model = {"key": DEFAULT_MODEL}


class RLSettings(BaseModel):
    model_key: str
    model_id: str
    available_models: dict


@router.get("/rl/settings", response_model=RLSettings)
def get_rl_settings():
    key = _current_model["key"]
    return RLSettings(
        model_key=key,
        model_id=SUPPORTED_MODELS.get(key, SUPPORTED_MODELS[DEFAULT_MODEL]),
        available_models=SUPPORTED_MODELS,
    )


@router.put("/rl/settings")
def set_rl_model(model_key: str = Query(..., description="Model key: 'qwen' or 'gemma'")):
    if model_key not in SUPPORTED_MODELS:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail=f"Unknown model key. Choose from: {list(SUPPORTED_MODELS.keys())}")
    _current_model["key"] = model_key
    return {
        "model_key": model_key,
        "model_id": SUPPORTED_MODELS[model_key],
        "message": f"Active RL model updated to {SUPPORTED_MODELS[model_key]}",
    }


def get_active_model_key() -> str:
    return _current_model["key"]
