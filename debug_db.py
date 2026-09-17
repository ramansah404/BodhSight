import psycopg2, os
from dotenv import load_dotenv
load_dotenv('.env')
c = psycopg2.connect(os.getenv('DATABASE_URL'))
cur = c.cursor()

print("=== Testing v_student_profile ===")
try:
    cur.execute("SELECT student_id, roll_no, full_name, section_code, cgpa, attendance_pct FROM people.v_student_profile LIMIT 3")
    rows = cur.fetchall()
    print("OK:", rows[:1])
except Exception as e:
    print("ERROR:", e)

print("\n=== Testing v_offering_roster for dept filter ===")
try:
    cur.execute("SELECT section_code FROM academics.v_offering_roster WHERE department_code = 'CSE' LIMIT 3")
    rows = cur.fetchall()
    print("OK:", rows)
except Exception as e:
    print("ERROR:", e)

print("\n=== Testing portal/me fallback query ===")
try:
    cur.execute("""
        SELECT sp.student_id, sp.full_name, sp.roll_no, sp.section_code,
               sp.cgpa, sp.attendance_pct, sp.batch_label, sp.programme_code,
               sp.department_code, sp.backlog_count
        FROM people.v_student_profile sp
        ORDER BY sp.full_name LIMIT 1
    """)
    row = cur.fetchone()
    print("OK:", row)
except Exception as e:
    print("ERROR:", e)

print("\n=== Testing assessment.course_result for student ===")
try:
    cur.execute("SELECT COUNT(*) FROM assessment.course_result")
    print("course_result rows:", cur.fetchone())
except Exception as e:
    print("ERROR:", e)

print("\n=== Checking v_student_profile columns ===")
try:
    cur.execute("""
        SELECT column_name FROM information_schema.columns
        WHERE table_schema = 'people' AND table_name = 'v_student_profile'
        ORDER BY ordinal_position
    """)
    cols = [r[0] for r in cur.fetchall()]
    print("Columns:", cols)
except Exception as e:
    print("ERROR:", e)
