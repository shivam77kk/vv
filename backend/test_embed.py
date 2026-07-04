import os
import asyncio
from dotenv import load_dotenv

load_dotenv()

from google import genai

async def test_embed():
    client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
    try:
        response = client.models.embed_content(
            model="gemini-embedding-2",
            contents="hello world",
        )
        print("gemini-embedding-2 SUCCESS")
    except Exception as e:
        print("gemini-embedding-2 ERROR:", e)

    try:
        response = client.models.embed_content(
            model="gemini-embedding-001",
            contents="hello world",
        )
        print("gemini-embedding-001 SUCCESS")
    except Exception as e:
        print("gemini-embedding-001 ERROR:", e)

if __name__ == "__main__":
    asyncio.run(test_embed())
