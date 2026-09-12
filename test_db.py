import os
from sqlalchemy import create_engine, text
from sqlalchemy.pool import NullPool
engine = create_engine('postgresql://postgres.jijisnykcjcscxiveimy:2029%40Batch10@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres', poolclass=NullPool)
print("Connecting...")
try:
    with engine.connect() as conn:
        print("Connected, running query...")
        result = conn.execute(text("SELECT count(*) FROM assessment.v_course_performance"))
        print(f"Result: {result.fetchone()}")
except Exception as e:
    print(f"Error: {e}")
