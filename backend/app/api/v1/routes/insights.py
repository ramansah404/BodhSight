from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
import app.agents.agent10 as agent10

router = APIRouter()

@router.get("/")
def get_insights(db: Session = Depends(get_db)):
    """AI-enhanced insights with deterministic analytics backbone."""
    anomalies = agent10.compute_anomalies(db)
    dashboard = agent10.compute_dashboard_metrics(db)
    summary = agent10.generate_executive_summary(dashboard, anomalies)
    return {
        "executive_summary": summary,
        "total_anomalies": len(anomalies),
        "critical_count": sum(1 for a in anomalies if a.get("severity") == "CRITICAL"),
        "high_count": sum(1 for a in anomalies if a.get("severity") == "HIGH"),
        "top_anomalies": anomalies[:5],
        "llm_status": agent10.llm_status(),
    }
