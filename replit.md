# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Primary API framework**: Python FastAPI (email assistant backend)
- **Secondary API**: Express 5 (TypeScript, acts as reverse proxy to Python)
- **Database**: PostgreSQL + SQLAlchemy (Python), Drizzle ORM (TypeScript)
- **Frontend**: React + Vite + Tailwind CSS + Framer Motion + Recharts
- **Validation**: Zod (TS), Pydantic (Python)
- **AI**: OpenAI gpt-5-mini via Replit AI Integrations proxy (draft generation); Qwen 3 14B + Gemma 3 12B via OpenRouter (RL classification)

## Email Assistant Architecture

The project is a personalized email assistant prototype with:
- **Python FastAPI** at `artifacts/api-server-python/` — runs on port 8000
- **TS Express proxy** at `artifacts/api-server/` — runs on port 8080, proxies `/pyapi/*` to Python server
- **React frontend** at `artifacts/email-assistant/` — runs on port 23794, preview path `/`

### Proxy Routing
- Browser → `/pyapi/...` → Express (8080) → strips `/pyapi` → Python FastAPI (8000)
- **Critical**: The proxy middleware must be placed BEFORE Express body parsers (`express.json()`) to avoid consuming the request body before it can be forwarded. This is set correctly in `artifacts/api-server/src/app.ts`.

### Python FastAPI Routes (no prefix needed — Express strips `/pyapi`)
- `GET /emails` — list emails with filters
- `GET /emails/{id}` — single email
- `POST /emails/{id}/draft` — generate AI draft (calls OpenAI gpt-5-mini)
- `POST /emails/{id}/feedback` — submit RL feedback (approve/edit/discard)
- `GET /preferences` — sender preferences
- `POST/PUT/DELETE /preferences/{id}` — CRUD preferences
- `GET /tone-rules` — tone rules
- `POST/PUT/DELETE /tone-rules/{id}` — CRUD tone rules
- `GET /analytics` — reward trends, tone distribution, bandit state
- `POST /seed` — seed 15 sample emails + 3 preferences + 5 tone rules

### RL Feedback Loop
- Approve: +1.0 reward
- Edit: -0.3 reward (minus edit-distance penalty)
- Discard: -1.0 reward
- UCB-style bandit state computed per tone in analytics endpoint

### In-Context RL Classifier (NEW)
- **Models**: `qwen/qwen3-14b` (default) and `google/gemma-3-12b-it` — selectable via `/rl/settings` endpoint
- **Experience Replay Buffer**: Pulls top-K high-reward (approved) and low-reward (discarded) examples from `email_logs` to build dynamic few-shot prompts
- **In-context RL**: No weight updates — the LLM adapts via example selection. As the buffer fills with approved classifications, future classifications improve automatically
- **Services**: `services/rl_classifier.py` (RL classification), `services/experience_buffer.py` (buffer management)
- **New routes**: `GET/PUT /rl/settings` — get/set active model; model persists for server lifetime
- **DB migration**: `_migrate_columns()` in `database.py` adds RL fields to `emails` table on startup
- **RL fields on Email**: `rl_model`, `rl_model_key`, `rl_positive_examples`, `rl_negative_examples`, `rl_latency_ms`, `rl_active`
- **Analytics**: `rl_buffer` and `rl_model_breakdown` added to `/analytics` response

### Database
- PostgreSQL via `DATABASE_URL` environment variable
- SQLAlchemy models in `artifacts/api-server-python/models.py`
- Tables: emails, email_logs (feedback), sender_preferences, tone_rules
- Tables created automatically on startup via `create_tables()`

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/          # Express TS proxy server (port 8080)
│   ├── api-server-python/   # Python FastAPI email backend (port 8000)
│   │   ├── main.py          # FastAPI app, table creation, router mounting
│   │   ├── models.py        # SQLAlchemy ORM models
│   │   ├── schemas.py       # Pydantic request/response schemas
│   │   ├── routers/         # emails.py, drafts.py, feedback.py, preferences.py, tone_rules.py, analytics.py, seed.py
│   │   └── services/        # classifier.py (LLM), draft_generator.py (LLM)
│   └── email-assistant/     # React/Vite frontend (port 23794)
│       └── src/
│           ├── App.tsx       # Routes: /, /preferences, /tone-rules, /analytics
│           ├── hooks/use-api.ts  # All API hooks using /pyapi prefix
│           ├── pages/        # inbox.tsx, preferences.tsx, tone-rules.tsx, analytics.tsx
│           └── components/   # layout.tsx (sidebar nav)
├── lib/                     # Shared TS libraries (api-spec, api-client-react, api-zod, db)
├── scripts/                 # Utility scripts
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## Important Notes

- **Body parser order**: In `artifacts/api-server/src/app.ts`, the `/pyapi` proxy middleware MUST come before `express.json()`. If body parsers come first, POST requests to Python will hang.
- **Model token limits**: Both `classifier.py` and `draft_generator.py` use `max_completion_tokens=8192` (required for gpt-5+ models; `max_tokens` is not supported).
- **AI Integration**: Uses Replit AI Integrations proxy — `AI_INTEGRATIONS_OPENAI_BASE_URL` and `AI_INTEGRATIONS_OPENAI_API_KEY` are auto-set. Never ask user for API keys.
- **Python packages**: Installed at system level in `artifacts/api-server-python/`. Key: fastapi, uvicorn, sqlalchemy, psycopg2-binary, openai, pydantic.

## Workflows

1. **Email Assistant Python API** — `cd artifacts/api-server-python && uvicorn main:app --host 0.0.0.0 --port 8000 --reload`
2. **artifacts/api-server: API Server** — `pnpm --filter @workspace/api-server run dev`
3. **artifacts/email-assistant: web** — `pnpm --filter @workspace/email-assistant run dev`
4. **artifacts/mockup-sandbox: Component Preview Server** — `pnpm --filter @workspace/mockup-sandbox run dev`
