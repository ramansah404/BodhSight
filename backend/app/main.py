from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from app.core.config import settings

app = FastAPI(title=settings.APP_NAME, openapi_url=f"{settings.API_V1_STR}/openapi.json")

# Guarantee required production origins regardless of Render environment overrides
required_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://bodhsight.vercel.app",
    "https://bodhsight-acmqdmpjr-ramansah404-5576s-projects.vercel.app"
]

if settings.CORS_ORIGINS:
    if isinstance(settings.CORS_ORIGINS, str):
        required_origins.extend([o.strip() for o in settings.CORS_ORIGINS.split(",") if o.strip()])
    else:
        required_origins.extend(settings.CORS_ORIGINS)

# Remove duplicates
final_origins = list(set(required_origins))

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

from app.api.v1.routes import dashboard, performance, trends, anomalies, insights, alerts, recommendations
from app.api.routers import agent10, notifications

app.include_router(agent10.router, prefix=f"{settings.API_V1_STR}/agent10", tags=["Agent 10"])
app.include_router(notifications.router, prefix=f"{settings.API_V1_STR}/notifications", tags=["Notifications"])
# Placeholders for future routers
app.include_router(dashboard.router, prefix=f"{settings.API_V1_STR}/dashboard", tags=["Dashboard"])
app.include_router(performance.router, prefix=f"{settings.API_V1_STR}/performance", tags=["Performance"])
app.include_router(trends.router, prefix=f"{settings.API_V1_STR}/trends", tags=["Trends"])
app.include_router(anomalies.router, prefix=f"{settings.API_V1_STR}/anomalies", tags=["Problems"])
app.include_router(insights.router, prefix=f"{settings.API_V1_STR}/insights", tags=["Insights"])
app.include_router(alerts.router, prefix=f"{settings.API_V1_STR}/alerts", tags=["Alerts"])
app.include_router(recommendations.router, prefix=f"{settings.API_V1_STR}/recommendations", tags=["Recommendations"])
