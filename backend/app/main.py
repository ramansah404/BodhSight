from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from app.core.config import settings
import os
from dotenv import load_dotenv

# Triggering reload to pick up SENDER_EMAIL from .env
load_dotenv(os.path.join(os.path.dirname(__file__), "../../.env"))

app = FastAPI(title=settings.APP_NAME, openapi_url=f"{settings.API_V1_STR}/openapi.json")

# Mount static folder for profile images
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "../uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Guarantee required production origins regardless of Render environment overrides
required_origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://127.0.0.1:5173",
    "https://bodhsight.vercel.app",
    "https://bodhsight-acmqdmpjr-ramansah404-5576s-projects.vercel.app"
]

if settings.CORS_ORIGINS:
    if isinstance(settings.CORS_ORIGINS, str):
        required_origins.extend([o.strip() for o in settings.CORS_ORIGINS.split(",") if o.strip()])
    else:
        required_origins.extend(settings.CORS_ORIGINS)

# Remove duplicates while preserving a predictable order for diagnostics.
final_origins = list(dict.fromkeys(required_origins))

app.add_middleware(GZipMiddleware, minimum_size=1000)

app.add_middleware(
    CORSMiddleware,
    allow_origins=final_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": settings.APP_NAME,
        "environment": settings.APP_ENV,
        "agent": "10"
    }

@app.get(f"{settings.API_V1_STR}/health")
def health_check_v1():
    return {
        "status": "ok",
        "service": settings.APP_NAME,
        "environment": settings.APP_ENV,
        "agent": "10"
    }

from app.api.v1.routes import dashboard, performance, trends, anomalies, insights, alerts, recommendations
from app.api.routers import agent10, notifications, ingestion, crud_data, auth, chat, profile, admin, students

app.include_router(chat.router, prefix=f"{settings.API_V1_STR}", tags=["Agent 10 Chat"])
app.include_router(admin.router, prefix=f"{settings.API_V1_STR}", tags=["Admin"])
app.include_router(agent10.router, prefix=f"{settings.API_V1_STR}/agent10", tags=["Agent 10"])
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["Authentication"])
app.include_router(profile.router, prefix=f"{settings.API_V1_STR}", tags=["Profile"])
app.include_router(crud_data.router, prefix=f"{settings.API_V1_STR}/crud_data", tags=["CRUD"])
app.include_router(students.router, prefix=f"{settings.API_V1_STR}/students", tags=["Students"])
app.include_router(notifications.router, prefix=f"{settings.API_V1_STR}/notifications", tags=["Notifications"])
app.include_router(ingestion.router, prefix=f"{settings.API_V1_STR}/ingestion", tags=["Ingestion"])
# Placeholders for future routers
app.include_router(dashboard.router, prefix=f"{settings.API_V1_STR}/dashboard", tags=["Dashboard"])
app.include_router(performance.router, prefix=f"{settings.API_V1_STR}/performance", tags=["Performance"])
app.include_router(trends.router, prefix=f"{settings.API_V1_STR}/trends", tags=["Trends"])
app.include_router(anomalies.router, prefix=f"{settings.API_V1_STR}/anomalies", tags=["Problems"])
app.include_router(insights.router, prefix=f"{settings.API_V1_STR}/insights", tags=["Insights"])
app.include_router(alerts.router, prefix=f"{settings.API_V1_STR}/alerts", tags=["Alerts"])
app.include_router(recommendations.router, prefix=f"{settings.API_V1_STR}/recommendations", tags=["Recommendations"])
