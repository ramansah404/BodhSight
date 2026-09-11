# Development Workflow

## One-Command Startup

BodhSight uses a consolidated development command to start both the Frontend and Backend simultaneously.

To start the local development environment, run the following from the **project root**:

```bash
npm run dev
```

This uses `concurrently` to launch:
1. **Frontend:** Vite React app on `http://localhost:5173`
2. **Backend:** FastAPI Uvicorn server on `http://localhost:8000`

## Environment Variables

Configuration is driven by `.env`. Use `.env.example` as a template.
Important variables:
- `APP_ENV`: Environment (development/production)
- `CORS_ORIGINS`: JSON list of allowed origins (e.g., `["http://localhost:5173"]`)
- `DATABASE_URL`: Connection string for PostgreSQL

The Frontend API client uses `VITE_API_BASE_URL` to connect to the backend (defaults to `http://localhost:8000/api/v1`).

## Local Development Ports
- Frontend: `5173`
- Backend API: `8000`
- PostgreSQL (Docker): `5432`

## API Structure & Integration
- API routes are organized under `backend/app/api/v1/routes/`.
- External Agent Integrations are abstracted via interfaces in `backend/app/adapters/`.
- The Database architecture follows a strict Database-First boundary. SQLAlchemy models will map exactly to the provided university SQL schema.
