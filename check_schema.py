import os
from sqlalchemy import create_engine, text
from sqlalchemy.pool import NullPool

engine = create_engine('[REDACTED]', poolclass=NullPool)

with engine.connect() as conn:
    print('Tables:')
    result = conn.execute(text("""
        SELECT table_schema, table_name 
        FROM information_schema.tables 
        WHERE table_schema NOT IN ('information_schema', 'pg_catalog')
    """))
    for row in result:
        print(f'{row[0]}.{row[1]}')
