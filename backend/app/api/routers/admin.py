from fastapi import APIRouter, Depends, HTTPException, Header, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Optional
from pydantic import BaseModel, EmailStr
import logging
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

from app.db.session import get_db

router = APIRouter(prefix="/admin", tags=["Admin"])
logger = logging.getLogger(__name__)

import jwt
from fastapi import Request

SECRET_KEY = "super_secret_bodhsight_jwt_key_for_testing"
ALGORITHM = "HS256"

def verify_admin(request: Request):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication required")
        
    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        role = payload.get("role")
        if role != "Admin":
            raise HTTPException(status_code=403, detail="Admin privileges required")
        return role
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid authentication token")

class UserResponse(BaseModel):
    id: str
    email: Optional[str] = None
    phone_number: Optional[str] = None
    full_name: str
    role: str
    department: Optional[str] = None
    created_at: str
    is_active: bool

class CreateUserRequest(BaseModel):
    email: EmailStr
    full_name: str
    password: str
    role: str
    department: Optional[str] = None

class UpdateStatusRequest(BaseModel):
    is_active: bool

class ResetPasswordRequest(BaseModel):
    password: str

class UpdateRoleRequest(BaseModel):
    role: str
    department: Optional[str] = None

class RolePermissionsRequest(BaseModel):
    permissions: List[str]

@router.get("/users", response_model=List[UserResponse])
def get_all_users(db: Session = Depends(get_db), _: str = Depends(verify_admin)):
    """Fetch all registered users."""
    try:
        users = db.execute(text("""
            SELECT id, email, phone_number, full_name, role, department, created_at, is_active
            FROM core.user_account
            ORDER BY created_at DESC
        """)).fetchall()
        
        return [
            UserResponse(
                id=str(u.id),
                email=u.email,
                phone_number=u.phone_number,
                full_name=u.full_name,
                role=u.role,
                department=u.department,
                created_at=str(u.created_at),
                is_active=bool(u.is_active)
            ) for u in users
        ]
    except Exception as e:
        logger.error(f"Error fetching users: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch users")

@router.put("/users/{user_id}/role")
def update_user_role(user_id: str, data: UpdateRoleRequest, db: Session = Depends(get_db), _: str = Depends(verify_admin)):
    """Update a user's role and department."""
    try:
        # Verify user exists
        user = db.execute(text("SELECT id FROM core.user_account WHERE id = :id"), {"id": user_id}).fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
            
        db.execute(
            text("UPDATE core.user_account SET role = :role, department = :dept WHERE id = :id"),
            {"role": data.role, "dept": data.department, "id": user_id}
        )
        db.commit()
        return {"success": True, "message": "User role updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating user role: {e}")
        raise HTTPException(status_code=500, detail="Failed to update user role")

@router.post("/users")
def create_user(data: CreateUserRequest, db: Session = Depends(get_db), _: str = Depends(verify_admin)):
    """Create a new user manually."""
    try:
        # Check if email exists
        existing = db.execute(text("SELECT id FROM core.user_account WHERE email = :email"), {"email": data.email}).fetchone()
        if existing:
            raise HTTPException(status_code=400, detail="User with this email already exists")

        hashed_pw = pwd_context.hash(data.password)
        db.execute(
            text("""
                INSERT INTO core.user_account (email, full_name, password_hash, role, department, is_active)
                VALUES (:email, :full_name, :pw, :role, :dept, TRUE)
            """),
            {"email": data.email, "full_name": data.full_name, "pw": hashed_pw, "role": data.role, "dept": data.department}
        )
        db.commit()
        return {"success": True, "message": "User created successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating user: {e}")
        raise HTTPException(status_code=500, detail="Failed to create user")

@router.put("/users/{user_id}/status")
def update_user_status(user_id: str, data: UpdateStatusRequest, db: Session = Depends(get_db), _: str = Depends(verify_admin)):
    """Activate or Deactivate a user."""
    try:
        user = db.execute(text("SELECT role FROM core.user_account WHERE id = :id"), {"id": user_id}).fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        if user.role == "Admin" and not data.is_active:
            raise HTTPException(status_code=400, detail="Cannot deactivate an Admin account")

        db.execute(text("UPDATE core.user_account SET is_active = :status WHERE id = :id"), {"status": data.is_active, "id": user_id})
        db.commit()
        return {"success": True, "message": "User status updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating status: {e}")
        raise HTTPException(status_code=500, detail="Failed to update user status")

@router.put("/users/{user_id}/password")
def reset_user_password(user_id: str, data: ResetPasswordRequest, db: Session = Depends(get_db), _: str = Depends(verify_admin)):
    """Reset a user's password."""
    try:
        user = db.execute(text("SELECT id FROM core.user_account WHERE id = :id"), {"id": user_id}).fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        hashed_pw = pwd_context.hash(data.password)
        db.execute(text("UPDATE core.user_account SET password_hash = :pw WHERE id = :id"), {"pw": hashed_pw, "id": user_id})
        db.commit()
        return {"success": True, "message": "Password reset successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error resetting password: {e}")
        raise HTTPException(status_code=500, detail="Failed to reset password")

@router.delete("/users/{user_id}")
def delete_user(user_id: str, db: Session = Depends(get_db), _: str = Depends(verify_admin)):
    """Delete a user account."""
    try:
        # Check if user exists
        user = db.execute(text("SELECT role FROM core.user_account WHERE id = :id"), {"id": user_id}).fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
            
        if user.role == "Admin":
            raise HTTPException(status_code=400, detail="Cannot delete an Admin account")
            
        db.execute(text("DELETE FROM core.user_account WHERE id = :id"), {"id": user_id})
        db.commit()
        return {"success": True, "message": "User deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting user: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete user")

