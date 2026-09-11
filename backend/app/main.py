from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings

app = FastAPI(title=settings.APP_NAME, openapi_url=f"{settings.API_V1_STR}/openapi.json")

# Set all CORS enabled origins
if settings.CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
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

# Placeholders for future routers
app.include_router(dashboard.router, prefix=f"{settings.API_V1_STR}/dashboard", tags=["Dashboard"])
app.include_router(performance.router, prefix=f"{settings.API_V1_STR}/performance", tags=["Performance"])
app.include_router(trends.router, prefix=f"{settings.API_V1_STR}/trends", tags=["Trends"])
app.include_router(anomalies.router, prefix=f"{settings.API_V1_STR}/anomalies", tags=["Anomalies"])
app.include_router(insights.router, prefix=f"{settings.API_V1_STR}/insights", tags=["Insights"])
app.include_router(alerts.router, prefix=f"{settings.API_V1_STR}/alerts", tags=["Alerts"])
app.include_router(recommendations.router, prefix=f"{settings.API_V1_STR}/recommendations", tags=["Recommendations"])
