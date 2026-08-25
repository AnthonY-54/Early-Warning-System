# DWDM: Academic Performance & At-Risk Student Analytics Dashboard

A full-stack web application that helps teachers identify at-risk students early, provides detailed explainability insights, and gives students visibility into their own predicted risk of falling behind — built on a predictive academic data pipeline (OULAD dataset feature contract → ML model prediction service → MongoDB → interactive dashboards).

---

![App Screenshot](assets/App-screenshot.png)

---

## Live Demo

https://dwdm-frontend.vercel.app/

---

## What This Project Does

Two roles, two experiences:

- **Students** sign up with a unique Student ID and immediately get a dashboard showing their engagement metrics, performance timeline, predicted risk level, and personalized feedback.
- **Teachers** sign up with a verified Teacher ID and get a comprehensive cohort early warning system:
  - Multi-criteria filtering (Course + Status) and free-text search across all students.
  - **Analyze Profile Modal**: Detailed student demographics, engagement metrics, progressive timeline charts, and **private teacher notes**.
  - **Priority Interventions Panel**: Real-time cohort alerts for high-risk students, side-by-side engagement comparisons against class averages, and **model-driven risk diagnosis (`top_reasons`)**.

Risk is computed via a trained Machine Learning model (or a transparent fallback formula when offline), providing real SHAP-driven explainability so that every flagged risk status is accompanied by clear, plain-English reasons.

---

## Architecture

```
frontend/          React + Vite + Tailwind CSS (Port 5173)
backend/           Node.js + Express + MongoDB Mongoose (Port 5000)
ml-service/        Python + FastAPI + Scikit-Learn/SHAP (Port 8000)
Database:          MongoDB Atlas (cloud-hosted)
```

**Auth:** JWT-based sessions (2-hour expiry), role-based routing (student/teacher), bcrypt password hashing.

### Data Flow & ML Integration:

```
Student Registration (student_id provided)
        │
        ▼
Validate ID in simulated LMS dataset (fakeLmsData.json)
        │
        ▼
Extract OULAD features & per-milestone academic/behavioral snapshots
        │
        ▼
HTTP POST to Python FastAPI ML Service (/predict) [Sequential per milestone]
        ├── Success ──► Real probability, risk level & SHAP top_reasons
        └── Offline/Error ──► Graceful fallback calculation (logged server-side)
        │
        ▼
Save synced document & milestone predictions into MongoDB Student collection
        │
        ▼
Reshaped dynamically by backend API layer for Student & Teacher Dashboards
```

---

## Key Features

### 1. Authentication & Role-Based Access Control (RBAC)
- Dedicated registration flows for students (Student ID validation) and teachers (verified Teacher ID check).
- JWT session management, protected routes, and role-locked views.

### 2. Student Dashboard
- Real-time risk status badge (Green, Yellow, Red, Black).
- Engagement snapshot (Total VLE clicks, active days, resources viewed).
- Progressive prediction timeline chart over assessment stages.
- Adaptive personalized feedback text based on confidence and risk level.

### 3. Teacher Dashboard
- Cohort aggregate cards (Total cohort, at-risk rate, real-time dropout alerts banner).
- Risk distribution donut chart (recharts).
- **Combined Course + Status Filter**: Two-column side-by-side popover with dynamic course options, multi-select status toggles, combined filter badge counters, and combined `AND` search filtering.

### 4. Analyze Profile & Private Teacher Notes
- Student demographic breakdown (Age band, education, IMD band) and enrollment info.
- Expandable engagement metrics and risk cards.
- **Private Teacher Notes**: Append-only, timestamped, multi-line notes strictly scoped per `(student_id, teacher_id)` pair with server-side authorization enforcement.

### 5. Priority Interventions Panel & Model Explainability
- **Cohort List View**: Filtered to Red and Black risk students, sorted by priority (Black risk first).
- **Student Detail View**:
  - **Section A (Engagement Snapshot)**: Student metrics compared side-by-side against dynamically calculated class averages.
  - **Section B (Model Risk Diagnosis)**: Surfaces top 3 SHAP explainability reasons with category icons (`FileText`, `MousePointer`, `Calendar`, `BookOpen`, `Flag`) and proportional visual impact bars.
  - **Section C (Suggested Actions)**: Action recommendations and interactive cards with 3D CSS flip animation.

