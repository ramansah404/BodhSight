from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def get_performance_metrics():
    return {"message": "Not implemented yet. Will return deterministic performance analytics."}
