from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import Email, SenderPreference, ToneRule
from datetime import datetime, timedelta
import random

router = APIRouter(tags=["seed"])

SAMPLE_EMAILS = [
    {
        "subject": "Q3 Budget Review - Action Required",
        "sender_name": "Sarah Chen",
        "sender_email": "sarah.chen@company.com",
        "body": "Hi, I need your approval on the Q3 budget adjustments by EOD Friday. The marketing team is requesting an additional $50K for the product launch campaign. Please review the attached spreadsheet and let me know if you approve or have concerns. This is blocking the campaign kick-off scheduled for next Monday.",
        "priority": "high",
        "intent": "action",
        "recommended_action": "reply",
        "classification_confidence": 0.92,
        "classification_notes": "High urgency with explicit deadline and budget decision required.",
        "received_at": datetime.now() - timedelta(hours=2),
    },
    {
        "subject": "Re: Partnership Opportunity - Mutual Interest",
        "sender_name": "Marcus Williams",
        "sender_email": "marcus@partnerfirm.io",
        "body": "Following up on our conversation last week. We are very interested in exploring a co-marketing arrangement. Our combined user bases could create significant value for both companies. Could we schedule a 30-minute call this week to discuss specifics? I am available Tuesday or Thursday afternoon.",
        "priority": "medium",
        "intent": "meeting",
        "recommended_action": "reply",
        "classification_confidence": 0.88,
        "classification_notes": "Partnership opportunity requiring scheduling a call.",
        "received_at": datetime.now() - timedelta(hours=5),
    },
    {
        "subject": "FYI: New Security Policy Update",
        "sender_name": "IT Security Team",
        "sender_email": "security@company.com",
        "body": "This is a notification that our password policy has been updated effective next Monday. All employees must update their passwords to comply with the new 16-character minimum requirement. Passwords must include uppercase, lowercase, numbers, and special characters. Please complete this before the deadline to avoid account lockout.",
        "priority": "medium",
        "intent": "fyi",
        "recommended_action": "ignore",
        "classification_confidence": 0.95,
        "classification_notes": "Internal IT policy update, informational only, no response needed.",
        "received_at": datetime.now() - timedelta(hours=8),
    },
    {
        "subject": "URGENT: Production server down",
        "sender_name": "DevOps Alert",
        "sender_email": "alerts@devops.company.com",
        "body": "CRITICAL: Production server us-east-1 is experiencing high error rates (95% failure rate). Error: Database connection pool exhausted. Revenue impact estimate: $12K/minute. On-call engineer notified. Root cause investigation in progress. ETA for resolution: 45 minutes.",
        "priority": "high",
        "intent": "action",
        "recommended_action": "escalate",
        "classification_confidence": 0.99,
        "classification_notes": "Critical production incident requiring immediate escalation.",
        "received_at": datetime.now() - timedelta(hours=1),
    },
    {
        "subject": "Invoice #4521 - Payment Due",
        "sender_name": "Acme Supplies",
        "sender_email": "billing@acme-supplies.com",
        "body": "Please find attached invoice #4521 for $3,240.00 for office supplies delivered last month. Payment is due within 30 days. You can pay via bank transfer or credit card. Please reference invoice number in payment description. Contact us if you have any questions.",
        "priority": "medium",
        "intent": "action",
        "recommended_action": "delegate",
        "classification_confidence": 0.85,
        "classification_notes": "Invoice requiring payment, best delegated to finance team.",
        "received_at": datetime.now() - timedelta(days=1),
    },
    {
        "subject": "Great meeting you at the conference!",
        "sender_name": "Jennifer Park",
        "sender_email": "j.park@techventures.com",
        "body": "It was wonderful connecting with you at TechSummit yesterday. I really enjoyed our conversation about AI applications in enterprise workflows. I would love to continue the discussion and potentially explore how our companies might collaborate. Would you be open to a coffee chat next week?",
        "priority": "low",
        "intent": "introduction",
        "recommended_action": "reply",
        "classification_confidence": 0.82,
        "classification_notes": "Networking follow-up, low priority but worth a brief reply.",
        "received_at": datetime.now() - timedelta(days=1, hours=3),
    },
    {
        "subject": "Monthly team performance report - March",
        "sender_name": "HR Analytics",
        "sender_email": "analytics@company.com",
        "body": "Attached is the March team performance report. Key highlights: Team velocity up 15% vs February, customer satisfaction score: 4.7/5.0 (up from 4.4), sprint completion rate: 94%, two team members flagged for outstanding performance. Full details in attached PDF.",
        "priority": "low",
        "intent": "update",
        "recommended_action": "ignore",
        "classification_confidence": 0.90,
        "classification_notes": "Routine monthly report, informational, no action required.",
        "received_at": datetime.now() - timedelta(days=2),
    },
    {
        "subject": "Feedback on your presentation",
        "sender_name": "David Rodriguez",
        "sender_email": "david.r@bigclient.com",
        "body": "I wanted to share some feedback on your product demo last Tuesday. Overall the presentation was strong, but I have a few concerns about the scalability section. The benchmarks shown were for 10K users, but we are planning to scale to 500K. Can you share more detailed performance data for high-load scenarios? This is a key decision factor for us.",
        "priority": "high",
        "intent": "request",
        "recommended_action": "reply",
        "classification_confidence": 0.91,
        "classification_notes": "Important client feedback with a specific technical question blocking their decision.",
        "received_at": datetime.now() - timedelta(days=2, hours=6),
    },
    {
        "subject": "Team lunch this Friday?",
        "sender_name": "Alex Thompson",
        "sender_email": "alex.t@company.com",
        "body": "Hey! Are you joining us for the team lunch this Friday? We are thinking of trying that new Italian place on 5th Street. Let me know if you are in so I can make a reservation. Thinking around 12:30pm.",
        "priority": "low",
        "intent": "request",
        "recommended_action": "reply",
        "classification_confidence": 0.78,
        "classification_notes": "Casual internal social invitation.",
        "received_at": datetime.now() - timedelta(days=3),
    },
    {
        "subject": "Contract renewal - 60 day notice",
        "sender_name": "Legal Team",
        "sender_email": "legal@company.com",
        "body": "This is your 60-day advance notice that the SaaS vendor contract with CloudProvider Inc. (Contract #2891) expires on May 15th. Please advise if you would like to renew, renegotiate, or terminate. If we proceed with renewal, legal will need your approval by April 1st to ensure timely processing.",
        "priority": "medium",
        "intent": "action",
        "recommended_action": "reply",
        "classification_confidence": 0.87,
        "classification_notes": "Contract renewal decision needed within deadline.",
        "received_at": datetime.now() - timedelta(days=3, hours=2),
    },
    {
        "subject": "Complaint: Order #8843 delayed",
        "sender_name": "Robert Kim",
        "sender_email": "robert.kim@customer.com",
        "body": "I placed order #8843 three weeks ago and was promised 5-7 day delivery. It is now 21 days and I still have not received anything. I have contacted customer support twice with no resolution. This is completely unacceptable. I need immediate escalation and a definitive delivery date or I will dispute the charge.",
        "priority": "high",
        "intent": "complaint",
        "recommended_action": "escalate",
        "classification_confidence": 0.96,
        "classification_notes": "Angry customer complaint with potential chargeback threat, needs immediate escalation.",
        "received_at": datetime.now() - timedelta(days=4),
    },
    {
        "subject": "Research paper collaboration request",
        "sender_name": "Prof. Emily Watson",
        "sender_email": "e.watson@university.edu",
        "body": "Dear colleague, I am leading a research project on AI adoption in enterprise settings and believe your experience at your company would provide valuable insights. Would you be interested in co-authoring a paper or participating as an interview subject? The research will be published in the Journal of Technology Management.",
        "priority": "low",
        "intent": "request",
        "recommended_action": "reply",
        "classification_confidence": 0.80,
        "classification_notes": "Research collaboration request, low urgency.",
        "received_at": datetime.now() - timedelta(days=5),
    },
    {
        "subject": "Weekly digest: Industry News",
        "sender_name": "TechCrunch Newsletter",
        "sender_email": "newsletter@techcrunch.com",
        "body": "This week in tech: OpenAI announces GPT-6, Meta releases Llama 3.5, Google Cloud expands to 5 new regions, Microsoft acquires AI startup for $2B, Nvidia stock hits all-time high on data center demand. Read the full stories at techcrunch.com...",
        "priority": "low",
        "intent": "fyi",
        "recommended_action": "ignore",
        "classification_confidence": 0.98,
        "classification_notes": "Newsletter, no response needed.",
        "received_at": datetime.now() - timedelta(days=5, hours=8),
    },
    {
        "subject": "Board meeting prep - slides needed",
        "sender_name": "CEO Office",
        "sender_email": "ceo-office@company.com",
        "body": "Reminder that the quarterly board meeting is in 10 days. We need your department's slides by this Thursday. Please include: Q1 performance vs. targets, key wins, blockers, and Q2 outlook. Max 8 slides. Send to this email for compilation into the board deck.",
        "priority": "high",
        "intent": "action",
        "recommended_action": "reply",
        "classification_confidence": 0.94,
        "classification_notes": "High priority internal request with hard deadline for board prep.",
        "received_at": datetime.now() - timedelta(days=6),
    },
    {
        "subject": "Congratulations on the product launch!",
        "sender_name": "Tom Bradley",
        "sender_email": "tom.bradley@investor.com",
        "body": "Just saw the announcement about your new product launch. Impressive growth metrics you shared. The market positioning looks strong and the timing could not be better given where the industry is heading. Looking forward to the next update call.",
        "priority": "low",
        "intent": "update",
        "recommended_action": "reply",
        "classification_confidence": 0.75,
        "classification_notes": "Positive message from investor, brief acknowledgment reply appropriate.",
        "received_at": datetime.now() - timedelta(days=7),
    },
]

