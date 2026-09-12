import os
from sqlalchemy import create_engine, text
from sqlalchemy.pool import NullPool
engine = create_engine('[REDACTED]', poolclass=NullPool)
print("Connecting...")
try:
    with engine.connect() as conn:
        print("Connected, running query...")
        result = conn.execute(text("SELECT count(*) FROM assessment.v_course_performance"))
        print(f"Result: {result.fetchone()}")
except Exception as e:
    print(f"Error: {e}")
