"""Gemini API helpers with retry, caching, and streaming support."""
import asyncio
import hashlib
import json
import time
from typing import AsyncGenerator, Optional, List

from google import genai
from google.genai import types
from cachetools import TTLCache

from app.core.config import settings

_client: genai.Client = None
_response_cache = TTLCache(maxsize=500, ttl=3600)
_embedding_cache = TTLCache(maxsize=1000, ttl=86400)


def get_gemini_client() -> genai.Client:
    global _client
    if _client is None:
        _client = genai.Client(api_key=settings.GEMINI_API_KEY)
    return _client


def _cache_key(model: str, prompt: str) -> str:
    return hashlib.sha256(f"{model}:{prompt}".encode()).hexdigest()


async def generate_text(
    prompt: str,
    model: Optional[str] = None,
    system_instruction: Optional[str] = None,
    temperature: float = 0.7,
    use_cache: bool = True,
    max_retries: int = 5,
) -> str:
    model = model or settings.MODEL_CHAT
    cache_k = _cache_key(model, prompt + (system_instruction or ""))

    if use_cache and cache_k in _response_cache:
        return _response_cache[cache_k]

    client = get_gemini_client()
    config = types.GenerateContentConfig(
        temperature=temperature,
    )
    if system_instruction:
        config.system_instruction = system_instruction

    for attempt in range(max_retries):
        try:
            response = await asyncio.to_thread(
                client.models.generate_content,
                model=model,
                contents=prompt,
                config=config,
            )
            text = response.text or ""
            if use_cache:
                _response_cache[cache_k] = text
            return text
        except Exception as e:
            error_str = str(e)
            if "429" in error_str or "RESOURCE_EXHAUSTED" in error_str:
                if attempt == max_retries - 1:
                    raise
                wait = min(2 ** attempt * 2, 60)
                await asyncio.sleep(wait)
            elif attempt < max_retries - 1:
                await asyncio.sleep(1)
            else:
                raise


async def generate_text_streaming(
    prompt: str,
    model: Optional[str] = None,
    system_instruction: Optional[str] = None,
    temperature: float = 0.7,
) -> AsyncGenerator[str, None]:
    model = model or settings.MODEL_CHAT
    client = get_gemini_client()
    config = types.GenerateContentConfig(
        temperature=temperature,
    )
    if system_instruction:
        config.system_instruction = system_instruction

    for attempt in range(5):
        try:
            response = await asyncio.to_thread(
                client.models.generate_content,
                model=model,
                contents=prompt,
                config=config,
            )
            text = response.text or ""
            chunk_size = 50
            for i in range(0, len(text), chunk_size):
                yield text[i:i + chunk_size]
                await asyncio.sleep(0.05)
            return
        except Exception as e:
            if "429" in str(e) and attempt < 4:
                await asyncio.sleep(2 ** attempt * 2)
            else:
                raise


async def generate_embedding(text: str, model: Optional[str] = None) -> List[float]:
    model = model or settings.MODEL_EMBED
    cache_k = _cache_key("embed", text)

    if cache_k in _embedding_cache:
        return _embedding_cache[cache_k]

    client = get_gemini_client()

    for attempt in range(5):
        try:
            response = await asyncio.to_thread(
                client.models.embed_content,
                model=model,
                contents=text,
            )
            embedding = response.embeddings[0].values
            _embedding_cache[cache_k] = embedding
            return embedding
        except Exception as e:
            if "429" in str(e) and attempt < 4:
                await asyncio.sleep(2 ** attempt * 2)
            else:
                raise


async def generate_json(
    prompt: str,
    model: Optional[str] = None,
    system_instruction: Optional[str] = None,
    temperature: float = 0.3,
    use_cache: bool = True,
) -> dict:
    text = await generate_text(
        prompt=prompt,
        model=model,
        system_instruction=system_instruction,
        temperature=temperature,
        use_cache=use_cache,
    )
    text = text.strip()
    if text.startswith("```json"):
        text = text[7:]
    if text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    text = text.strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        start = text.find("{")
        end = text.rfind("}") + 1
        if start >= 0 and end > start:
            return json.loads(text[start:end])
        start = text.find("[")
        end = text.rfind("]") + 1
        if start >= 0 and end > start:
            return json.loads(text[start:end])
        raise
