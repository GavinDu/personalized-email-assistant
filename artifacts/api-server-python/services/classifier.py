import os
import json
from openai import OpenAI

client = OpenAI(
    api_key=os.environ.get("AI_INTEGRATIONS_OPENAI_API_KEY", "dummy"),
    base_url=os.environ.get("AI_INTEGRATIONS_OPENAI_BASE_URL"),
)

CLASSIFY_PROMPT = """You are an email classifier for a personal email assistant.

Analyze the email and return a JSON object with these fields:
- priority: "high" | "medium" | "low"
- intent: "request" | "update" | "action" | "fyi" | "meeting" | "complaint" | "introduction"
- recommended_action: "reply" | "ignore" | "escalate" | "delegate" | "schedule"
- confidence: float 0.0-1.0
- notes: brief explanation of your classification (1-2 sentences)

Return ONLY valid JSON, no other text.

Email:
From: {sender_name} <{sender_email}>
Subject: {subject}
Body: {body}"""


def classify_email(sender_name: str, sender_email: str, subject: str, body: str) -> dict:
    prompt = CLASSIFY_PROMPT.format(
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
        content = response.choices[0].message.content.strip()
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]
        return json.loads(content)
    except Exception as e:
        return {
            "priority": "medium",
            "intent": "unknown",
            "recommended_action": "reply",
            "confidence": 0.5,
            "notes": f"Auto-classified (error: {str(e)[:50]})",
        }
