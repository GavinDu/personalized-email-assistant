from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Any
from datetime import datetime


class EmailOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    subject: str
    sender_name: str
    sender_email: str
    body: str
    received_at: datetime
    is_read: bool
    priority: str
    intent: str
    recommended_action: str
    classification_confidence: float
    classification_notes: str

    rl_model: Optional[str] = None
    rl_model_key: Optional[str] = None
    rl_positive_examples: int = 0
    rl_negative_examples: int = 0
    rl_latency_ms: Optional[int] = None
    rl_active: bool = False

    created_at: datetime


class EmailList(BaseModel):
    emails: List[EmailOut]
    total: int


class DraftRequest(BaseModel):
    tone_override: Optional[str] = None


class SimilarEmail(BaseModel):
    subject: str
    reply: str


class DraftOut(BaseModel):
    email_id: int
    draft: str
    tone_used: str
    style_notes: str
    similar_past_emails: List[SimilarEmail]


class FeedbackIn(BaseModel):
    user_action: str
    final_output: Optional[str] = None
    tone_used: Optional[str] = None
    edit_distance: Optional[int] = 0


class FeedbackOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email_id: int
    user_action: str
    reward: float
    tone_used: Optional[str]
    created_at: datetime


class SenderPreferenceIn(BaseModel):
    sender_email: str
    sender_name: Optional[str] = None
    importance: str = "medium"
    default_tone: str = "professional"
    default_action: str = "reply"
    reply_priority: str = "medium"
    notes: str = ""


class SenderPreferenceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    sender_email: str
    sender_name: Optional[str]
    importance: str
    default_tone: str
    default_action: str
    reply_priority: str
    notes: str
    created_at: datetime
    updated_at: datetime


class ToneRuleIn(BaseModel):
    name: str
    rule_type: str
    value: str
    is_active: bool = True


class ToneRuleOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    rule_type: str
    value: str
    is_active: bool
    created_at: datetime


class RewardTrendPoint(BaseModel):
    date: str
    avg_reward: float
    count: int


class ToneDistributionItem(BaseModel):
    tone: str
    count: int
    avg_reward: float


class ActionBreakdownItem(BaseModel):
    action: str
    count: int
    percentage: float


class BanditState(BaseModel):
    tone: str
    avg_reward: float
    count: int
    expected_reward: float


class HistoryItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email_id: int
    user_action: str
    reward: float
    tone_used: Optional[str]
    edit_distance: int
    created_at: datetime
    email_subject: str
    email_sender: str


class ClassificationBreakdownItem(BaseModel):
    label: str
    count: int
    percentage: float


class RLBufferStats(BaseModel):
    total_experiences: int
    positive_experiences: int
    negative_experiences: int
    neutral_experiences: int
    positive_ratio: float
    avg_reward: float
    recent_avg_reward: float
    learning_active: bool


class RLModelBreakdownItem(BaseModel):
    model_key: str
    model_id: str
    count: int
    avg_confidence: float


class AnalyticsOut(BaseModel):
    reward_trend: List[RewardTrendPoint]
    tone_distribution: List[ToneDistributionItem]
    action_breakdown: List[ActionBreakdownItem]
    bandit_state: List[BanditState]
    priority_breakdown: List[ClassificationBreakdownItem]
    intent_breakdown: List[ClassificationBreakdownItem]
    rl_buffer: RLBufferStats
    rl_model_breakdown: List[RLModelBreakdownItem]
    total_emails_processed: int
    avg_overall_reward: float
