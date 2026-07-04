import asyncio
from app.db.client import get_collection

async def check():
    col = await get_collection("concept_graphs")
    docs = col.find().sort("updated_at", -1).limit(5)
    async for d in docs:
        print(f"ID: {d.get('_id')}, Status: {d.get('status')}, Error: {d.get('error')}")

if __name__ == "__main__":
    asyncio.run(check())
