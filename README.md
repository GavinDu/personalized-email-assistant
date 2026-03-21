# Personalized Email Assistant

  An AI-powered personalized email assistant prototype featuring:

  - **LLM Classification**: Priority, intent, and recommended action detection via GPT
  - **AI Draft Generation**: Tone-aware draft generation with style enforcement
  - **RL Feedback Loop**: Approve/edit/discard workflow that improves over time
  - **Sender Preferences**: Per-sender tone and action rules
  - **Analytics Dashboard**: Reward trends, tone distribution, classification breakdowns
  - **Feedback History**: Full audit trail of AI decisions

  ## Tech Stack

  - **Backend**: Python / FastAPI + SQLAlchemy + PostgreSQL
  - **Frontend**: React / Vite + TypeScript + Tailwind CSS
  - **API Client**: Orval-generated hooks from FastAPI OpenAPI spec
  - **API Proxy**: Node.js / Express (TypeScript)
  - **AI**: OpenAI GPT via Replit AI Integrations
  