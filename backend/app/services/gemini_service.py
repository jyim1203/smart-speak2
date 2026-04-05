"""
Gemini service.

Takes structured signals from Twelve Labs (visual) and Deepgram (audio/speech)
and produces a full coaching report with scores, labels, and actionable drills.
"""

import json
from google import genai
from app.config import get_settings
from app.models.schemas import (
    AnalysisResult, Metrics, MetricScore, CoachingTip
)
from datetime import datetime, timezone

settings = get_settings()
# client configured per-request below

SCORE_LABELS = {
    (80, 101): "Excellent",
    (60, 80): "Good",
    (40, 60): "Needs Work",
    (0, 40): "Poor",
}

def score_to_label(score: int) -> str:
    for (lo, hi), label in SCORE_LABELS.items():
        if lo <= score < hi:
            return label
    return "Unknown"


SYSTEM_PROMPT = """You are SpeakIQ, an expert public speaking coach with 20 years of experience.
You receive structured signal data from video/audio analysis tools and produce 
a detailed, actionable coaching report.

You always respond with valid JSON only — no markdown, no explanation outside JSON.
Be specific, honest, and constructive. Avoid generic advice."""

def build_user_prompt(visual: dict, audio: dict) -> str:
    total_fillers = sum(audio.get("filler_word_count", {}).values())
    wpm = audio.get("words_per_minute", 0)
    duration = int(audio.get("duration_seconds", 0))

    # Pace assessment hint
    if wpm < 100:
        pace_hint = "very slow (under 100 WPM) — may seem hesitant"
    elif wpm < 130:
        pace_hint = "somewhat slow (100-130 WPM)"
    elif wpm <= 160:
        pace_hint = "ideal pace (130-160 WPM)"
    elif wpm <= 190:
        pace_hint = "slightly fast (160-190 WPM)"
    else:
        pace_hint = "too fast (over 190 WPM) — hard to follow"

    filler_rate = (total_fillers / max(duration / 60, 1)) if duration else 0
    if filler_rate < 5:
        filler_hint = "minimal filler words — excellent"
    elif filler_rate < 15:
        filler_hint = "moderate filler words — noticeable but acceptable"
    else:
        filler_hint = "excessive filler words — very distracting"

    return f"""Analyze this speaker based on the following data and return a JSON coaching report.

=== VISUAL ANALYSIS (from computer vision) ===
Eye contact (% of time looking at camera): {visual.get('eye_contact', 50)}%
Posture quality (0-100): {visual.get('posture', 50)}
Confidence from body language (0-100): {visual.get('confidence', 50)}
Facial expressiveness (0-100): {visual.get('facial_expressiveness', 50)}
Gesture/movement quality (0-100): {visual.get('movement_quality', 50)}
Notable behaviors: {', '.join(visual.get('notable_behaviors', [])) or 'none noted'}

=== AUDIO/SPEECH ANALYSIS (from transcription) ===
Words per minute: {wpm} ({pace_hint})
Total filler words: {total_fillers} ({filler_hint})
Filler word breakdown: {json.dumps(audio.get('filler_word_count', {}))}
Video duration: {duration} seconds
Transcript excerpt: "{audio.get('excerpt', '')}"

=== REQUIRED JSON RESPONSE FORMAT ===
{{
  "overall_score": <int 0-100>,
  "summary": "<2-3 sentence overall assessment, specific and honest>",
  "metrics": {{
    "eye_contact": {{
      "score": <int 0-100>,
      "label": "<Excellent|Good|Needs Work|Poor>",
      "detail": "<one specific observation, max 12 words>"
    }},
    "confidence": {{
      "score": <int 0-100>,
      "label": "<Excellent|Good|Needs Work|Poor>",
      "detail": "<one specific observation, max 12 words>"
    }},
    "speech_pace": {{
      "score": <int 0-100>,
      "label": "<Excellent|Good|Needs Work|Poor>",
      "detail": "<one specific observation, max 12 words>"
    }},
    "filler_words": {{
      "score": <int 0-100>,
      "label": "<Excellent|Good|Needs Work|Poor>",
      "detail": "<one specific observation, max 12 words>"
    }},
    "posture": {{
      "score": <int 0-100>,
      "label": "<Excellent|Good|Needs Work|Poor>",
      "detail": "<one specific observation, max 12 words>"
    }},
    "vocal_variety": {{
      "score": <int 0-100>,
      "label": "<Excellent|Good|Needs Work|Poor>",
      "detail": "<one specific observation, max 12 words>"
    }}
  }},
  "coaching_tips": [
    {{
      "category": "<eye_contact|confidence|speech_pace|filler_words|posture|vocal_variety>",
      "priority": "<high|medium|low>",
      "title": "<short actionable title, max 8 words>",
      "description": "<2-3 sentences explaining the issue and why it matters>",
      "drill": "<specific 1-2 sentence practice exercise the speaker can do today>"
    }}
  ]
}}

Rules:
- Provide 4-6 coaching_tips covering the speaker's most important areas
- At least 1 high-priority tip if any score is below 60
- Drills must be concrete and immediately actionable
- Reference specific data (e.g., "You said 'um' 23 times" or "Your 145 WPM pace is ideal")
- overall_score = weighted average (eye_contact 20%, confidence 20%, speech_pace 15%, filler_words 15%, posture 15%, vocal_variety 15%)"""


class GeminiService:
    def __init__(self):
        self.client = genai.Client(api_key=settings.gemini_api_key)

    async def generate_coaching_report(
        self,
        visual_data: dict,
        audio_data: dict,
    ) -> AnalysisResult:
        prompt = build_user_prompt(visual_data, audio_data)

        response = await self.client.aio.models.generate_content(
            model="gemini-2.5-flash",
            contents=SYSTEM_PROMPT + "\n\n" + prompt,
            config={"temperature": 0.2, "response_mime_type": "application/json"},
        )
        raw = response.text

        # Parse JSON
        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            # Try extracting from markdown fences
            import re
            match = re.search(r'```(?:json)?\s*([\s\S]+?)\s*```', raw)
            if match:
                data = json.loads(match.group(1))
            else:
                raise ValueError(f"Gemini returned invalid JSON: {raw[:200]}")

        # Build typed result
        metrics = Metrics(
            eye_contact=MetricScore(**data["metrics"]["eye_contact"]),
            confidence=MetricScore(**data["metrics"]["confidence"]),
            speech_pace=MetricScore(**data["metrics"]["speech_pace"]),
            filler_words=MetricScore(**data["metrics"]["filler_words"]),
            posture=MetricScore(**data["metrics"]["posture"]),
            vocal_variety=MetricScore(**data["metrics"]["vocal_variety"]),
        )

        tips = [CoachingTip(**t) for t in data.get("coaching_tips", [])]

        return AnalysisResult(
            overall_score=data["overall_score"],
            summary=data["summary"],
            metrics=metrics,
            filler_word_count=audio_data.get("filler_word_count", {}),
            words_per_minute=audio_data.get("words_per_minute", 0),
            transcript_excerpt=audio_data.get("excerpt", ""),
            coaching_tips=tips,
            timestamp=datetime.now(timezone.utc).isoformat(),
            video_duration=int(audio_data.get("duration_seconds", 0)),
        )


gemini_service = GeminiService()
