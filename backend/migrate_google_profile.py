import os
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from sqlalchemy import create_engine, text
from app.core.config import settings

engine = create_engine(settings.DATABASE_URL)
with engine.begin() as conn:
    conn.execute(text('ALTER TABLE core.user_account ADD COLUMN IF NOT EXISTS google_id TEXT UNIQUE'))
    conn.execute(text('ALTER TABLE core.user_account ADD COLUMN IF NOT EXISTS profile_image_url TEXT'))
    # Make password_hash nullable because Google users won't have a password
    conn.execute(text('ALTER TABLE core.user_account ALTER COLUMN password_hash DROP NOT NULL'))
print("Successfully added google_id and profile_image_url columns, and made password_hash nullable.")
