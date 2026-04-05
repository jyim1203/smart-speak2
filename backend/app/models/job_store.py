import asyncio
from typing import Optional
from app.models.schemas import JobStatus, AnalysisResult


# Simple in-memory store. For production, replace with Redis.
_jobs: dict[str, JobStatus] = {}
_lock = asyncio.Lock()


async def create_job(job_id: str) -> JobStatus:
    async with _lock:
        job = JobStatus(jobId=job_id, status="processing", progress=0)
        _jobs[job_id] = job
        return job


async def get_job(job_id: str) -> Optional[JobStatus]:
    return _jobs.get(job_id)


async def update_job(
    job_id: str,
    *,
    status: Optional[str] = None,
    progress: Optional[int] = None,
    result: Optional[AnalysisResult] = None,
    error: Optional[str] = None,
) -> Optional[JobStatus]:
    async with _lock:
        job = _jobs.get(job_id)
        if not job:
            return None
        if status is not None:
            job.status = status
        if progress is not None:
            job.progress = progress
        if result is not None:
            job.result = result
        if error is not None:
            job.error = error
        return job


async def delete_job(job_id: str) -> None:
    async with _lock:
        _jobs.pop(job_id, None)
