# DeadlineAI – Autonomous Multi-Agent Productivity Operating System

DeadlineAI is an autonomous multi-agent productivity operating system designed to proactively plan, prioritize, analyze calendar conflicts, and schedule deep focus blocks using Google's Gemini LLMs and Firebase before deadlines are missed.

*   **Live Web App (Vercel)**: [https://deadline-ai-liard.vercel.app/](https://deadline-ai-liard.vercel.app/)
*   **Live Backend (Render)**: [https://deadlineai-p6d9.onrender.com](https://deadlineai-p6d9.onrender.com)
*   **Built-in Presentation**: [https://deadline-ai-liard.vercel.app/presentation](https://deadline-ai-liard.vercel.app/presentation)

---

## 🚀 Key Features

1.  **Reasoning Coordinator Orchestrator**: Manages logical dependencies and loops through agent execution pipelines.
2.  **7 Specialized AI Agents**:
    *   **Memory Agent**: Dynamically tracks user preferences and historical delays.
    *   **Planner Agent**: Generates structured step-by-step subtasks from user goals.
    *   **Priority Agent**: Calculates dynamic scores (0-100) using the Eisenhower Matrix model.
    *   **Risk Prediction Agent**: Alerts users when required task duration exceeds calendar free slots.
    *   **Scheduler Agent**: Allocates optimized focus blocks in empty calendar slots.
    *   **Reflection Agent**: Performs nightly retrospective reviews of tasks and completions.
    *   **Analytics Agent**: Computes weekly trends and workload density metrics.
3.  **Agent Network Topography (SVG Graph)**: A real-time network visualization showing glowing active/completed agents during orchestrator runs.
4.  **2-Way Google Calendar Sync**: Imports live events and writes focus blocks back via Google OAuth 2.0.
5.  **Voice-Enabled Assistance**: Voice input powered by the Web Speech API with real-time interim transcription.
6.  **Interactive Notification Center**: Dynamic drop-down panel displaying risk alerts and briefings.

---

## 🛠️ Google Tech Stack Used

*   **Google Gemini SDK (`@google/genai`)**: Powers agent planning, prioritizing, risk assessment, and summary generation.
*   **Firebase Firestore**: Persistent database for storing tasks, profiles, calendar caches, and traces.
*   **Google Calendar API**: Pulls real calendar events and pushes focus slots.
*   **Google OAuth 2.0 Identity**: Secure sign-in consent flow.

---

## 📁 File Structure

```text
/
├── frontend/                 # React + Vite + TypeScript (Vercel)
│   ├── src/
│   │   ├── components/       # TaskMatrix, AgentThinkingTimeline, AgentGraph
│   │   ├── pages/            # Dashboard, Calendar, Copilot, Analytics, Presentation
│   │   ├── App.tsx           # Global Navigation, User Modal, Notification Dropdown
│   │   └── main.tsx          # Router and QueryClient config
│   └── vercel.json           # Vercel Single-Page-App routing configuration
├── backend/                  # Node.js + Express + TypeScript (Render/Docker)
│   ├── src/
│   │   ├── agents/           # Orchestrator, Planner, Priority, Scheduler, Risk, etc.
│   │   ├── routes/           # Auth, Tasks, Calendar, Agent Copilot, Analytics
│   │   ├── services/         # Firestore DB service & Google Calendar sync helpers
│   │   └── server.ts         # Express server configuration
│   └── Dockerfile            # Production Docker container configuration
├── firebase.json             # Hosting configs (Firebase Hosting fallback)
└── README.md                 # Project handbook
```

---

## 🛠️ Local Quick Start

### 1. Configure Env Variables
Create a `.env` in `backend/`:
```env
PORT=5000
NODE_ENV=development
GEMINI_API_KEY=your_gemini_key_here
FIREBASE_SERVICE_ACCOUNT=your_service_account_json_block
FIREBASE_PROJECT_ID=prepwise-b0659
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/callback
FRONTEND_URL=http://localhost:5173
```

Create a `.env` in `frontend/`:
```env
VITE_API_URL=http://localhost:5000/api
VITE_FIREBASE_API_KEY=your_firebase_key
VITE_FIREBASE_AUTH_DOMAIN=prepwise-b0659.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=prepwise-b0659
VITE_FIREBASE_STORAGE_BUCKET=prepwise-b0659.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=413157848448
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=G-L7LX194Z4Q
```

### 2. Run Local Servers
Start Backend:
```bash
cd backend
npm install
npm run dev
```

Start Frontend:
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` to test.

---

## 🚀 Production Deployment Details

### Frontend (Vercel)
1. Set Root Directory to `frontend`.
2. Add Env variable: `VITE_API_URL` pointing to your Render backend API.
3. Deploy!

### Backend (Render)
1. Add new Web Service using Docker environment.
2. Set Root Directory to `backend` and Dockerfile path to `Dockerfile`.
3. Add all variables from `backend/.env`.
4. Deploy!
