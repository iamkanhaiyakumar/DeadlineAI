# DeadlineAI – Autonomous Multi-Agent Productivity Operating System

DeadlineAI is an autonomous multi-agent productivity operating system that continuously monitors deadlines, predicts risks, coordinates specialized AI agents, and proactively helps users complete work before they miss commitments.

Built using **React + TypeScript + Tailwind CSS** on the frontend, and **Node.js + Express + TypeScript** on the backend, DeadlineAI utilizes the **Google Gemini API** (via Google AI Studio) for advanced agent reasoning and **Firebase/Firestore** for secure data storage.

---

## Key Features

1. **Reasoning Coordinator Orchestrator**: Manages logical dependencies and loopback execution of agents.
2. **7 Specialized Agents**:
   - **Planner Agent**: Decomposes user goals into actionable subtasks.
   - **Priority Agent**: Computes dynamic scores (Urgency, Importance, Complexity, Delays) with AI explanations.
   - **Scheduler Agent**: Scans availability and blocks "Focus Slots" in Google Calendar.
   - **Risk Prediction Agent**: Compares remaining work hours with calendar openings to raise alerts (Why, Why Now, Consequence).
   - **Execution Agent**: Interfaces with focus timers (Pomodoro) to track actual task completion speeds.
   - **Memory Agent**: Refines user profile preferences (study hours, focus fatigue) over time.
   - **Reflection Agent**: Evaluates daily performance nightly and outputs next-day adjustments.
3. **AI Thinking Timeline Panel**: A visual dashboard widget that exposes the background agent trace steps to the user.
4. **Google Integrations**: Preconfigured for Firebase Authentication (Google Sign-In), Google Calendar API, and Google Tasks API.
5. **Robust Mock Mode**: If `GEMINI_API_KEY` or Firebase environment variables are not supplied, DeadlineAI automatically runs in **Mock Mode**, providing rich rule-based simulations so the app is instantly evaluable out-of-the-box.

---

## File Structure

```text
/
├── frontend/                 # React + Vite + TypeScript (Tailwind & custom glassmorphism)
│   ├── src/
│   │   ├── components/       # TaskMatrix, AgentThinkingTimeline, FocusTimer
│   │   ├── pages/            # Dashboard, Calendar, Copilot (AI agent log), Analytics
│   │   ├── index.css         # Styling variables, custom scrolls and glass panel tokens
│   │   └── main.tsx          # Router and QueryClient config
├── backend/                  # Node.js + Express + TypeScript
│   ├── src/
│   │   ├── agents/           # Orchestrator, Planner, Priority, Scheduler, Risk, etc.
│   │   ├── routes/           # Auth, Tasks, Calendar, Agent Copilot, Analytics
│   │   ├── services/         # Firestore DB service with in-memory local fallback
│   │   ├── server.ts         # Main Express server configuration
│   └── Dockerfile            # Container configuration for Google Cloud Run
├── firebase.json             # Hosting configs for Firebase Hosting
└── README.md                 # Project handbook
```

---

## Quick Start Setup

### 1. Prerequisites
- **Node.js**: v18 or newer.
- **Google AI Studio Key** (Optional): To run with live Gemini API intelligence.

### 2. Configure Environment Variables
Create a `.env` file in the `backend/` directory:
```env
PORT=5000
GEMINI_API_KEY=your_gemini_api_key_here
FIREBASE_PROJECT_ID=your_firebase_project_id_here
```
*(Note: If left empty, the application will fallback to **Mock Mode** automatically).*

### 3. Install & Start Backend Server
```bash
cd backend
npm install
npm run dev
```
The backend server runs on `http://localhost:5000`.

### 4. Install & Start Frontend Client
In a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
The Vite development server will open (usually on `http://localhost:5173`).

---

## Verification & Deployment

### Local Build Testing
Ensure all TypeScript compilation passes:
- Backend: `cd backend && npm run build`
- Frontend: `cd frontend && npm run build`

### Cloud Deployment
1. **Backend**: Build and deploy the Docker container to **Google Cloud Run**:
   ```bash
   gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/deadlineai-backend backend/
   gcloud run deploy deadlineai-backend --image gcr.io/YOUR_PROJECT_ID/deadlineai-backend --platform managed
   ```
2. **Frontend**: Deploy static files to **Firebase Hosting**:
   ```bash
   firebase deploy --only hosting
   ```
