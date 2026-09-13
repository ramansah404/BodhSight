import os
import shutil
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db.session import get_db

router = APIRouter(prefix="/profile", tags=["Profile"])

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "../../../uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

class ProfileResponse(BaseModel):
    success: bool
    message: str
    email: Optional[str] = None
    phone_number: Optional[str] = None
    full_name: str
    role: str
    department: Optional[str] = None
    profile_image_url: Optional[str] = None

class ProfileUpdateRequest(BaseModel):
    identifier: str # Email or phone to identify user since we don't have true JWTs yet
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    # Add other updatable fields here

@router.post("/me", response_model=ProfileResponse)
def get_profile(data: dict, db: Session = Depends(get_db)):
    """Fetch user profile."""
    identifier = data.get("identifier")
    if not identifier:
        raise HTTPException(status_code=400, detail="Identifier is required")
        
    user = db.execute(
        text("SELECT email, phone_number, full_name, role, department, profile_image_url FROM core.user_account WHERE email = :id OR phone_number = :id"),
        {"id": identifier}
    ).fetchone()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    return ProfileResponse(
        success=True,
        message="Profile fetched successfully",
        email=user.email,
        phone_number=user.phone_number,
        full_name=user.full_name,
        role=user.role,
        department=user.department,
        profile_image_url=user.profile_image_url,
    )

@router.put("/me", response_model=ProfileResponse)
def update_profile(data: ProfileUpdateRequest, db: Session = Depends(get_db)):
    """Update user profile."""
    # Note: RBAC validation should ideally be done based on verified session JWT.
    # For now, users can only update their own non-sensitive fields.
    
    user = db.execute(
        text("SELECT * FROM core.user_account WHERE email = :id OR phone_number = :id"),
        {"id": data.identifier}
    ).fetchone()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Update logic
    updates = []
    params = {"id": data.identifier}
    
    if data.full_name:
        updates.append("full_name = :full_name")
        params["full_name"] = data.full_name
        
    if data.phone_number:
        updates.append("phone_number = :phone_number")
        params["phone_number"] = data.phone_number

    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update provided")

    query = f"UPDATE core.user_account SET {', '.join(updates)} WHERE email = :id OR phone_number = :id"
    
    try:
        db.execute(text(query), params)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to update profile.")
        
    # Re-fetch user to return updated response
    updated_user = db.execute(
        text("SELECT email, phone_number, full_name, role, department, profile_image_url FROM core.user_account WHERE email = :id OR phone_number = :id"),
        {"id": data.identifier}
    ).fetchone()
    
    return ProfileResponse(
        success=True,
        message="Profile updated successfully",
        email=updated_user.email,
        phone_number=updated_user.phone_number,
        full_name=updated_user.full_name,
        role=updated_user.role,
        department=updated_user.department,
        profile_image_url=updated_user.profile_image_url,
    )

@router.post("/image")
def upload_profile_image(identifier: str = Form(...), file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Upload a profile image."""
    user = db.execute(
        text("SELECT id FROM core.user_account WHERE email = :id OR phone_number = :id"),
        {"id": identifier}
    ).fetchone()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
        
    # Save file
    file_ext = file.filename.split('.')[-1]
    filename = f"profile_{user.id}.{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    image_url = f"/uploads/{filename}"
    
    # Update DB
    db.execute(
        text("UPDATE core.user_account SET profile_image_url = :url WHERE id = :user_id"),
        {"url": image_url, "user_id": user.id}
    )
    db.commit()
    
    return {"success": True, "message": "Profile image updated successfully", "profile_image_url": image_url}
