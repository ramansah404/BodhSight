import os
import sys
import json
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from sqlalchemy import create_engine, text
from app.core.config import settings

def migrate():
    engine = create_engine(settings.DATABASE_URL)
    with engine.begin() as conn:
        # Create table
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS core.role_permissions (
                role_name VARCHAR PRIMARY KEY,
                permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        """))
        
        # Default permissions dictionary
        # Available permissions: view_overview, view_trends, view_courses, view_departments, 
        # view_sections, view_students, view_reports, view_data_hub, manage_exceptions, manage_users
        
        default_roles = {
            "Chairman": ["view_overview", "view_trends", "view_courses", "view_departments", "view_sections", "view_students", "view_reports", "manage_exceptions"],
            "Principal": ["view_overview", "view_trends", "view_courses", "view_departments", "view_sections", "view_students", "view_reports", "manage_exceptions"],
            "Dean": ["view_overview", "view_trends", "view_courses", "view_departments", "view_sections", "view_students", "view_reports", "manage_exceptions"],
            "HOD": ["view_overview", "view_trends", "view_courses", "view_sections", "view_students", "view_reports", "view_data_hub", "manage_exceptions"],
            "Faculty": ["view_overview", "view_courses", "view_sections", "view_students", "view_data_hub"],
            "IQAC": ["view_overview", "view_trends", "view_courses", "view_departments", "view_reports", "manage_exceptions"],
            "Admin": ["manage_users"]
        }
        
        # Insert or update
        for role, perms in default_roles.items():
            conn.execute(
                text("""
                    INSERT INTO core.role_permissions (role_name, permissions)
                    VALUES (:role, :perms)
                    ON CONFLICT (role_name) DO NOTHING
                """),
                {"role": role, "perms": json.dumps(perms)}
            )
            
    print("Successfully created and seeded core.role_permissions table.")

if __name__ == "__main__":
    migrate()
