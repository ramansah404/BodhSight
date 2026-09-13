import os

from sqlalchemy import create_engine, text
from sqlalchemy.pool import NullPool
from dotenv import load_dotenv


load_dotenv()
database_url = os.getenv("DATABASE_URL")
if not database_url:
    raise SystemExit("DATABASE_URL must be set in ignored environment configuration.")

engine = create_engine(database_url, poolclass=NullPool)

with engine.connect() as conn:
    result = conn.execute(text("""
        SELECT sqm.marks_awarded, pq.question_text, pq.question_number, pq.max_marks,
               cu.unit_title, cu.unit_number, co.code, co.description
        FROM assessment.student_question_mark sqm
        JOIN assessment.paper_question pq ON sqm.paper_question_id = pq.paper_question_id
        LEFT JOIN curriculum.course_unit cu ON pq.course_unit_id = cu.course_unit_id
        LEFT JOIN curriculum.course_outcome co ON pq.course_outcome_id = co.course_outcome_id
        JOIN people.student s ON sqm.student_id = s.student_id
        WHERE s.roll_no = '24CSE005'
    """))
    for row in result:
        print(row)
