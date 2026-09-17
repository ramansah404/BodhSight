from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Optional
from pydantic import BaseModel, Field
import logging
import uuid
from datetime import datetime

from app.db.session import get_db

router = APIRouter()
logger = logging.getLogger(__name__)

class MessageCreate(BaseModel):
    receiver_id: str
    content: str

class MessageResponse(BaseModel):
    message_id: str
    sender_id: str
    sender_name: str
    sender_role: str
    receiver_id: str
    receiver_name: str
    content: str
    created_at: str
    read_at: Optional[str]

class UserResponse(BaseModel):
    id: str
    full_name: str
    role: str
    department: Optional[str]

def get_current_user_id(x_user_id: str = Header(None)) -> str:
    if not x_user_id:
        raise HTTPException(status_code=401, detail="User not authenticated")
    return x_user_id

@router.get("/users", response_model=List[UserResponse])
def get_available_users(x_user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    """Get list of users you can message (excludes Student and Parent)."""
    try:
        query = text("""
            SELECT id, full_name, role, department 
            FROM core.user_account 
            WHERE role NOT IN ('Student', 'Parent') 
            AND id != :uid
            AND is_active = true
            ORDER BY full_name ASC
        """)
        result = db.execute(query, {"uid": x_user_id}).fetchall()
        return [
            UserResponse(
                id=str(r[0]),
                full_name=str(r[1]),
                role=str(r[2]),
                department=r[3]
            ) for r in result
        ]
    except Exception as e:
        logger.error(f"Error fetching users: {e}")
        raise HTTPException(status_code=500, detail="Database query failed")

@router.post("/", response_model=dict)
def send_message(data: MessageCreate, x_user_id: str = Depends(get_current_user_id), x_user_role: str = Header(None), db: Session = Depends(get_db)):
    """Send a message to another user."""
    if x_user_role in ['Student', 'Parent']:
        raise HTTPException(status_code=403, detail="Students and Parents cannot send messages")
    
    try:
        # Verify receiver is not student or parent (optional, but good practice)
        recv = db.execute(text("SELECT role FROM core.user_account WHERE id = :rid"), {"rid": data.receiver_id}).fetchone()
        if not recv:
            raise HTTPException(status_code=404, detail="Receiver not found")
        if recv[0] in ['Student', 'Parent']:
            raise HTTPException(status_code=403, detail="Cannot message students or parents")

        msg_id = str(uuid.uuid4())
        db.execute(text("""
            INSERT INTO core.message (message_id, sender_id, receiver_id, content)
            VALUES (:mid, :sid, :rid, :content)
        """), {
            "mid": msg_id,
            "sid": x_user_id,
            "rid": data.receiver_id,
            "content": data.content
        })
        db.commit()
        return {"success": True, "message_id": msg_id}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error sending message: {e}")
        raise HTTPException(status_code=500, detail="Failed to send message")

@router.get("/inbox", response_model=List[MessageResponse])
def get_inbox(x_user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    """Get received messages."""
    try:
        query = text("""
            SELECT m.message_id, m.sender_id, s.full_name, s.role, m.receiver_id, r.full_name, m.content, m.created_at, m.read_at
            FROM core.message m
            JOIN core.user_account s ON m.sender_id = s.id
            JOIN core.user_account r ON m.receiver_id = r.id
            WHERE m.receiver_id = :uid
            ORDER BY m.created_at DESC
        """)
        result = db.execute(query, {"uid": x_user_id}).fetchall()
        return [
            MessageResponse(
                message_id=str(row[0]),
                sender_id=str(row[1]),
                sender_name=str(row[2]),
                sender_role=str(row[3]),
                receiver_id=str(row[4]),
                receiver_name=str(row[5]),
                content=str(row[6]),
                created_at=row[7].isoformat(),
                read_at=row[8].isoformat() if row[8] else None
            ) for row in result
        ]
    except Exception as e:
        logger.error(f"Error fetching inbox: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch inbox")

@router.get("/sent", response_model=List[MessageResponse])
def get_sent_messages(x_user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    """Get sent messages."""
    try:
        query = text("""
            SELECT m.message_id, m.sender_id, s.full_name, s.role, m.receiver_id, r.full_name, m.content, m.created_at, m.read_at
            FROM core.message m
            JOIN core.user_account s ON m.sender_id = s.id
            JOIN core.user_account r ON m.receiver_id = r.id
            WHERE m.sender_id = :uid
            ORDER BY m.created_at DESC
        """)
        result = db.execute(query, {"uid": x_user_id}).fetchall()
        return [
            MessageResponse(
                message_id=str(row[0]),
                sender_id=str(row[1]),
                sender_name=str(row[2]),
                sender_role=str(row[3]),
                receiver_id=str(row[4]),
                receiver_name=str(row[5]),
                content=str(row[6]),
                created_at=row[7].isoformat(),
                read_at=row[8].isoformat() if row[8] else None
            ) for row in result
        ]
    except Exception as e:
        logger.error(f"Error fetching sent messages: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch sent messages")

@router.put("/{message_id}/read")
def mark_message_read(message_id: str, x_user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    """Mark a message as read."""
    try:
        db.execute(text("""
            UPDATE core.message 
            SET read_at = NOW() 
            WHERE message_id = :mid AND receiver_id = :uid AND read_at IS NULL
        """), {"mid": message_id, "uid": x_user_id})
        db.commit()
        return {"success": True}
    except Exception as e:
        db.rollback()
        logger.error(f"Error marking message read: {e}")
        raise HTTPException(status_code=500, detail="Failed to mark read")
