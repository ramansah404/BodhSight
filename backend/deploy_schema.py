import os
import psycopg2
from dotenv import load_dotenv

# Load the environment variables from the root .env file
load_dotenv(dotenv_path='../.env')

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL is not set in .env")

print("Connecting to Database...")
conn = psycopg2.connect(DATABASE_URL)
conn.autocommit = True
cursor = conn.cursor()

def run_sql_file(filepath):
    print(f"Executing {filepath}...")
    with open(filepath, 'r', encoding='utf-8') as f:
        sql = f.read()
    cursor.execute(sql)
    print(f"Successfully executed {filepath}")

try:
    # 1. Run full schema
    run_sql_file('../database/official/schema_full.sql')
    
    # 2. Run smoke test data
    run_sql_file('../database/official/99_smoke_test.sql')

    print("Deployment completed successfully.")
except Exception as e:
    print(f"Error executing deployment: {e}")
finally:
    cursor.close()
    conn.close()
