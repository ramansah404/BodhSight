from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
import app.agents.agent10 as agent10

router = APIRouter()

@router.get("/")
def get_recommendations(db: Session = Depends(get_db)):
    return agent10.compute_recommendations(db)
