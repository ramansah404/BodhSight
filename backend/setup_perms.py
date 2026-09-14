import sys
import os
sys.path.append(os.getcwd())
from app.db.session import SessionLocal
from sqlalchemy import text

db = SessionLocal()
try:
    db.execute(text('''
        CREATE TABLE IF NOT EXISTS core.role_permissions (
            role TEXT PRIMARY KEY,
            permissions JSONB NOT NULL DEFAULT '[]'::jsonb
        )
    '''))
    
    # Insert default permissions
    default_roles = ['Admin', 'Dean', 'Principal', 'Chairman', 'IQAC', 'HOD', 'Faculty']
    admin_perms = '["can_send_notifications", "can_view_all_departments", "can_manage_users"]'
    faculty_perms = '[]'
    
    for r in default_roles:
        perms = admin_perms if r in ['Admin', 'Dean', 'Principal', 'Chairman', 'IQAC'] else faculty_perms
        db.execute(text('INSERT INTO core.role_permissions (role, permissions) VALUES (:r, CAST(:p AS jsonb)) ON CONFLICT (role) DO NOTHING'), {'r': r, 'p': perms})
    db.commit()
    print('Permissions table created and seeded.')
except Exception as e:
    print('Error:', e)
finally:
    db.close()
