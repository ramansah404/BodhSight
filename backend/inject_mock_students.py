import sys
import os
import uuid
import random
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.session import engine
from sqlalchemy import text
import logging

logging.basicConfig(level=logging.INFO)

def inject_mock_students():
    with engine.begin() as conn:
        # 1. Fetch valid foreign keys
        batch = conn.execute(text("SELECT batch_id FROM curriculum.batch LIMIT 1;")).scalar()
        if not batch:
            logging.error("No batch found.")
            return
            
        sections = conn.execute(text("SELECT section_id, code FROM curriculum.section LIMIT 5;")).fetchall()
        section_ids = [s[0] for s in sections]
        if not section_ids:
            logging.error("No sections found.")
            return

        institution = conn.execute(text("SELECT institution_id FROM core.institution LIMIT 1;")).scalar()
        if not institution:
            logging.error("No institution found.")
            return

        # 2. Insert 10 mock students
        # 7 students with high backlogs (>=3) and 3 students with low backlogs (1-2)
        backlog_values = [3, 4, 3, 5, 4, 3, 3, 1, 2, 1]
        
        for i in range(10):
            person_id = str(uuid.uuid4())
            student_id = str(uuid.uuid4())
            roll_no = f"21B{random.randint(100, 999)}XX{i}"
            full_name = f"Mock Student {i+1}"
            section_id = random.choice(section_ids)
            backlogs = backlog_values[i]
            
            # Insert Person
            conn.execute(
                text("""
                    INSERT INTO people.person (person_id, institution_id, full_name) 
                    VALUES (:pid, :inst, :name)
                """),
                {"pid": person_id, "inst": institution, "name": full_name}
            )
            
            # Insert Student (Ensure status is ACTIVE)
            conn.execute(
                text("""
                    INSERT INTO people.student (student_id, person_id, roll_no, admission_no, admission_date, batch_id, current_section_id, status, current_year_of_study, demo_backlog_override)
                    VALUES (:sid, :pid, :roll, :roll, '2023-08-01', :batch, :sec, 'ACTIVE', 3, :backlogs)
                """),
                {"sid": student_id, "pid": person_id, "roll": roll_no, "batch": batch, "sec": section_id, "backlogs": backlogs}
            )
        
        logging.info("Successfully injected 10 ACTIVE mock students with backlogs!")

if __name__ == "__main__":
    inject_mock_students()
