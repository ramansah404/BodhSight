from fastapi import APIRouter, Depends, Header, HTTPException
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db.session import get_db

router = APIRouter()

class NotificationBase(BaseModel):
    id: str
    title: str
    message: str
    type: str
    link: Optional[str]
    is_read: bool
    created_at: datetime

@router.get("", response_model=List[NotificationBase])
def get_notifications(
    x_user_role: str = Header(default="Chairman"),
    x_user_name: str = Header(default="User"),
    db: Session = Depends(get_db)
):
    sql = text("""
        SELECT id, title, message, type, link, is_read, created_at
        FROM identity.notification
        WHERE role = :role OR role IS NULL
        ORDER BY created_at DESC
        LIMIT 50
    """)
    result = db.execute(sql, {"role": x_user_role})
    
    notifications = []
    for row in result:
        notifications.append(NotificationBase(
            id=str(row[0]),
            title=row[1],
            message=row[2],
            type=row[3],
            link=row[4],
            is_read=row[5],
            created_at=row[6]
        ))
    return notifications

@router.get("/unread-count")
def get_unread_count(
    x_user_role: str = Header(default="Chairman"),
    x_user_name: str = Header(default="User"),
    db: Session = Depends(get_db)
):
    sql = text("""
        SELECT COUNT(*)
        FROM identity.notification
        WHERE (role = :role OR role IS NULL) AND is_read = FALSE
    """)
    count = db.execute(sql, {"role": x_user_role}).scalar()
    return {"count": count or 0}

@router.put("/{notification_id}/read")
def mark_read(
    notification_id: str,
    x_user_role: str = Header(default="Chairman"),
    db: Session = Depends(get_db)
):
    sql = text("""
        UPDATE identity.notification
        SET is_read = TRUE
        WHERE id = :id AND (role = :role OR role IS NULL)
    """)
    db.execute(sql, {"id": notification_id, "role": x_user_role})
    db.commit()
    return {"success": True}

@router.put("/read-all")
def mark_all_read(
    x_user_role: str = Header(default="Chairman"),
    db: Session = Depends(get_db)
):
    sql = text("""
        UPDATE identity.notification
        SET is_read = TRUE
        WHERE (role = :role OR role IS NULL) AND is_read = FALSE
    """)
    db.execute(sql, {"role": x_user_role})
    db.commit()
    return {"success": True}
