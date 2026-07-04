# VidyaVibe - Agentic Education Platform

VidyaVibe is a production-grade multi-agent learning platform that leverages LangGraph and Gemini models to create personalized, interactive, and intelligent educational experiences.

## Core Features & Usage Guide

### 1. Concept Forge (Syllabus to 3D Graph)
Smash your syllabus into a navigable 3D Knowledge Graph!
* **Input**: Upload a Syllabus file (PDF) and type a specific Topic (e.g., "Machine Learning Basics").
* **Output**: An interactive 3D node-based graph that maps out all the prerequisite concepts, core concepts, and their relationships.
* **How it works**: 
  1. The backend parses your uploaded PDF into text chunks, embeds them using Gemini's `gemini-embedding-2` model, and stores them in a MongoDB Atlas Vector Search index.
  2. A LangGraph extraction agent searches the vector database for your topic and generates a structured JSON graph (Nodes and Edges).
  3. The frontend renders this graph in an interactive 3D space using `react-force-graph-3d`.

### 2. Glass-Box Viva (Interactive Examiner)
Defend your knowledge against an AI examiner that actually listens to your reasoning!
* **Input**: Type a topic you want to be tested on (e.g., "Python Basics"). Once started, provide text answers to the examiner's questions.
* **Output**: The AI will ask you a series of probing, Socratic questions. After evaluating your answers, it provides constructive feedback and dynamically adjusts the next question. Upon completion, a final report is generated.
* **How it works**: 
  1. Powered by a stateful LangGraph agent that maintains conversational context. 
  2. The agent uses RAG to fetch ground-truth knowledge on the topic.
  3. It generates an evaluation (scoring your answer and leaving internal "reasoning" traces) before formulating the next question. State is persisted in MongoDB.

### 3. Spec-to-Course Compiler
Turn a single learning goal into a fully interactive course pipeline.
* **Input**: A high-level learning goal (e.g., "Master Frontend Development in React").
* **Output**: A structured course featuring multiple modules and interactive checkpoints.
* **How it works**: 
  1. A "Drafting" agent takes your goal and writes a detailed, Markdown-formatted course specification.
  2. Once approved, a "Deploying" agent compiles the markdown into structured database records (Modules, Checkpoints, Quizzes).
  3. You can then navigate through the course and submit checkpoint answers, which are evaluated by the AI in real-time.

### 4. Study Squad (Peer Negotiation)
Automated study group scheduling driven by AI agents.
* **Input**: A comma-separated list of User IDs (your peers).
* **Output**: A finalized study session time that works for everyone.
* **How it works**: 
  1. When initiated, an AI agent representing the initiator proposes a time.
  2. The system simulates a negotiation where agents representing the other users evaluate the proposal against their own constraints.
  3. The agents counter-propose or accept until a consensus is reached, shifting the group status to "Confirmed".

### 5. Skill Exchange
Equip your agents with community superpowers!
* **Input**: Browse the library of available AI skills (e.g., "Code Debugger Mentor" or "Feynman Technique Tutor") and click "Install".
* **Output**: Your personal AI adopts new behaviors, prompts, and pedagogical techniques.
* **How it works**: 
  1. Retrieves curated "Skill Profiles" which act as advanced system instructions and context modifiers.
  2. When an agent is invoked in features like the Viva or Courses, it injects these installed skills to change the personality and teaching methodology of the LLM.

## Tech Stack
* **Frontend**: Next.js 16 (App Router), React 19, TailwindCSS, Motion (Framer Motion)
* **Backend**: FastAPI, Python 3.12, Uvicorn
* **AI/Agents**: Google GenAI SDK (Gemini 2.5 Flash, Gemini Embeddings), LangGraph, Cachetools
* **Database**: MongoDB (with Atlas Vector Search)
