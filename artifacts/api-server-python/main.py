import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import emails, drafts, feedback, preferences, tone_rules, analytics, seed, rl
from database import create_tables


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_tables()
    yield


app = FastAPI(
    title="Email Assistant API",
    description="Personalized email assistant with classification, draft generation, and RL feedback loop",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(emails.router)
app.include_router(drafts.router)
app.include_router(feedback.router)
app.include_router(preferences.router)
app.include_router(tone_rules.router)
app.include_router(analytics.router)
app.include_router(seed.router)
app.include_router(rl.router)


@app.get("/healthz")
def health():
    return {"status": "ok"}
