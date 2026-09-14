import os
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from sqlalchemy import create_engine, text
from app.core.config import settings

def migrate():
    engine = create_engine(settings.DATABASE_URL)
    with engine.begin() as conn:
        print("Migrating core.user_account to include is_active...")
        conn.execute(text("""
            ALTER TABLE core.user_account ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT TRUE;
        """))
        print("Migration completed successfully.")

if __name__ == "__main__":
    migrate()
