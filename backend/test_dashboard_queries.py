from app.db.session import get_db
from app.db import queries
print("Starting...")
try:
    db = next(get_db())
    print("Got DB session.")
    
    print("Running perf_summary...")
    perf_summary = queries.get_course_performance_summary(db)
    print("Done perf_summary.")
    
    print("Running roster_summary...")
    roster_summary = queries.get_offering_roster_summary(db)
    print("Done roster_summary.")
    
    print("Running student_summary...")
    student_summary = queries.get_student_profile_summary(db)
    print("Done student_summary.")
    
    print("Running open_flags_count...")
    open_flags_count = queries.get_open_flags_count(db)
    print("Done open_flags_count.")
    
    print("Success")
except Exception as e:
    print("Error:", e)
