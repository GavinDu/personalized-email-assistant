"""
RL-Enhanced Email Classifier using Qwen / Gemma via OpenRouter.

Uses in-context reinforcement learning:
  - Positive few-shot examples = high-reward past classifications (user approved)
  - Negative contrastive examples = low-reward past classifications (user discarded)
  - The model policy improves automatically as the experience buffer fills up.

Model options:
  - qwen/qwen3-14b  (default — fast, high quality)
  - google/gemma-3-12b-it
"""

import os
import json
import time
from openai import OpenAI
from sqlalchemy.orm import Session
from services.experience_buffer import get_positive_experiences, get_negative_experiences

OPENROUTER_CLIENT = None


def _get_openrouter_client() -> OpenAI:
    global OPENROUTER_CLIENT
    if OPENROUTER_CLIENT is None:
        OPENROUTER_CLIENT = OpenAI(
            api_key=os.environ.get("AI_INTEGRATIONS_OPENROUTER_API_KEY", "dummy"),
            base_url=os.environ.get("AI_INTEGRATIONS_OPENROUTER_BASE_URL"),
        )
    return OPENROUTER_CLIENT


SUPPORTED_MODELS = {
    "qwen": "qwen/qwen3-14b",
    "gemma": "google/gemma-3-12b-it",
}

DEFAULT_MODEL = "qwen"


def _build_rl_prompt(
    sender_name: str,
    sender_email: str,
    subject: str,
    body: str,
    positive_examples: list,
    negative_examples: list,
) -> str:
    prompt_parts = [
        "You are an expert email classifier for a personal assistant.",
        "",
        "Your task: analyze the email below and return a JSON classification.",
        "",
    ]

    if positive_examples:
        prompt_parts.append(
            "=== APPROVED CLASSIFICATIONS (high quality — learn from these) ==="
        )
        for i, ex in enumerate(positive_examples, 1):
            prompt_parts.append(
                f"\n[Example {i} — User APPROVED ✓ | reward={ex['reward']}]\n"
                f"From: {ex['sender_name']} <{ex['sender_email']}>\n"
                f"Subject: {ex['subject']}\n"
                f"Body snippet: {ex['body_snippet']}\n"
                f"→ Correct classification: priority={ex['priority']}, "
                f"intent={ex['intent']}, action={ex['recommended_action']}"
            )
        prompt_parts.append("")

    if negative_examples:
        prompt_parts.append(
            "=== POOR CLASSIFICATIONS (user rejected — avoid these patterns) ==="
        )
        for i, ex in enumerate(negative_examples, 1):
            prompt_parts.append(
                f"\n[Counter-example {i} — User DISCARDED ✗ | reward={ex['reward']}]\n"
                f"Subject: {ex['subject']}\n"
                f"Body snippet: {ex['body_snippet']}\n"
                f"→ Incorrect classification was: priority={ex['priority']}, "
                f"intent={ex['intent']}, action={ex['recommended_action']}\n"
                f"  Avoid making similar over/under classifications."
            )
        prompt_parts.append("")

    prompt_parts.extend([
        "=== EMAIL TO CLASSIFY NOW ===",
        f"From: {sender_name} <{sender_email}>",
        f"Subject: {subject}",
        f"Body: {body[:1500]}",
        "",
        "Return ONLY a valid JSON object with these fields:",
        '{"priority": "high"|"medium"|"low",',
        ' "intent": "request"|"update"|"action"|"fyi"|"meeting"|"complaint"|"introduction",',
        ' "recommended_action": "reply"|"ignore"|"escalate"|"delegate"|"schedule",',
        ' "confidence": <float 0.0-1.0>,',
        ' "notes": "<brief 1-2 sentence explanation>"}',
        "",
        "No other text. Only the JSON object.",
    ])

    return "\n".join(prompt_parts)


def classify_with_rl(
    sender_name: str,
    sender_email: str,
    subject: str,
    body: str,
    db: Session,
    model_key: str = DEFAULT_MODEL,
) -> dict:
    """
    Classify an email using the RL-enhanced approach:
    1. Pull positive + negative examples from the experience buffer
    2. Build a few-shot RL prompt
    3. Call Qwen or Gemma via OpenRouter
    4. Return classification + RL metadata
    """
    model_id = SUPPORTED_MODELS.get(model_key, SUPPORTED_MODELS[DEFAULT_MODEL])

    positive_examples = get_positive_experiences(db, n=4)
    negative_examples = get_negative_experiences(db, n=2)

    prompt = _build_rl_prompt(
        sender_name=sender_name,
        sender_email=sender_email,
        subject=subject,
        body=body,
        positive_examples=positive_examples,
        negative_examples=negative_examples,
    )

    client = _get_openrouter_client()
    start = time.time()

    try:
        response = client.chat.completions.create(
            model=model_id,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=8192,
        )
        raw = response.choices[0].message.content.strip()

        # Strip markdown fences if present
        if raw.startswith("```"):
            parts = raw.split("```")
            raw = parts[1] if len(parts) > 1 else raw
            if raw.startswith("json"):
                raw = raw[4:]

        result = json.loads(raw.strip())
        latency_ms = round((time.time() - start) * 1000)

        result["rl_model"] = model_id
        result["rl_model_key"] = model_key
        result["rl_positive_examples"] = len(positive_examples)
        result["rl_negative_examples"] = len(negative_examples)
        result["rl_latency_ms"] = latency_ms
        result["rl_active"] = True

        return result

    except Exception as e:
        # Graceful fallback: return a neutral classification with RL error noted
        return {
            "priority": "medium",
            "intent": "unknown",
            "recommended_action": "reply",
            "confidence": 0.4,
            "notes": f"RL classification error ({model_id}): {str(e)[:80]}",
            "rl_model": model_id,
            "rl_model_key": model_key,
            "rl_positive_examples": len(positive_examples),
            "rl_negative_examples": len(negative_examples),
            "rl_latency_ms": -1,
            "rl_active": False,
        }
