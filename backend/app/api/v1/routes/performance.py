from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
import app.agents.agent10 as agent10

router = APIRouter()

@router.get("/")
def get_performance_metrics(db: Session = Depends(get_db)):
    return {
        "courses": agent10.compute_course_performance(db),
        "departments": agent10.compute_department_performance(db),
    }

@router.get("/courses")
def get_course_performance(db: Session = Depends(get_db)):
    return agent10.compute_course_performance(db)

@router.get("/departments")
def get_department_performance(db: Session = Depends(get_db)):
    return agent10.compute_department_performance(db)
