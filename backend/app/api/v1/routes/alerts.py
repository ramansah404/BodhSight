from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db import queries

router = APIRouter()

@router.get("/")
def get_alerts(db: Session = Depends(get_db)):
    """Open risk flags from agentops.v_open_flags as alerts."""
    flags = queries.get_open_flags(db)
    alerts = []
    sev_map = {"WATCH": "INFO", "MODERATE": "WARNING", "HIGH": "URGENT", "CRITICAL": "CRITICAL"}
    for f in flags:
        alerts.append({
            "alert_id": str(f.get("risk_flag_id", "")),
            "severity": sev_map.get(f.get("severity", "MODERATE"), "WARNING"),
            "title": f.get("flag_type", "").replace("_", " ").title(),
            "body": f.get("deviation_summary", ""),
            "agent_code": f.get("agent_code"),
            "status": f.get("status"),
            "raised_at": f["raised_at"].isoformat() if f.get("raised_at") else None,
            "respond_by": f["respond_by"].isoformat() if f.get("respond_by") else None,
            "is_overdue": f.get("is_overdue", False),
            "age_hours": f.get("age_hours"),
            "suggested_action": f.get("suggested_first_action"),
            "source": "agentops.v_open_flags",
        })
    return alerts
