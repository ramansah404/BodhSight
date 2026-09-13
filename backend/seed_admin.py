import os
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from sqlalchemy import create_engine, text
from app.core.config import settings
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

engine = create_engine(settings.DATABASE_URL)
with engine.begin() as conn:
    # Check if admin exists
    admin_exists = conn.execute(text("SELECT id FROM core.user_account WHERE email = 'admin@bodhsight.edu'")).fetchone()
    
    if not admin_exists:
        hashed_pw = pwd_context.hash("Admin@123")
        conn.execute(
            text("""
                INSERT INTO core.user_account (email, full_name, password_hash, role)
                VALUES ('admin@bodhsight.edu', 'System Admin', :pw, 'Admin')
            """),
            {"pw": hashed_pw}
        )
        print("Successfully created admin@bodhsight.edu with password: Admin@123")
    else:
        print("Admin user already exists.")
