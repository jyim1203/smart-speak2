"""
Deepgram service (SDK v6.x compatible).
"""

import re
from deepgram import DeepgramClient
from app.config import get_settings

settings = get_settings()

FILLER_WORDS = {
    "um", "uh", "umm", "uhh", "er", "err",
    "like", "so", "basically", "literally",
    "right", "actually", "honestly", "totally",
}


class DeepgramService:
    def __init__(self):
        self.client = DeepgramClient(api_key=settings.deepgram_api_key)

    async def transcribe(self, video_path: str) -> dict:
        with open(video_path, "rb") as f:
            audio_data = f.read()

        response = self.client.listen.v1.media.transcribe_file(
            request=audio_data,
            model="nova-2",
            language="en",
            smart_format=True,
            punctuate=True,
            utterances=True,
            filler_words=True,
        )

        channel = response.results.channels[0].alternatives[0]
        transcript = channel.transcript
        words = channel.words or []
        duration = response.metadata.duration or 0

        filler_count = self._count_filler_words(words, transcript)
        meaningful_words = [
            w for w in words
            if w.word.lower().strip(".,!?") not in FILLER_WORDS
        ]
        wpm = int((len(meaningful_words) / max(duration, 1)) * 60) if duration else 0
        excerpt = self._make_excerpt(transcript)

        return {
            "transcript": transcript,
            "filler_word_count": filler_count,
            "words_per_minute": wpm,
            "duration_seconds": duration,
            "excerpt": excerpt,
            "word_count": len(meaningful_words),
        }

    def _count_filler_words(self, words, transcript):
        counts = {}
        for word_obj in words:
            w = word_obj.word.lower().strip(".,!?'\"")
            if w in FILLER_WORDS:
                counts[w] = counts.get(w, 0) + 1
        lowered = transcript.lower()
        for phrase in ["you know", "i mean"]:
            count = lowered.count(phrase)
            if count:
                counts[phrase] = counts.get(phrase, 0) + count
        if not counts:
            for w in re.findall(r"\b\w+\b", lowered):
                if w in FILLER_WORDS:
                    counts[w] = counts.get(w, 0) + 1
        return counts

    def _make_excerpt(self, transcript, max_chars=220):
        sentences = re.split(r'(?<=[.!?])\s+', transcript)
        excerpt = ""
        for sent in sentences:
            if len(excerpt) + len(sent) > max_chars:
                break
            excerpt += (" " if excerpt else "") + sent
        return excerpt.strip() or transcript[:max_chars]


deepgram_service = DeepgramService()