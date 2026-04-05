"""
Analysis pipeline.

Orchestrates the full analysis flow:
1. Upload to Twelve Labs + index (visual analysis)
2. Transcribe with Deepgram (audio analysis)  
3. Generate coaching report with Gemini
4. Cleanup temp files + Twelve Labs video
"""

import asyncio
import os
import tempfile
from app.services.twelvelabs_service import twelvelabs_service
from app.services.deepgram_service import deepgram_service
from app.services.gemini_service import gemini_service
from app.models.job_store import update_job
from app.models.schemas import AnalysisResult


async def run_analysis_pipeline(
    job_id: str,
    video_path: str,
) -> AnalysisResult:
    """
    Run the full analysis pipeline for a video file.
    Updates job progress throughout.
    """
    tl_video_id = None

    try:
        await update_job(job_id, progress=10, status="processing")

        # Step 1: Run Twelve Labs indexing and Deepgram transcription in parallel
        # (both can start from the local file simultaneously)
        await update_job(job_id, progress=15)

        tl_task = twelvelabs_service.upload_and_index(video_path)
        dg_task = deepgram_service.transcribe(video_path)

        results = await asyncio.gather(tl_task, dg_task, return_exceptions=True)

        tl_result, dg_result = results

        if isinstance(tl_result, Exception):
            raise RuntimeError(f"Twelve Labs error: {tl_result}")
        if isinstance(dg_result, Exception):
            raise RuntimeError(f"Deepgram error: {dg_result}")

        tl_video_id = tl_result
        audio_data = dg_result

        await update_job(job_id, progress=60)

        # Step 2: Visual analysis from Twelve Labs
        visual_data = await twelvelabs_service.analyze_video(tl_video_id)

        await update_job(job_id, progress=80)

        # Step 3: Gemini coaching report
        coaching_result = await gemini_service.generate_coaching_report(
            visual_data=visual_data,
            audio_data=audio_data,
        )

        await update_job(
            job_id,
            progress=100,
            status="complete",
            result=coaching_result,
        )

        return coaching_result

    except Exception as e:
        await update_job(job_id, status="error", error=str(e))
        raise

    finally:
        # Clean up temp video file
        try:
            os.unlink(video_path)
        except OSError:
            pass

        # Clean up Twelve Labs video (no need to store it)
        if tl_video_id:
            await twelvelabs_service.cleanup_video(tl_video_id)
