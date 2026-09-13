import os

from sqlalchemy import create_engine, text
from sqlalchemy.pool import NullPool
from dotenv import load_dotenv


load_dotenv()
database_url = os.getenv("DATABASE_URL")
if not database_url:
    raise SystemExit("DATABASE_URL must be set in ignored environment configuration.")

engine = create_engine(database_url, poolclass=NullPool)

try:
    with engine.connect() as conn:
        result = conn.execute(text("SELECT count(*) FROM assessment.v_course_performance"))
        print(f"Result: {result.fetchone()}")
except Exception as error:
    print(f"Error: {error}")
