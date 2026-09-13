import os
import json
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from app.db.queries import get_weakest_question
from app.agents.agent10.llm import generate_auto_tutor

engine = create_engine('[REDACTED]')
SessionLocal = sessionmaker(bind=engine)

db = SessionLocal()

# Get the UUID of 24CSE005
student_res = db.execute(text("SELECT student_id FROM people.student WHERE roll_no = '24CSE005'"))
student_id = student_res.scalar()

if not student_id:
    print("Student not found!")
else:
    print(f"Testing for student_id: {student_id}")
    weakest = get_weakest_question(db, str(student_id))
    print("Weakest Question DB data:")
    print(json.dumps(weakest, indent=2, default=str))

    if weakest:
        ai_output = generate_auto_tutor(weakest)
        print("\nAI Output:")
        print(json.dumps(ai_output, indent=2))
