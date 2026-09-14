import os
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from sqlalchemy import create_engine, text
from app.core.config import settings

def migrate():
    engine = create_engine(settings.DATABASE_URL)
    with engine.connect().execution_options(isolation_level="AUTOCOMMIT") as conn:
        print("Migrating database indexes for performance...")
        
        indexes = [
            "CREATE INDEX IF NOT EXISTS idx_assessment_cr_term ON assessment.course_result (term_id);",
            "CREATE INDEX IF NOT EXISTS idx_assessment_cr_course ON assessment.course_result (course_version_id);",
            "CREATE INDEX IF NOT EXISTS idx_assessment_cr_offering ON assessment.course_result (course_offering_id);",
            
            "CREATE INDEX IF NOT EXISTS idx_curriculum_co_term ON academics.course_offering (term_id);",
            "CREATE INDEX IF NOT EXISTS idx_curriculum_co_course ON academics.course_offering (course_version_id);",
            
            "CREATE INDEX IF NOT EXISTS idx_people_student_dept ON people.student (department_id);",
            "CREATE INDEX IF NOT EXISTS idx_people_student_prog ON people.student (programme_id);",
            
            "CREATE INDEX IF NOT EXISTS idx_people_faculty_dept ON people.faculty (department_id);"
        ]
        
        for idx_sql in indexes:
            try:
                conn.execute(text(idx_sql))
            except Exception as e:
                print(f"Failed to create index: {e}")
            
        print("Indexes created successfully.")

if __name__ == "__main__":
    migrate()
