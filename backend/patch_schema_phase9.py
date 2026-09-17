import os
import psycopg2
from dotenv import load_dotenv

load_dotenv(dotenv_path='../.env')
DATABASE_URL = os.getenv("DATABASE_URL")

def patch_db():
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = True
    cursor = conn.cursor()
    try:
        cursor.execute("ALTER TABLE people.student ADD COLUMN IF NOT EXISTS demo_penalty NUMERIC(5,2), ADD COLUMN IF NOT EXISTS demo_marks_config JSONB DEFAULT '{}'::jsonb;")
        print("Successfully added columns to people.student")
    except Exception as e:
        print(f"Error patching db: {e}")
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    patch_db()
