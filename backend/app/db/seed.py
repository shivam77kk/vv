"""Seed script — creates demo account with sample data across ALL features."""
import asyncio
import sys
import os
from datetime import datetime, timezone, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from app.core.config import settings
from app.core.security import hash_password
from app.db.client import get_database


async def seed():
    print("Starting seed...")
    db = await get_database()

    users = db["users"]
    existing = await users.find_one({"email": settings.DEMO_USER_EMAIL})
    if existing:
        demo_user_id = str(existing["_id"])
        print(f"Demo user already exists: {demo_user_id}")
    else:
        now = datetime.now(timezone.utc)
        result = await users.insert_one({
            "name": "Demo Aspirant",
            "email": settings.DEMO_USER_EMAIL,
            "phone": settings.DEMO_USER_PHONE,
            "password_hash": hash_password(settings.DEMO_USER_PASSWORD),
            "created_at": now,
            "updated_at": now,
        })
        demo_user_id = str(result.inserted_id)
        print(f"Created demo user: {demo_user_id}")

    buddy_user = await users.find_one({"email": "study_buddy@vidyavibe.com"})
    if not buddy_user:
        result = await users.insert_one({
            "name": "Study Buddy",
            "email": "study_buddy@vidyavibe.com",
            "phone": "9999999999",
            "password_hash": hash_password("StudyBuddy2026!"),
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
        })
        buddy_id = str(result.inserted_id)
        print(f"Created study buddy: {buddy_id}")
    else:
        buddy_id = str(buddy_user["_id"])

    graphs = db["concept_graphs"]
    existing_graph = await graphs.find_one({"user_id": demo_user_id, "topic": "Machine Learning Fundamentals"})
    if not existing_graph:
        now = datetime.now(timezone.utc)
        await graphs.insert_one({
            "_id": "demo_graph_ml_001",
            "topic": "Machine Learning Fundamentals",
            "user_id": demo_user_id,
            "status": "completed",
            "nodes": [
                {"id": "n1", "label": "Supervised Learning", "explanation": "Supervised learning uses labeled training data to learn a mapping from inputs to outputs. The algorithm learns from examples where the correct answer is known.", "analogy": "Like learning with a teacher who tells you the right answer after each attempt.", "trust_score": 92, "status": "verified", "sources": ["ML Textbook Ch.1"], "x": -3, "y": 0, "z": 0},
                {"id": "n2", "label": "Unsupervised Learning", "explanation": "Unsupervised learning finds hidden patterns in data without labeled examples. It discovers the inherent structure of unlabeled data.", "analogy": "Like organizing your bookshelf by finding natural categories without anyone telling you the categories.", "trust_score": 88, "status": "verified", "sources": ["ML Textbook Ch.2"], "x": 3, "y": 0, "z": 0},
                {"id": "n3", "label": "Neural Networks", "explanation": "Neural networks are computing systems inspired by biological neural networks. They consist of layers of interconnected nodes that process information.", "analogy": "Like a chain of decision-makers, where each person adds their perspective before passing the decision forward.", "trust_score": 85, "status": "verified", "sources": ["Deep Learning Ch.1"], "x": 0, "y": 3, "z": 1},
                {"id": "n4", "label": "Loss Functions", "explanation": "Loss functions measure how far a model's predictions are from actual values. They guide the learning process by providing a signal for improvement.", "analogy": "Like a score in a game — it tells you how well you're doing and which direction to improve.", "trust_score": 90, "status": "verified", "sources": ["ML Textbook Ch.3"], "x": -2, "y": 4, "z": -1},
                {"id": "n5", "label": "Gradient Descent", "explanation": "Gradient descent is an optimization algorithm that iteratively adjusts model parameters to minimize the loss function by following the steepest descent.", "analogy": "Like hiking downhill in fog — you feel the slope and take steps in the steepest downward direction.", "trust_score": 95, "status": "verified", "sources": ["Optimization Ch.1"], "x": 2, "y": 4, "z": 0},
                {"id": "n6", "label": "Overfitting", "explanation": "Overfitting occurs when a model learns the training data too well, including noise and outliers, resulting in poor generalization to new data.", "analogy": "Like memorizing exam answers without understanding concepts — you ace the practice test but fail the real one.", "trust_score": 78, "status": "verified", "sources": ["ML Textbook Ch.5"], "x": 0, "y": 6, "z": 1},
            ],
            "edges": [
                {"source": "n1", "target": "n3", "label": "uses"},
                {"source": "n2", "target": "n3", "label": "uses"},
                {"source": "n3", "target": "n4", "label": "optimized_by"},
                {"source": "n4", "target": "n5", "label": "minimized_via"},
                {"source": "n5", "target": "n6", "label": "risk_of"},
            ],
            "trust_scores": {"n1": 92, "n2": 88, "n3": 85, "n4": 90, "n5": 95, "n6": 78},
            "needs_review": [],
            "updated_at": now,
        })
        print("Seeded: ML concept graph")

    existing_graph2 = await graphs.find_one({"user_id": demo_user_id, "topic": "Data Structures"})
    if not existing_graph2:
        await graphs.insert_one({
            "_id": "demo_graph_ds_002",
            "topic": "Data Structures",
            "user_id": demo_user_id,
            "status": "completed",
            "nodes": [
                {"id": "d1", "label": "Arrays", "explanation": "Arrays store elements in contiguous memory locations, allowing O(1) random access by index.", "analogy": "Like numbered lockers in a row — you know exactly which locker to open.", "trust_score": 96, "status": "verified", "sources": ["DSA Ch.1"], "x": -2, "y": 0, "z": 0},
                {"id": "d2", "label": "Linked Lists", "explanation": "Linked lists store elements in nodes connected by pointers, allowing efficient insertions and deletions.", "analogy": "Like a treasure hunt — each clue points to the next location.", "trust_score": 91, "status": "verified", "sources": ["DSA Ch.2"], "x": 2, "y": 0, "z": 0},
                {"id": "d3", "label": "Trees", "explanation": "Trees are hierarchical data structures with a root node and child nodes, enabling efficient searching and sorting.", "analogy": "Like a family tree — each person connects to their children below.", "trust_score": 88, "status": "verified", "sources": ["DSA Ch.4"], "x": 0, "y": 3, "z": 0},
                {"id": "d4", "label": "Hash Tables", "explanation": "Hash tables use a hash function to map keys to array indices for near-O(1) average lookup time.", "analogy": "Like a library catalog — you look up the title to find exactly which shelf the book is on.", "trust_score": 93, "status": "verified", "sources": ["DSA Ch.5"], "x": 0, "y": -3, "z": 0},
            ],
            "edges": [
                {"source": "d1", "target": "d3", "label": "builds_on"},
                {"source": "d2", "target": "d3", "label": "builds_on"},
                {"source": "d1", "target": "d4", "label": "used_in"},
            ],
            "trust_scores": {"d1": 96, "d2": 91, "d3": 88, "d4": 93},
            "needs_review": [],
            "updated_at": datetime.now(timezone.utc),
        })
        print("Seeded: Data Structures concept graph")

    skills = db["skills"]
    existing_skill = await skills.find_one({"name": "Feynman Technique Tutor"})
    if not existing_skill:
        now = datetime.now(timezone.utc)
        await skills.insert_many([
            {
                "name": "Feynman Technique Tutor",
                "description": "Helps break down complex topics using the Feynman technique of explaining simply",
                "instructions_md": "# Feynman Technique Tutor\n\nWhen a student asks about a topic:\n1. Ask them to explain it in simple terms first\n2. Identify gaps in their explanation\n3. Help them fill those gaps with simpler analogies\n4. Repeat until they can explain it to a 5-year-old\n\nAlways be encouraging and focus on understanding over memorization.",
                "full_skill_md": "---\nname: Feynman Technique Tutor\ndescription: Helps break down complex topics using the Feynman technique\nwhen_to_use: When a student struggles to understand a complex concept\n---\n\n# Feynman Technique Tutor\n\nWhen a student asks about a topic:\n1. Ask them to explain it in simple terms first\n2. Identify gaps in their explanation\n3. Help them fill those gaps with simpler analogies\n4. Repeat until they can explain it to a 5-year-old",
                "author_id": demo_user_id,
                "author_name": "Demo Aspirant",
                "status": "published",
                "embedding": [],
                "quality_score": 85,
                "install_count": 42,
                "avg_rating": 4.5,
                "created_at": now - timedelta(days=3),
                "updated_at": now,
            },
            {
                "name": "Spaced Repetition Coach",
                "description": "Creates optimized review schedules based on forgetting curves for any subject",
                "instructions_md": "# Spaced Repetition Coach\n\nHelp students create effective review schedules:\n1. Assess what they've learned and when\n2. Calculate optimal review intervals\n3. Generate a personalized review calendar\n4. Track which concepts need reinforcement\n\nUse the Ebbinghaus forgetting curve as your foundation.",
                "full_skill_md": "---\nname: Spaced Repetition Coach\ndescription: Creates optimized review schedules based on forgetting curves\nwhen_to_use: When a student wants to improve long-term retention\n---\n\n# Spaced Repetition Coach\n\nHelp students create effective review schedules using the Ebbinghaus forgetting curve.",
                "author_id": buddy_id,
                "author_name": "Study Buddy",
                "status": "published",
                "embedding": [],
                "quality_score": 90,
                "install_count": 67,
                "avg_rating": 4.8,
                "created_at": now - timedelta(days=5),
                "updated_at": now,
            },
            {
                "name": "Code Debugger Mentor",
                "description": "Guides students through systematic debugging without giving away the answer",
                "instructions_md": "# Code Debugger Mentor\n\nWhen a student shares buggy code:\n1. Don't give the answer immediately\n2. Ask them to explain what they expect the code to do\n3. Guide them to add print statements at key points\n4. Help them narrow down where the bug might be\n5. Celebrate when they find it themselves\n\nThe goal is to teach debugging skills, not fix bugs.",
                "author_id": demo_user_id,
                "author_name": "Demo Aspirant",
                "status": "published",
                "embedding": [],
                "quality_score": 88,
                "install_count": 31,
                "avg_rating": 4.3,
                "created_at": now - timedelta(days=1),
                "updated_at": now,
            },
        ])
        print("Seeded: 3 skills")

    viva = db["viva_sessions"]
    existing_viva = await viva.find_one({"user_id": demo_user_id, "topic": "Object-Oriented Programming"})
    if not existing_viva:
        now = datetime.now(timezone.utc)
        await viva.insert_one({
            "topic": "Object-Oriented Programming",
            "user_id": demo_user_id,
            "status": "completed",
            "difficulty": 3,
            "score": 78,
            "questions_asked": 4,
            "history": [
                {"role": "examiner", "content": "Can you explain the four main pillars of Object-Oriented Programming?"},
                {"role": "student", "content": "The four pillars are Encapsulation, Inheritance, Polymorphism, and Abstraction. Encapsulation bundles data and methods together, Inheritance allows classes to inherit from others, Polymorphism lets objects take many forms, and Abstraction hides complex implementation details."},
                {"role": "examiner", "content": "Good overview. Can you give a real-world example of polymorphism and explain how it differs from simple method overloading?"},
                {"role": "student", "content": "A real-world example is a Shape class with a draw() method. Circle, Square, and Triangle all override draw() differently. Method overloading is compile-time while polymorphism is runtime."},
                {"role": "examiner", "content": "Interesting distinction. How does the Liskov Substitution Principle relate to inheritance, and when might inheritance be a poor choice?"},
                {"role": "student", "content": "LSP says subtypes should be substitutable for their base types. Inheritance can be bad when there's no true 'is-a' relationship, like making a Square inherit from Rectangle can violate LSP since a Square can't independently resize width and height."},
                {"role": "examiner", "content": "Excellent example with Square/Rectangle. Final question: how does composition compare to inheritance as a design strategy?"},
                {"role": "student", "content": "Composition uses 'has-a' relationships instead of 'is-a'. It's more flexible because you can change behavior at runtime by swapping components. The principle 'favor composition over inheritance' means you should prefer it when possible for better maintainability."},
            ],
            "trace_log": [
                {"node_name": "examiner_agent", "reasoning": "Starting with foundational OOP pillars to gauge baseline knowledge", "latency_ms": 1200, "tokens_used": 156, "confidence": 0.9, "timestamp": (now - timedelta(minutes=20)).isoformat(), "decision": "Generated difficulty-1 question"},
                {"node_name": "answer_evaluator_agent", "reasoning": "Student demonstrated good recall of all four pillars with brief but accurate descriptions", "latency_ms": 800, "tokens_used": 210, "confidence": 0.85, "timestamp": (now - timedelta(minutes=18)).isoformat(), "decision": "Score: 80, Next: dig_deeper"},
                {"node_name": "examiner_agent", "reasoning": "Testing deeper understanding of polymorphism with real-world application", "latency_ms": 950, "tokens_used": 178, "confidence": 0.88, "timestamp": (now - timedelta(minutes=16)).isoformat(), "decision": "Generated difficulty-2 question"},
                {"node_name": "answer_evaluator_agent", "reasoning": "Good example but could elaborate more on runtime vs compile-time distinction", "latency_ms": 750, "tokens_used": 195, "confidence": 0.78, "timestamp": (now - timedelta(minutes=14)).isoformat(), "decision": "Score: 72, Next: new_subtopic"},
                {"node_name": "examiner_agent", "reasoning": "Moving to SOLID principles to test advanced understanding", "latency_ms": 1100, "tokens_used": 190, "confidence": 0.82, "timestamp": (now - timedelta(minutes=12)).isoformat(), "decision": "Generated difficulty-3 question"},
                {"node_name": "answer_evaluator_agent", "reasoning": "Excellent LSP example with Square/Rectangle - shows genuine understanding", "latency_ms": 820, "tokens_used": 225, "confidence": 0.92, "timestamp": (now - timedelta(minutes=10)).isoformat(), "decision": "Score: 85, Next: dig_deeper"},
                {"node_name": "examiner_agent", "reasoning": "Final question on composition vs inheritance to assess design thinking", "latency_ms": 980, "tokens_used": 165, "confidence": 0.87, "timestamp": (now - timedelta(minutes=8)).isoformat(), "decision": "Generated difficulty-3 question"},
                {"node_name": "answer_evaluator_agent", "reasoning": "Good understanding of composition principle with practical reasoning", "latency_ms": 700, "tokens_used": 200, "confidence": 0.84, "timestamp": (now - timedelta(minutes=6)).isoformat(), "decision": "Score: 78, Next: end"},
                {"node_name": "session_end", "reasoning": "Session complete after 4 questions. Average score: 78", "latency_ms": 0, "tokens_used": 0, "confidence": 0.95, "timestamp": (now - timedelta(minutes=5)).isoformat(), "decision": "end_session"},
            ],
            "created_at": now - timedelta(hours=2),
            "updated_at": now,
        })
        print("Seeded: Viva session (OOP)")

    groups = db["study_groups"]
    existing_group = await groups.find_one({"initiator_id": demo_user_id})
    if not existing_group:
        now = datetime.now(timezone.utc)
        await groups.insert_one({
            "initiator_id": demo_user_id,
            "participant_ids": [buddy_id],
            "all_member_ids": [demo_user_id, buddy_id],
            "participants": [
                {"id": demo_user_id, "name": "Demo Aspirant"},
                {"id": buddy_id, "name": "Study Buddy"},
            ],
            "proposed_time": (now + timedelta(days=1, hours=14)).isoformat(),
            "agenda": ["Data Structures", "Algorithm Complexity", "Dynamic Programming"],
            "shared_weak_topics": ["Data Structures", "Algorithm Complexity"],
            "status": "confirmed",
            "consents": {demo_user_id: True, buddy_id: True},
            "negotiation_log": [
                {"agent": "Initiator Agent (Demo Aspirant)", "message": "Initiating study group negotiation for 2 participants.", "timestamp": (now - timedelta(hours=1)).isoformat()},
                {"agent": "Personal Agent (Demo Aspirant)", "message": "Sharing availability: 7 days with free slots available.", "timestamp": (now - timedelta(minutes=55)).isoformat()},
                {"agent": "Personal Agent (Demo Aspirant)", "message": "Sharing weak topics: Data Structures, Algorithm Complexity", "timestamp": (now - timedelta(minutes=53)).isoformat()},
                {"agent": "Personal Agent (Study Buddy)", "message": "Sharing availability: 7 days with free slots available.", "timestamp": (now - timedelta(minutes=50)).isoformat()},
                {"agent": "Personal Agent (Study Buddy)", "message": "Sharing weak topics: Dynamic Programming, Data Structures", "timestamp": (now - timedelta(minutes=48)).isoformat()},
                {"agent": "Negotiator Agent", "message": "Analyzing overlapping availability and shared weak topics...", "timestamp": (now - timedelta(minutes=45)).isoformat()},
                {"agent": "Merge Agent", "message": "Found shared weak topics: Data Structures, Algorithm Complexity, Dynamic Programming. Proposing session.", "timestamp": (now - timedelta(minutes=43)).isoformat()},
                {"agent": "Personal Agent (Demo Aspirant)", "message": "Approved the study session proposal.", "timestamp": (now - timedelta(minutes=40)).isoformat()},
                {"agent": "Personal Agent (Study Buddy)", "message": "Approved the study session proposal.", "timestamp": (now - timedelta(minutes=38)).isoformat()},
                {"agent": "Finalize Agent", "message": "All participants approved! Study session is confirmed.", "timestamp": (now - timedelta(minutes=35)).isoformat()},
            ],
            "created_at": now - timedelta(hours=1),
            "updated_at": now,
        })
        print("Seeded: Study group")

    courses = db["courses"]
    existing_course = await courses.find_one({"user_id": demo_user_id, "goal": "Master Python for Data Science"})
    if not existing_course:
        now = datetime.now(timezone.utc)
        await courses.insert_one({
            "user_id": demo_user_id,
            "goal": "Master Python for Data Science",
            "objectives": [
                "Understand Python data structures and their applications",
                "Master NumPy and Pandas for data manipulation",
                "Create data visualizations with Matplotlib and Seaborn",
                "Apply statistical methods using SciPy",
            ],
            "spec_markdown": "# Learning Spec: Python for Data Science\n\n## Objectives\n- Master Python data structures\n- Learn NumPy and Pandas\n- Create visualizations\n- Apply statistical methods\n\n## Modules\n1. Python Foundations\n2. NumPy Essentials\n3. Pandas Mastery\n4. Data Visualization",
            "modules": [
                {
                    "module_id": "mod_1",
                    "title": "Python Foundations for Data Science",
                    "description": "Core Python concepts essential for data science work",
                    "content": "# Python Foundations\n\nPython is the most popular language for data science...\n\n## Key Topics\n- Lists, tuples, dictionaries\n- List comprehensions\n- Functions and lambda expressions\n- File I/O basics",
                    "status": "passed",
                    "order": 0,
                    "attempts": 1,
                    "checkpoint_questions": [
                        {"question": "What is the time complexity of accessing an element in a Python list by index?", "options": ["A) O(1)", "B) O(n)", "C) O(log n)", "D) O(n²)"], "correct_answer": "A", "explanation": "Python lists use arrays internally, providing O(1) random access."},
                        {"question": "Which data structure uses key-value pairs?", "options": ["A) List", "B) Tuple", "C) Dictionary", "D) Set"], "correct_answer": "C", "explanation": "Dictionaries store key-value pairs with O(1) average lookup."},
                        {"question": "What does a lambda expression create?", "options": ["A) A class", "B) An anonymous function", "C) A module", "D) A generator"], "correct_answer": "B", "explanation": "Lambda creates small anonymous functions inline."},
                    ],
                },
                {
                    "module_id": "mod_2",
                    "title": "NumPy Essentials",
                    "description": "Master NumPy arrays and vectorized operations",
                    "content": "# NumPy Essentials\n\nNumPy is the fundamental package for numerical computing in Python...",
                    "status": "active",
                    "order": 1,
                    "attempts": 0,
                    "checkpoint_questions": [
                        {"question": "What is the main advantage of NumPy arrays over Python lists?", "options": ["A) They can store strings", "B) Vectorized operations are faster", "C) They are mutable", "D) They support mixed types"], "correct_answer": "B", "explanation": "NumPy arrays support vectorized operations that are much faster than Python loops."},
                        {"question": "What does np.reshape() do?", "options": ["A) Sorts the array", "B) Changes the shape without changing data", "C) Removes duplicates", "D) Reverses the array"], "correct_answer": "B", "explanation": "Reshape changes the dimensions while keeping the same data."},
                    ],
                },
                {
                    "module_id": "mod_3",
                    "title": "Pandas Mastery",
                    "description": "Data manipulation and analysis with Pandas DataFrames",
                    "content": "# Pandas Mastery\n\nPandas is built on NumPy and provides high-level data structures...",
                    "status": "locked",
                    "order": 2,
                    "attempts": 0,
                    "checkpoint_questions": [],
                },
                {
                    "module_id": "mod_4",
                    "title": "Data Visualization",
                    "description": "Creating compelling visualizations with Matplotlib and Seaborn",
                    "content": "# Data Visualization\n\nData visualization is crucial for understanding and communicating data insights...",
                    "status": "locked",
                    "order": 3,
                    "attempts": 0,
                    "checkpoint_questions": [],
                },
            ],
            "total_hours": 16,
            "status": "deployed",
            "current_module_index": 1,
            "created_at": now - timedelta(days=2),
            "updated_at": now,
        })
        print("Seeded: Python Data Science course")

    print("\nSeed complete! Demo account ready:")
    print(f"  Email: {settings.DEMO_USER_EMAIL}")
    print(f"  Features seeded: Forge (2 graphs), Skills (3), Viva (1 session), Squad (1 group), Course (1 with passed module)")


if __name__ == "__main__":
    asyncio.run(seed())
