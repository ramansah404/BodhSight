"""Deploy the Agent 10 demo seed data to Supabase using psycopg2 directly."""
import os, sys
sys.path.insert(0, '.')
from dotenv import load_dotenv
load_dotenv('../.env')
import psycopg2
from urllib.parse import urlparse, unquote

db_url = os.environ['DATABASE_URL']
# Parse URL for psycopg2
parsed = urlparse(db_url)
conn = psycopg2.connect(
    host=parsed.hostname,
    port=parsed.port or 5432,
    dbname=parsed.path.lstrip('/'),
    user=parsed.username,
    password=unquote(parsed.password),
    connect_timeout=30,
    sslmode='require'
)
conn.autocommit = False
cursor = conn.cursor()

print('Connected to Supabase OK')

with open('../database/seeds/agent10_demo_seed.sql', 'r', encoding='utf-8') as f:
    sql = f.read()

try:
    cursor.execute(sql)
    conn.commit()
    print('Seed deployed successfully')
except Exception as e:
    conn.rollback()
    print(f'ERROR: {e}')
    raise
finally:
    cursor.close()

# Verify
cursor = conn.cursor()
checks = [
    ('people.student', 'SELECT count(*) FROM people.student'),
    ('people.faculty', 'SELECT count(*) FROM people.faculty'),
    ('assessment.course_result', 'SELECT count(*) FROM assessment.course_result'),
    ('academics.student_registration', 'SELECT count(*) FROM academics.student_registration'),
    ('agentops.risk_flag', 'SELECT count(*) FROM agentops.risk_flag'),
    ('assessment.v_course_performance', 'SELECT count(*) FROM assessment.v_course_performance'),
    ('academics.v_offering_roster', 'SELECT count(*) FROM academics.v_offering_roster'),
    ('people.v_student_profile', 'SELECT count(*) FROM people.v_student_profile'),
]
for name, q in checks:
    cursor.execute(q)
    n = cursor.fetchone()[0]
    print(f'  {name}: {n} rows')

cursor.close()
conn.close()
print('DONE')
