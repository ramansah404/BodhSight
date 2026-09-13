import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv('.env')
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.core.config import settings

engine = create_engine(settings.DATABASE_URL)
with engine.begin() as conn:
    conn.execute(text('ALTER TABLE core.user_account ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE'))
print("Successfully added two_factor_enabled column")
