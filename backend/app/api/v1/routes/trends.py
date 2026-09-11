from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def get_trends():
    return {"message": "Not implemented yet. Will return historical academic trends."}
