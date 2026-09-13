# BodhSight
**AI-Powered Institutional Governance & Academic Telemetry Platform**

BodhSight is a full-stack, enterprise-grade academic analytics platform designed for Deans, HODs, and Faculty. It securely extracts, analyzes, and visualizes institutional data to detect statistical anomalies, track at-risk student cohorts, and trigger pedagogical interventions in real-time.

## Features
- **Strict Role-Based Access Control (RBAC):** Every SQL query and dashboard metric is hard-filtered at the database level by the user's Department and Role (Chairman, Dean, HOD, Faculty).
- **Agent 10 Anomaly Engine:** Automatically detects statistical deviations (e.g., unusual pass rate drops) and flags them for review.
- **At-Risk Cohort Tracking:** Real-time analysis of student backlogs and performance, allowing immediate interventions.
- **Live Data Ingestion:** Faculty can directly upload raw CSV files (`Roll No`, `Attendance`, `CGPA`, `Backlogs`). The backend automatically parses, normalizes, and injects the data into the live PostgreSQL views.
- **Universal Exports:** Every intelligence table can be exported to Excel, PDF, or Word with a single click.

## Tech Stack
- **Frontend:** React, TypeScript, Vite, Tailwind CSS, Framer Motion, Recharts
- **Backend:** FastAPI, Python, SQLAlchemy, Uvicorn
- **Database:** PostgreSQL (Supabase) with Materialized Views
- **Architecture:** Zero-cache, real-time analytics loop (No UI mock data).

## Running Locally

### 1. Backend (FastAPI)
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate  # Windows
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

### 2. Frontend (React/Vite)
```bash
cd frontend
npm install
npm run dev
```

## Hackathon Demo Instructions
1. Login as `Faculty` (e.g., CSE Department).
2. Go to **Data Hub** and upload the provided `sample_data.csv` to simulate a bulk data ingestion.
3. Observe how the frontend **Dashboard** and **Students (At-Risk)** tabs instantly reflect the changes without needing a page reload.
4. Switch your role to `HOD (ECE)` and observe how the CSE data is completely hidden due to strict RBAC.

---
Built for speed, security, and actionable intelligence.
