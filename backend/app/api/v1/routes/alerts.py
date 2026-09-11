from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def get_alerts():
    return {"message": "Not implemented yet. Will return proactive exception alerts."}