---

## What's New in Cycle 2

Cycle 2 introduced major analytical, architectural, and UI enhancements:

- **Phase 1 — Combined Course + Status Filtering**: Two-column popover layout with dynamic course extraction, combined AND logic, and multi-filter clearing.
- **Phase 2 — View Interventions Modal**: Interactive two-screen modal with cohort list view, student detail comparisons, on-the-fly class averages, and card flip UI.
- **Phase 3 — Private Teacher Notes**: Dedicated Mongoose `Note` schema and API routes (`/api/notes`) enabling teachers to leave private, persistent profile notes.
- **Phase 4 — Student Schema Redesign**: Redesigned `Student` schema to align 1:1 with OULAD dataset features (`code_module`, `code_presentation`, `region`, `studied_credits`, etc.) and multi-stage `milestones[]`.
- **Phase 5 — Real ML Model Integration**: Connected Node backend to Python FastAPI ML service (`POST /predict`), computing real predictions and SHAP explainability at signup with graceful fallback.
- **Phase 6 — Surfaced Explainability (`top_reasons`)**: Replaced placeholder weak topics with ranked model-driven diagnostic sentences and proportional impact bars.

---

## Repo Structure

```text
DWDM/
├── backend/
│   ├── data/                    # Simulated LMS data (fakeLmsData.json), valid teacher IDs
│   ├── middleware/              # JWT auth middleware
│   ├── models/                  # Mongoose schemas (User, Student, Note)
│   ├── routes/                  # authRoutes, dashboardRoutes, noteRoutes
│   ├── services/                # mlPredictionService, riskEvaluationService, feedbackService
│   ├── .env.example             # Environment configuration template
│   └── server.js                # Express app entry point
├── frontend/
│   └── src/
│       ├── components/          # InterventionsModal, StudentProfileModal, Sidebar, ProtectedRoute
│       ├── context/             # AuthContext, ThemeContext
│       └── pages/               # Login, Signup, StudentDashboard, TeacherDashboard
├── batch files/
│   ├── start-dwdm.bat           # Starts Frontend + Backend (2 servers)
│   ├── start-dwdm-all.bat       # Starts Frontend + Backend + FastAPI ML Service (3 servers)
│   └── README.md                # Batch script documentation
├── start-dwdm.bat               # Root launcher convenience copy
└── README.md
```

---

## Local Development

### 1. Prerequisites
- Node.js (v18+) & npm
- Python 3.9+ (if running the ML service locally)
- MongoDB Atlas connection string or local MongoDB instance

### 2. Setup Environment Variables
In `backend/.env`:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
FRONTEND_URL=http://localhost:5173
ML_SERVICE_URL=http://localhost:8000
```

In `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000
```

### 3. One-Click Startup (Windows)

- **Standard Stack (Node + React)**:
  Double-click `start-dwdm.bat`
- **Full Stack (FastAPI ML Service + Node + React)**:
  Double-click `start-dwdm-all.bat`

### 4. Manual Startup

```bash
# Terminal 1: Python ML Model Service (optional, fallback available if skipped)
cd ../at-risk-student-model
uvicorn api.main:app --port 8000 --reload

# Terminal 2: Backend
cd backend
npm install
npm run dev

# Terminal 3: Frontend
cd frontend
npm install
npm run dev
```

---

## Design Decisions Worth Knowing About

- **Spec-First Engineering**: Every phase was designed and locked in a formal specification before code execution, ensuring clear API contracts and zero regressions across cycles.
- **Multi-Service Resilience**: The Node backend communicates with the Python ML service with a strict timeout and automatic fallback to placeholder formulas, ensuring student registration never fails even if the ML service is offline.
- **Backend Data Reshaping**: Schema migrations (e.g. flat OULAD fields and `milestones` array) were reshaped at the API route layer, keeping frontend components decoupled and stable.
- **Server-Enforced Note Privacy**: Teacher notes are strictly scoped per `(student_id, teacher_id)` on the server query level, preventing cross-teacher data leaks.

---

## Known Limitations / Future Work

- Weekly/periodic automated re-sync of student records from external LMS.
- Interactive multi-stage milestone historical timeline for ML explainability.
- Multi-teacher collaborative team notes option (toggleable privacy).
- Automated email notification triggers from the intervention panel.