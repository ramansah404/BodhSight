from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def get_dashboard_summary():
    return {"message": "Not implemented yet. Will return consolidated academic dashboard metrics."}
