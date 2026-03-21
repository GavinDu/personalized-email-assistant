import os
import json
from openai import OpenAI

client = OpenAI(
    api_key=os.environ.get("AI_INTEGRATIONS_OPENAI_API_KEY", "dummy"),
    base_url=os.environ.get("AI_INTEGRATIONS_OPENAI_BASE_URL"),
)

DRAFT_PROMPT = """You are a personal email assistant writing on behalf of the user.

Style rules (ALWAYS follow these):
{style_rules}

Sender context:
- Sender importance: {importance}
- Preferred tone: {tone}
- Relationship: {relationship}

Similar past emails you wrote (for style consistency):
{similar_emails}

Write a reply to this email. Be consistent with the style shown in past examples.
Return ONLY the email body text, no subject line, no metadata.

Email to reply to:
From: {sender_name} <{sender_email}>
Subject: {subject}
Body: {body}"""

DEFAULT_STYLE_RULES = [
    "Be concise - maximum 3-4 sentences unless more is necessary",
    "Be direct and professional",
    "Avoid unnecessary pleasantries like 'Hope you are doing well'",
    "No filler phrases like 'Just wanted to follow up'",
    "Use active voice",
    "No hedging words like 'maybe', 'perhaps', 'I think' unless truly uncertain",
]


def generate_draft(
    sender_name: str,
    sender_email: str,
    subject: str,
    body: str,
    tone: str = "professional",
    importance: str = "medium",
    tone_rules: list = None,
    similar_emails: list = None,
) -> dict:
    rules = tone_rules or DEFAULT_STYLE_RULES
    similar = similar_emails or []

    similar_text = ""
    if similar:
        examples = []
        for i, ex in enumerate(similar[:3], 1):
            examples.append(f"Example {i}:\nSubject: {ex.get('subject', '')}\nReply: {ex.get('reply', '')}")
        similar_text = "\n\n".join(examples)
    else:
        similar_text = "No past examples available yet."

    relationship = {
        "high": "important business contact",
        "medium": "regular contact",
        "low": "low priority contact",
    }.get(importance, "regular contact")

    prompt = DRAFT_PROMPT.format(
        style_rules="\n".join(f"- {r}" for r in rules),
        importance=importance,
        tone=tone,
        relationship=relationship,
        similar_emails=similar_text,
        sender_name=sender_name,
        sender_email=sender_email,
        subject=subject,
        body=body[:1500],
    )

    try:
        response = client.chat.completions.create(
            model="gpt-5-mini",
            messages=[{"role": "user", "content": prompt}],
            max_completion_tokens=8192,
        )
        draft = response.choices[0].message.content.strip()

        style_notes = f"Tone: {tone}. Applied {len(rules)} style rules."
        if similar:
            style_notes += f" Retrieved {len(similar)} similar past emails for style guidance."

        return {
            "draft": draft,
            "tone_used": tone,
            "style_notes": style_notes,
            "similar_past_emails": similar[:3],
        }
    except Exception as e:
        return {
            "draft": f"[Draft generation failed: {str(e)[:100]}] Please write your reply manually.",
            "tone_used": tone,
            "style_notes": "Draft generation encountered an error.",
            "similar_past_emails": [],
        }


def enforce_tone(text: str, tone_rules: list) -> str:
    banned_phrases = [r for r in tone_rules if "ban" in r.lower() or "remove" in r.lower() or "avoid" in r.lower()]
    for phrase_rule in banned_phrases:
        for phrase in ["Hope you are doing well", "Just wanted to follow up", "Per my last email",
                       "As per", "Please advise", "Going forward"]:
            text = text.replace(phrase, "").strip()
    return text
