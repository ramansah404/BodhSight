from app.db.session import get_db
try:
    db = next(get_db())
    print("Got DB session.")
    from sqlalchemy import text
    res = db.execute(text("SELECT count(*) FROM assessment.v_course_performance"))
    print("Query success:", res.fetchone())
except Exception as e:
    print("Error:", e)
