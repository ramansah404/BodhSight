from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def get_anomalies():
    return {"message": "Not implemented yet. Will return detected statistical and rule-based anomalies."}
