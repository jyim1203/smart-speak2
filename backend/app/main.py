from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import analyze
from app.config import get_settings

settings = get_settings()

app = FastAPI(
    title="SpeakIQ API",
    description="AI-powered public speaking analysis backend",
    version="1.0.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(analyze.router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "speakiq-api"}


@app.get("/")
async def root():
    return {"message": "SpeakIQ API — see /docs for endpoints"}
