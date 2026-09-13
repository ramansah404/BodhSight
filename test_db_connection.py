"""
Test SessionLocal connection via the normal application path (no in-memory workaround).
Uses the app's own settings and SessionLocal as configured.
Does NOT print credentials.
"""
import sys
sys.path.insert(0, "backend")

from app.core.config import settings
from app.db.session import SessionLocal
from sqlalchemy import text

db = SessionLocal()
try:
    result = db.execute(text("SELECT 1")).scalar()
    assert result == 1, "Expected 1"
    print("PASS: Normal SessionLocal connection successful.")

    # Regression: verify the autotutor query works
    from app.db.queries import get_weakest_question
    student_uuid = db.execute(text("SELECT student_id FROM people.student WHERE roll_no = '24CSE005'")).scalar()
    assert student_uuid, "Student 24CSE005 not found"
    print(f"PASS: Student 24CSE005 found in DB.")

    weakest = get_weakest_question(db, str(student_uuid))
    assert weakest, "No weakest question returned"
    assert weakest["question_no"] == "1a", f"Expected 1a, got {weakest['question_no']}"
    assert float(weakest["marks_obtained"]) == 4.0, f"Expected 4.0, got {weakest['marks_obtained']}"
    assert float(weakest["max_marks"]) == 15.0, f"Expected 15.0, got {weakest['max_marks']}"
    assert weakest["unit_title"] == "Arrays and Linked Lists", f"Wrong unit: {weakest['unit_title']}"
    print(f"PASS: Auto-Tutor weakest question grounding verified: Q{weakest['question_no']} {weakest['marks_obtained']}/{weakest['max_marks']}")
    print(f"      Unit: {weakest['unit_title']}, CO{weakest['co_no']}: {weakest['co_statement']}")
    print()
    print("ALL CHECKS PASSED.")
except Exception as e:
    print(f"FAIL: {e}")
    import traceback; traceback.print_exc()
finally:
    db.close()