@router.get("/permissions")
def get_all_role_permissions(db: Session = Depends(get_db), _: str = Depends(verify_admin)):
    """Fetch the RBAC permissions matrix."""
    try:
        rows = db.execute(text("SELECT role_name, permissions FROM core.role_permissions")).fetchall()
        return [{"role": row.role_name, "permissions": row.permissions} for row in rows]
    except Exception as e:
        logger.error(f"Error fetching permissions: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch permissions")

import json
@router.put("/permissions/{role_name}")
def update_role_permissions(role_name: str, data: RolePermissionsRequest, db: Session = Depends(get_db), _: str = Depends(verify_admin)):
    """Update permissions for a specific role."""
    try:
        db.execute(
            text("UPDATE core.role_permissions SET permissions = :perms, updated_at = CURRENT_TIMESTAMP WHERE role_name = :role"),
            {"perms": json.dumps(data.permissions), "role": role_name}
        )
        db.commit()
        return {"success": True, "message": f"Permissions updated for {role_name}"}
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating permissions: {e}")
        raise HTTPException(status_code=500, detail="Failed to update permissions")

class SystemConfigRequest(BaseModel):
    mock_data_enabled: bool

@router.get("/config")
def get_system_config(db: Session = Depends(get_db)):
    """Fetch global system config. Publicly accessible so UI knows mode."""
    try:
        db.execute(text("""
            CREATE TABLE IF NOT EXISTS core.system_config (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            )
        """))
        db.commit()
        row = db.execute(text("SELECT value FROM core.system_config WHERE key = 'mock_data_enabled'")).fetchone()
        return {"mock_data_enabled": row.value == "true" if row else True} # Default True for demo
    except Exception as e:
        logger.error(f"Error fetching config: {e}")
        return {"mock_data_enabled": True}

@router.put("/config")
def update_system_config(data: SystemConfigRequest, db: Session = Depends(get_db), _: str = Depends(verify_admin)):
    """Update global system config."""
    try:
        val = "true" if data.mock_data_enabled else "false"
        db.execute(text("""
            INSERT INTO core.system_config (key, value) VALUES ('mock_data_enabled', :val)
            ON CONFLICT (key) DO UPDATE SET value = :val
        """), {"val": val})
        db.commit()
        return {"success": True, "message": "System config updated"}
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating config: {e}")
        raise HTTPException(status_code=500, detail="Failed to update config")

@router.delete("/mock-data")
def purge_mock_data(db: Session = Depends(get_db), _: str = Depends(verify_admin)):
    """Purge all mock data from the database."""
    try:
        # Delete mock users (assuming mock users have 'Mock' in name or email)
        db.execute(text("DELETE FROM core.user_account WHERE email LIKE 'mock%' OR full_name LIKE 'Mock %'"))
        db.commit()
        return {"success": True, "message": "Mock data purged successfully."}
    except Exception as e:
        db.rollback()
        logger.error(f"Error purging mock data: {e}")
        raise HTTPException(status_code=500, detail="Failed to purge mock data.")

class BroadcastNotificationRequest(BaseModel):
    title: str
    message: str
    type: str = "INFO"
    link: Optional[str] = None
    role: Optional[str] = None
    department: Optional[str] = None
    send_email: bool = False
    send_whatsapp: bool = False

@router.post("/notify")
def broadcast_notification(
    data: BroadcastNotificationRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    _: str = Depends(verify_admin)
):
    """
    Admin broadcasts an RBAC-targeted in-app notification.
    Optionally dispatches real WhatsApp / Email to target users in the background.
    """
    try:
        # Ensure the notifications table exists
        db.execute(text("""
            CREATE TABLE IF NOT EXISTS core.notification (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                title TEXT NOT NULL,
                message TEXT NOT NULL,
                type TEXT NOT NULL DEFAULT 'INFO',
                link TEXT,
                role TEXT,
                department TEXT,
                user_id UUID,
                is_read BOOLEAN NOT NULL DEFAULT FALSE,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
        """))
        db.execute(
            text("""
                INSERT INTO core.notification (title, message, type, link, role, department)
                VALUES (:title, :msg, :type, :link, :role, :dept)
            """),
            {
                "title": data.title, "msg": data.message,
                "type": data.type, "link": data.link,
                "role": data.role, "dept": data.department
            }
        )
        db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating notification: {e}")
        raise HTTPException(status_code=500, detail="Failed to create notification")

    if data.send_email or data.send_whatsapp:
        def _dispatch():
            try:
                from app.services.communication import communication_service
                conds = ["is_active = TRUE"]
                params: dict = {}
                if data.role:
                    conds.append("role = :role")
                    params["role"] = data.role
                if data.department:
                    conds.append("department = :dept")
                    params["dept"] = data.department
                where = " AND ".join(conds)
                users = db.execute(
                    text(f"SELECT email, phone_number FROM core.user_account WHERE {where}"),
                    params
                ).fetchall()
                for u in users:
                    if data.send_email and getattr(u, "email", None):
                        communication_service.send_email(
                            u.email,
                            data.title,
                            f"<p><strong>{data.title}</strong></p><p>{data.message}</p>"
                        )
                    if data.send_whatsapp and getattr(u, "phone_number", None):
                        communication_service.send_whatsapp(
                            u.phone_number,
                            f"BodhSight: {data.title}\n{data.message}"
                        )
            except Exception as ex:
                logger.error(f"Notification dispatch error: {ex}")
        background_tasks.add_task(_dispatch)

    target = data.role or "All roles"
    dept_suffix = f" ({data.department})" if data.department else ""
    return {"success": True, "message": f"Notification broadcast to {target}{dept_suffix}."}
