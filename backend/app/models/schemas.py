from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime


class MetricScore(BaseModel):
    score: int = Field(ge=0, le=100)
    label: str
    detail: str


class Metrics(BaseModel):
    eye_contact: MetricScore
    confidence: MetricScore
    speech_pace: MetricScore
    filler_words: MetricScore
    posture: MetricScore
    vocal_variety: MetricScore


class CoachingTip(BaseModel):
    category: Literal[
        "eye_contact", "confidence", "speech_pace",
        "filler_words", "posture", "vocal_variety"
    ]
    priority: Literal["high", "medium", "low"]
    title: str
    description: str
    drill: str


class AnalysisResult(BaseModel):
    overall_score: int = Field(ge=0, le=100)
    summary: str
    metrics: Metrics
    filler_word_count: dict[str, int]
    words_per_minute: int
    transcript_excerpt: str
    coaching_tips: list[CoachingTip]
    timestamp: str
    video_duration: int  # seconds


class JobStatus(BaseModel):
    jobId: str
    status: Literal["idle", "uploading", "processing", "complete", "error"]
    progress: int = Field(ge=0, le=100, default=0)
    result: Optional[AnalysisResult] = None
    error: Optional[str] = None


class SubmitResponse(BaseModel):
    jobId: str
