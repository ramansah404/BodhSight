from fastapi import APIRouter, Depends, HTTPException, Header
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

def verify_admin(x_user_role: str = Header(...)):
    if x_user_role != "Admin":
        raise HTTPException(status_code=403, detail="Admin privileges required")
    return x_user_role

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
