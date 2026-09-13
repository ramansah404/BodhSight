import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.session import engine
from sqlalchemy import text

with engine.connect() as conn:
    res = conn.execute(text("SELECT definition FROM pg_views WHERE viewname = 'v_student_profile'")).fetchone()
    if res:
        print(res[0])
    else:
        print("View not found.")
