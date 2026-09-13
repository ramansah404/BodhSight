from sqlalchemy import text
from app.db.session import engine

def create_users_table():
    with engine.begin() as conn:
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS core.user_account (
                id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                email text UNIQUE,
                phone_number text UNIQUE,
                full_name text NOT NULL,
                password_hash text NOT NULL,
                role text NOT NULL,
                department text,
                created_at timestamp DEFAULT CURRENT_TIMESTAMP
            );
        """))
        print("Successfully created core.user_account table.")

if __name__ == "__main__":
    create_users_table()
