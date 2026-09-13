import os
from sqlalchemy import create_engine, text
from sqlalchemy.pool import NullPool

engine = create_engine('[REDACTED]', poolclass=NullPool)

with engine.connect() as conn:
    print("Schema for assessment.student_question_mark:")
    result = conn.execute(text("SELECT column_name, data_type FROM information_schema.columns WHERE table_schema='assessment' AND table_name='student_question_mark'"))
    for row in result: print(row)
    
    print("\nSchema for assessment.paper_question:")
    result = conn.execute(text("SELECT column_name, data_type FROM information_schema.columns WHERE table_schema='assessment' AND table_name='paper_question'"))
    for row in result: print(row)
    
    print("\nSchema for curriculum.course_unit:")
    result = conn.execute(text("SELECT column_name, data_type FROM information_schema.columns WHERE table_schema='curriculum' AND table_name='course_unit'"))
    for row in result: print(row)

    print("\nSchema for curriculum.course_outcome:")
    result = conn.execute(text("SELECT column_name, data_type FROM information_schema.columns WHERE table_schema='curriculum' AND table_name='course_outcome'"))
    for row in result: print(row)

    print("\nFinding marks for 24CSE005:")
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
