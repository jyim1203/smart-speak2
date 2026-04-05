"""
Twelve Labs service (SDK v1.x compatible).

Handles:
- Creating/reusing a SpeakIQ index
- Uploading + indexing a video (task-based)
- Running a Pegasus generate task for visual speech signals
"""

import asyncio
import json
import os
import re
from twelvelabs import TwelveLabs
from app.config import get_settings
from twelvelabs import IndexesCreateRequestModelsItem

settings = get_settings()


class TwelveLabsService:
    def __init__(self):
        self.client = TwelveLabs(api_key=settings.twelvelabs_api_key)
        self._index_id: str | None = None

    def _get_or_create_index(self) -> str:
        if self._index_id:
            return self._index_id

        for idx in self.client.indexes.list():
            if idx.index_name == settings.twelvelabs_index_name:
                self._index_id = idx.id
                return self._index_id

        created = self.client.indexes.create(
            index_name=settings.twelvelabs_index_name,
            models=[
                IndexesCreateRequestModelsItem(model_name="marengo3.0", model_options=["visual", "audio"]),
                IndexesCreateRequestModelsItem(model_name="pegasus1.2", model_options=["visual", "audio"]),
            ],
        )
        self._index_id = created.id
        return self._index_id

    async def upload_and_index(self, video_path: str, on_progress=None) -> str:
        loop = asyncio.get_event_loop()
        def _upload():
            import time
            index_id = self._get_or_create_index()
            with open(video_path, "rb") as f:
                mime = "video/mp4" if video_path.endswith(".mp4") else "video/webm"
                task = self.client.tasks.create(
                    index_id=index_id,
                    video_file=(os.path.basename(video_path), f, mime),
                )
            while True:
                t = self.client.tasks.retrieve(task.id)
                if t.status == "ready":
                    return t.video_id
                if t.status == "failed":
                    raise RuntimeError(f"Indexing failed: {t.status}")
                if on_progress:
                    on_progress(40)
                time.sleep(5)
        return await loop.run_in_executor(None, _upload)

    async def analyze_video(self, video_id: str) -> dict:
        loop = asyncio.get_event_loop()

        prompt = """Analyze this public speaking video. Return ONLY valid JSON (no markdown) with these exact keys:
{
  "eye_contact": <int 0-100, % of time looking at camera>,
  "posture": <int 0-100, posture and stillness quality>,
  "confidence": <int 0-100, confidence from body language>,
  "facial_expressiveness": <int 0-100, how animated/engaged the face is>,
  "movement_quality": <int 0-100, purposeful vs distracting gestures>,
  "notable_behaviors": ["<specific observed behavior>", ...],
  "video_duration_seconds": <int>
}"""

        def _generate():
            result = self.client.analyze(video_id=video_id, prompt=prompt)
            return result.data if hasattr(result, "data") else str(result)

        raw = await loop.run_in_executor(None, _generate)
        cleaned = re.sub(r"```(?:json)?", "", raw).strip().rstrip("`").strip()

        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            match = re.search(r'\{[\s\S]+\}', cleaned)
            if match:
                return json.loads(match.group(0))
            return {
                "eye_contact": 50, "posture": 50, "confidence": 50,
                "facial_expressiveness": 50, "movement_quality": 50,
                "notable_behaviors": [], "video_duration_seconds": 0,
            }

    async def cleanup_video(self, video_id: str) -> None:
        try:
            loop = asyncio.get_event_loop()
            index_id = self._get_or_create_index()
            def _delete():
                self.client.indexes.videos.delete(index_id=index_id, id=video_id)
            await loop.run_in_executor(None, _delete)
        except Exception:
            pass


twelvelabs_service = TwelveLabsService()
