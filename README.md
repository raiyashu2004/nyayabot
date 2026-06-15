<div align="center">
  <img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/scale.svg" width="80" height="80" alt="JurisAI Logo" />
  <h1>JurisAI — Indian Legal AI Assistant</h1>
  <p>An AI-powered legal research and drafting platform built for Indian advocates and law students. Powered by Google Gemini and FastAPI.</p>

  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#architecture">Architecture</a>
</div>

<br/>

## ⚖️ Overview

JurisAI is a modern legal tech application designed to solve the biggest pain points in Indian legal practice: endless precedent searching, manual contract review, and formatting standard drafts. 

Unlike generic AI chat tools, JurisAI strictly operates within the boundaries of Indian law (Constitution, IPC/BNS, CrPC, etc.) and utilizes **LangChain** conversational memory to provide deep, contextual legal analysis.

## ✨ Features

- **Smart Legal Research**: Ask complex legal questions and get plain-English answers backed by Indian case law and bare acts.
- **Persistent Chat Sessions**: True ChatGPT-style conversational memory with chat history stored securely in your browser's local cache.
- **Domain Guardrails**: Automatically force the AI into specific legal contexts (e.g., Criminal, Civil, Family) for highly accurate answers.
- **Document Analyzer**: Upload legal documents for instant AI review, summarization, and risk flagging.
- **Drafting Assistant**: Generate standard bail applications, writ petitions, and legal notices with proper Indian court formatting.

## 🛠 Tech Stack

- **Frontend**: React 18, Vite, Vanilla CSS
- **Backend**: Python, FastAPI, LangChain
- **AI Engine**: Google Gemini (`gemini-3.1-flash-lite`)
- **Hosting**: Vercel (Frontend) & Render (Backend)

## 🚀 Quick Start (Local Development)

### 1. Clone the repository
```bash
git clone https://github.com/raiyashu2004/nyayabot.git
cd nyayabot
```

### 2. Setup the Backend (FastAPI)
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows use `.venv\Scripts\activate`
pip install -r requirements.txt
```

Create a `.env` file in the `backend/` directory:
```env
GEMINI_API_KEY=your_google_gemini_api_key
```

Start the backend server:
```bash
uvicorn main:app --reload --port 10000
```

### 3. Setup the Frontend (React)
Open a new terminal window:
```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend/` directory:
```env
VITE_BACKEND_URL=http://localhost:10000
```

Start the frontend development server:
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

## 🏗 Architecture Note
This application utilizes a decoupled architecture to ensure smooth AI streaming and avoid rate limits:
- The **Frontend** is a lightweight React SPA that manages UI, rendering, and zero-cost persistent chat history using the browser's `localStorage`.
- The **Backend** is a FastAPI service that acts as a secure LangChain proxy, managing the heavy lifting of AI orchestration, context injection, and API key security. It is currently configured to run seamlessly on a free-tier hosting plan (Render) without requiring a provisioned PostgreSQL database.

## 📜 Disclaimer
JurisAI is an AI assistant intended for research and drafting assistance. It is **not a substitute for qualified legal counsel**. Always verify citations and legal advice with an advocate enrolled with the Bar Council of India before submitting documents to a court of law.

---
*Built with ❤️ for the Indian Legal Community.*
