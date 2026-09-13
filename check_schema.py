import os

from sqlalchemy import create_engine, text
from sqlalchemy.pool import NullPool
from dotenv import load_dotenv


load_dotenv()
database_url = os.getenv("DATABASE_URL")
if not database_url:
    raise SystemExit("DATABASE_URL must be set in ignored environment configuration.")

engine = create_engine(database_url, poolclass=NullPool)

with engine.connect() as conn:
    result = conn.execute(text("""
        SELECT table_schema, table_name
        FROM information_schema.tables
        WHERE table_schema NOT IN ('information_schema', 'pg_catalog')
    """))
    for row in result:
        print(f"{row[0]}.{row[1]}")
