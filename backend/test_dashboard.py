from app.db.session import get_db
from app.agents.agent10.analytics import compute_dashboard_metrics
print("Starting...")
try:
    db = next(get_db())
    print("Got DB session.")
    res = compute_dashboard_metrics(db)
    print("Success:", res)
except Exception as e:
    print("Error:", e)