DEFAULT_TONE_RULES = [
    {"name": "Max sentence limit", "rule_type": "length", "value": "Keep replies to 3-4 sentences maximum unless more detail is explicitly required"},
    {"name": "No filler greetings", "rule_type": "banned_phrase", "value": "Avoid 'Hope you are doing well', 'Just wanted to follow up', 'Per my last email'"},
    {"name": "Direct language", "rule_type": "style", "value": "Use active voice and direct statements. Avoid hedging words like maybe, perhaps, I think"},
    {"name": "No unnecessary politeness", "rule_type": "style", "value": "Skip excessive pleasantries. Get to the point immediately"},
    {"name": "Assertive tone", "rule_type": "style", "value": "Be confident and assertive. State decisions clearly, not tentatively"},
]


@router.post("/seed")
def seed_database(db: Session = Depends(get_db)):
    existing = db.query(Email).count()
    if existing > 0:
        return {"message": f"Database already has {existing} emails. Skipping seed."}

    for email_data in SAMPLE_EMAILS:
        email = Email(**email_data)
        db.add(email)

    default_prefs = [
        SenderPreference(
            sender_email="sarah.chen@company.com",
            sender_name="Sarah Chen",
            importance="high",
            default_tone="concise",
            default_action="reply",
            reply_priority="high",
            notes="Direct manager, always reply same day",
        ),
        SenderPreference(
            sender_email="david.r@bigclient.com",
            sender_name="David Rodriguez",
            importance="high",
            default_tone="professional",
            default_action="reply",
            reply_priority="high",
            notes="Key enterprise client, handle with care",
        ),
        SenderPreference(
            sender_email="alerts@devops.company.com",
            sender_name="DevOps Alerts",
            importance="high",
            default_tone="concise",
            default_action="escalate",
            reply_priority="high",
            notes="Production alerts, always escalate immediately",
        ),
    ]
    for pref in default_prefs:
        db.add(pref)

    for rule_data in DEFAULT_TONE_RULES:
        rule = ToneRule(**rule_data)
        db.add(rule)

    db.commit()

    return {"message": f"Seeded {len(SAMPLE_EMAILS)} emails, {len(default_prefs)} preferences, {len(DEFAULT_TONE_RULES)} tone rules"}
