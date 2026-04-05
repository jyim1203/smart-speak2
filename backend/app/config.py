from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # API Keys
    twelvelabs_api_key: str
    deepgram_api_key: str
    gemini_api_key: str

    # Supabase (for video upload storage)
    supabase_url: str
    supabase_service_key: str
    supabase_bucket: str = "speakiq-videos"

    # Redis (for job queue)
    redis_url: str = "redis://localhost:6379"

    # App
    backend_url: str = "http://localhost:8000"
    frontend_url: str = "http://localhost:3000"
    max_video_size_mb: int = 500
    max_video_duration_seconds: int = 600  # 10 min

    # Twelve Labs
    twelvelabs_index_name: str = "speakiq-analysis"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
