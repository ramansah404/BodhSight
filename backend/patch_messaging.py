import os
import sys
from sqlalchemy import text
from app.db.session import engine

def apply_patch():
    print("Applying messaging patch to database...")
    queries = [
        """
        CREATE TABLE IF NOT EXISTS core.message (
            message_id UUID PRIMARY KEY,
            sender_id UUID NOT NULL,
            receiver_id UUID NOT NULL,
            content TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            read_at TIMESTAMP WITH TIME ZONE NULL
        );
        """
    ]
    
    with engine.begin() as conn:
        for q in queries:
            try:
                conn.execute(text(q))
                print("Successfully executed table creation.")
            except Exception as e:
                print(f"Error executing query: {e}")

if __name__ == "__main__":
    apply_patch()
