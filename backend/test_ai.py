import asyncio
import sys
import os
from dotenv import load_dotenv

load_dotenv()
sys.path.append(os.path.dirname(__file__))

from app.agents.viva_graph import generate_examiner_question

async def test_viva():
    print("Testing Viva Examiner Agent...")
    try:
        question_data = await generate_examiner_question(
            "Photosynthesis",
            [],
            1,
            ""
        )
        print("--- SUCCESS ---")
        print(f"Question: {question_data['question']}")
        print(f"Reasoning: {question_data['trace']['reasoning']}")
    except Exception as e:
        print("--- ERROR ---")
        print(str(e))
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(test_viva())
