"""Core configuration module — all env vars read here, nowhere else."""
import os
from pathlib import Path
from dotenv import load_dotenv

env_path = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(env_path)


class Settings:
    MONGODB_URI: str = os.environ.get("MONGODB_URI", "")
    GEMINI_API_KEY: str = os.environ.get("GEMINI_API_KEY", "")
    MODEL_CHAT: str = os.environ.get("MODEL_CHAT", "gemini-2.5-flash")
    MODEL_LITE: str = os.environ.get("MODEL_LITE", "gemini-2.5-flash-lite")
    MODEL_EMBED: str = os.environ.get("MODEL_EMBED", "gemini-embedding-2")
    JWT_SECRET: str = os.environ.get("JWT_SECRET", "")
    JWT_REFRESH_SECRET: str = os.environ.get("JWT_REFRESH_SECRET", "")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.environ.get("ACCESS_TOKEN_EXPIRE_MINUTES", "15"))
    REFRESH_TOKEN_EXPIRE_DAYS: int = int(os.environ.get("REFRESH_TOKEN_EXPIRE_DAYS", "7"))
    COOKIE_DOMAIN: str = os.environ.get("COOKIE_DOMAIN", "localhost")
    DEMO_USER_EMAIL: str = os.environ.get("DEMO_USER_EMAIL", "")
    DEMO_USER_PHONE: str = os.environ.get("DEMO_USER_PHONE", "")
    DEMO_USER_PASSWORD: str = os.environ.get("DEMO_USER_PASSWORD", "")
    DB_NAME: str = "vidyavibe"


settings = Settings()
