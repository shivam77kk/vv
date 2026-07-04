"""Async MongoDB client with connection pooling via Motor."""
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

_client: AsyncIOMotorClient = None
_db = None


async def get_database():
    global _client, _db
    if _client is None:
        _client = AsyncIOMotorClient(
            settings.MONGODB_URI,
            maxPoolSize=20,
            minPoolSize=5,
            serverSelectionTimeoutMS=5000,
        )
        _db = _client[settings.DB_NAME]
    return _db


async def close_database():
    global _client, _db
    if _client:
        _client.close()
        _client = None
        _db = None


async def get_collection(name: str):
    db = await get_database()
    return db[name]
