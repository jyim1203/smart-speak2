"""
Analysis pipeline.
"""

import asyncio
import os
import subprocess
from app.services.twelvelabs_service import twelvelabs_service
from app.services.deepgram_service import deepgram_service
from app.services.gemini_service import gemini_service
from app.models.job_store import update_job
from app.models.schemas import AnalysisResult


async def fix_video_duration(video_path: str) -> str:
    """Remux video with ffmpeg to embed duration metadata."""
    fixed_path = video_path.rsplit('.', 1)[0] + '_fixed.mp4'
    try:
        import shutil
        ffmpeg_bin = shutil.which('ffmpeg') or shutil.which('ffmpeg.exe') or 'ffmpeg'
        result = subprocess.run(
            [ffmpeg_bin, '-i', video_path, '-c:v', 'libx264', '-c:a', 'aac', '-y', fixed_path],
            capture_output=True, timeout=120
        )
        if result.returncode == 0 and os.path.exists(fixed_path) and os.path.getsize(fixed_path) > 0:
            os.unlink(video_path)
            return fixed_path
        else:
            print("ffmpeg stderr:", result.stderr.decode('utf-8', errors='ignore')[-500:])
    except Exception as e:
        print(f"ffmpeg error: {e}")
    return video_path


async def run_analysis_pipeline(
    job_id: str,
    video_path: str,
) -> AnalysisResult:
    tl_video_id = None
    fixed_path = video_path

    try:
        await update_job(job_id, progress=10, status="processing")

        fixed_path = await fix_video_duration(video_path)
        print(f"Using video: {fixed_path}, size: {os.path.getsize(fixed_path)} bytes")

        await update_job(job_id, progress=20)

        tl_task = twelvelabs_service.upload_and_index(fixed_path)
        dg_task = deepgram_service.transcribe(fixed_path)

        results = await asyncio.gather(tl_task, dg_task, return_exceptions=True)
        tl_result, dg_result = results

        if isinstance(tl_result, Exception):
            raise RuntimeError(f"Twelve Labs error: {tl_result}")
        if isinstance(dg_result, Exception):
            raise RuntimeError(f"Deepgram error: {dg_result}")

        tl_video_id = tl_result
        audio_data = dg_result

        await update_job(job_id, progress=60)

        visual_data = await twelvelabs_service.analyze_video(tl_video_id)

        await update_job(job_id, progress=80)

        coaching_result = await gemini_service.generate_coaching_report(
            visual_data=visual_data,
            audio_data=audio_data,
        )

        await update_job(job_id, progress=100, status="complete", result=coaching_result)
        return coaching_result

    except Exception as e:
        await update_job(job_id, status="error", error=str(e))
        raise

    finally:
        for path in set([video_path, fixed_path]):
            try:
                if os.path.exists(path):
                    os.unlink(path)
            except OSError:
                pass
        if tl_video_id:
            await twelvelabs_service.cleanup_video(tl_video_id)