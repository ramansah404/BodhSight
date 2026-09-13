import json
import os

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

from app.agents.agent10.llm import generate_auto_tutor
from app.db.queries import get_weakest_question


load_dotenv()
database_url = os.getenv("DATABASE_URL")
if not database_url:
    raise SystemExit("DATABASE_URL must be set in ignored environment configuration.")

engine = create_engine(database_url)
SessionLocal = sessionmaker(bind=engine)

with SessionLocal() as db:
    student_id = db.execute(
        text("SELECT student_id FROM people.student WHERE roll_no = '24CSE005'")
    ).scalar()

    if not student_id:
        raise SystemExit("Student 24CSE005 was not found.")

    weakest = get_weakest_question(db, str(student_id))
    print(json.dumps(weakest, indent=2, default=str))
    if weakest:
        print(json.dumps(generate_auto_tutor(weakest), indent=2))
