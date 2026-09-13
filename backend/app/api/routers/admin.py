from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Optional
from pydantic import BaseModel
import logging

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

class UpdateRoleRequest(BaseModel):
    role: str
    department: Optional[str] = None

@router.get("/users", response_model=List[UserResponse])
def get_all_users(db: Session = Depends(get_db), _: str = Depends(verify_admin)):
    """Fetch all registered users."""
    try:
        users = db.execute(text("""
            SELECT id, email, phone_number, full_name, role, department, created_at 
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
                created_at=str(u.created_at)
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
