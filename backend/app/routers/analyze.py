import uuid
import asyncio
import tempfile
import os
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from app.models.schemas import SubmitResponse, JobStatus
from app.models.job_store import create_job, get_job
from app.services.pipeline import run_analysis_pipeline
from app.config import get_settings

settings = get_settings()
router = APIRouter(prefix="/api/analyze", tags=["analyze"])

ALLOWED_MIME_TYPES = {
    "video/mp4", "video/quicktime", "video/webm",
    "video/x-msvideo", "video/mpeg",
}
MAX_BYTES = settings.max_video_size_mb * 1024 * 1024


@router.post("/submit", response_model=SubmitResponse)
async def submit_video(
    background_tasks: BackgroundTasks,
    video: UploadFile = File(...),
):
    """
    Accept a video upload, save to a temp file, kick off background analysis.
    Returns a jobId to poll for status.
    """
    # Validate mime type
    base_type = (video.content_type or "").split(";")[0].strip()
    if base_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file type: {video.content_type}. Use MP4, MOV, or WebM."
        )

    # Stream to a temp file (don't hold entire file in memory)
    suffix = Path(video.filename or "video.webm").suffix or ".webm"
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    total_bytes = 0

    try:
        while chunk := await video.read(1024 * 1024):  # 1MB chunks
            total_bytes += len(chunk)
            if total_bytes > MAX_BYTES:
                tmp.close()
                os.unlink(tmp.name)
                raise HTTPException(
                    status_code=413,
                    detail=f"File too large. Maximum is {settings.max_video_size_mb}MB."
                )
            tmp.write(chunk)
        tmp.close()
    except HTTPException:
        raise
    except Exception as e:
        tmp.close()
        os.unlink(tmp.name)
        raise HTTPException(status_code=500, detail=str(e))

    # Create job and start background pipeline
    job_id = str(uuid.uuid4())
    await create_job(job_id)

    background_tasks.add_task(run_analysis_pipeline, job_id, tmp.name)

    return SubmitResponse(jobId=job_id)


@router.get("/status/{job_id}", response_model=JobStatus)
async def get_status(job_id: str):
    """Poll for analysis job status and result."""
    job = await get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@router.delete("/job/{job_id}")
async def delete_job_endpoint(job_id: str):
    """Clean up a completed job."""
    from app.models.job_store import delete_job
    await delete_job(job_id)
    return {"deleted": True}
