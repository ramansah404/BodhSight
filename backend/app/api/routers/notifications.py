"""
Notifications Router — RBAC-aware notification system.

Notifications are targeted to users based on:
  - role (e.g. all HODs, all Faculty)
  - department (e.g. only CSE HOD / Faculty)
  - user_id (individual)

When a notification is created:
  1. It is stored in core.notification table
  2. It is dispatched via WhatsApp / Email using communication_service
     if the user has a phone/email on file in core.user_account
"""
from fastapi import APIRouter, Depends, Header, HTTPException, BackgroundTasks
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db.session import get_db
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------

class NotificationBase(BaseModel):
    id: str
    title: str
    message: str
    type: str
    link: Optional[str] = None
    is_read: bool
    created_at: datetime

class CreateNotificationRequest(BaseModel):
    title: str
    message: str
    type: str = "INFO"           # INFO | WARNING | CRITICAL | SUCCESS
    link: Optional[str] = None
    # Target — at least one of the three must be specified
    role: Optional[str] = None          # e.g. "HOD" → all HODs
    department: Optional[str] = None   # narrow to a department
    user_id: Optional[str] = None      # individual user
    # Delivery channels (default: in-app only; set True to also notify)
    send_email: bool = False
    send_whatsapp: bool = False

# ---------------------------------------------------------------------------
# Background delivery helper
# ---------------------------------------------------------------------------

def _deliver(db: Session, message_text: str, role: Optional[str],
             department: Optional[str], user_id: Optional[str],
             send_email: bool, send_whatsapp: bool):
    """Look up target users and fire real notifications via comm service."""
    try:
        from app.services.communication import communication_service

        # Build query to find target users
        conditions = ["is_active = TRUE"]
        params: dict = {}

        if user_id:
            conditions.append("id = :user_id")
            params["user_id"] = user_id
        else:
            if role:
                conditions.append("role = :role")
                params["role"] = role
            if department:
                conditions.append("department = :dept")
                params["dept"] = department

        where = " AND ".join(conditions)
        users = db.execute(
            text(f"SELECT email, phone_number, full_name FROM core.user_account WHERE {where}"),
            params
        ).fetchall()

        for user in users:
            if send_email and getattr(user, "email", None):
                communication_service.send_email(
                    user.email,
                    f"BodhSight: {message_text[:60]}",
                    f"<p>{message_text}</p>"
                )
            if send_whatsapp and getattr(user, "phone_number", None):
                communication_service.send_whatsapp(
                    user.phone_number,
                    f"BodhSight Alert: {message_text}"
                )
    except Exception as e:
        logger.error(f"Notification delivery error: {e}", exc_info=True)


# ---------------------------------------------------------------------------
# RBAC-aware migration helper — ensures table exists
# ---------------------------------------------------------------------------

def _ensure_table(db: Session):
    db.execute(text("""
        CREATE TABLE IF NOT EXISTS core.notification (
            id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            title       TEXT NOT NULL,
            message     TEXT NOT NULL,
            type        TEXT NOT NULL DEFAULT 'INFO',
            link        TEXT,
            role        TEXT,
            department  TEXT,
            user_id     UUID,
            is_read     BOOLEAN NOT NULL DEFAULT FALSE,
            created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """))
    db.commit()


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("", response_model=List[NotificationBase])
def get_notifications(
    x_user_role: str = Header(default="Chairman"),
    x_user_name: str = Header(default="User"),
    x_user_department: str = Header(default=None),
    db: Session = Depends(get_db)
):
    """
    Fetch notifications for the requesting user.
    A notification is visible if:
      - role matches (or role IS NULL = broadcast)
      - AND department matches (or notification.department IS NULL)
    """
    try:
        _ensure_table(db)
        sql = text("""
            SELECT id::text, title, message, type, link, is_read, created_at
            FROM core.notification
            WHERE
              (role = :role OR role IS NULL)
              AND (department = :dept OR department IS NULL)
            ORDER BY created_at DESC
            LIMIT 60
        """)
        result = db.execute(sql, {"role": x_user_role, "dept": x_user_department})
        rows = result.fetchall()
    except Exception as e:
        logger.warning(f"Notification fetch error: {e}")
        return []

    return [
        NotificationBase(
            id=row[0],
            title=row[1],
            message=row[2],
            type=row[3],
            link=row[4],
            is_read=bool(row[5]),
            created_at=row[6]
        )
        for row in rows
    ]


@router.get("/unread-count")
def get_unread_count(
    x_user_role: str = Header(default="Chairman"),
    x_user_department: str = Header(default=None),
    db: Session = Depends(get_db)
):
    try:
        _ensure_table(db)
        count = db.execute(
            text("""
                SELECT COUNT(*) FROM core.notification
                WHERE (role = :role OR role IS NULL)
                  AND (department = :dept OR department IS NULL)
                  AND is_read = FALSE
            """),
            {"role": x_user_role, "dept": x_user_department}
        ).scalar()
    except Exception:
        count = 0
    return {"count": count or 0}


@router.post("")
def create_notification(
    data: CreateNotificationRequest,
    background_tasks: BackgroundTasks,
    x_user_role: str = Header(default="Admin"),
    db: Session = Depends(get_db)
):
    """
    Create a new notification (Admin / system only).
    Optionally dispatches WhatsApp/Email to target users in background.
    """
    _ensure_table(db)

    # RBAC Validation from DB
    perms = db.execute(text("SELECT permissions FROM core.role_permissions WHERE role_name = :r"), {"r": x_user_role}).scalar()
    permissions_list = perms if perms else []
    
    # We allow if 'can_send_notifications' is present, or for fallback hardcoded roles if DB isn't updated
    if "can_send_notifications" not in permissions_list and x_user_role not in ["Admin", "Dean", "Principal", "Chairman", "IQAC"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions to create notifications")


    db.execute(
        text("""
            INSERT INTO core.notification (title, message, type, link, role, department, user_id)
            VALUES (:title, :msg, :type, :link, :role, :dept, :uid)
        """),
        {
            "title": data.title,
            "msg": data.message,
            "type": data.type,
            "link": data.link,
            "role": data.role,
            "dept": data.department,
            "uid": data.user_id,
        }
    )
    db.commit()

    if data.send_email or data.send_whatsapp:
        background_tasks.add_task(
            _deliver, db, f"{data.title}: {data.message}",
            data.role, data.department, data.user_id,
            data.send_email, data.send_whatsapp
        )

    return {"success": True, "message": "Notification created and dispatch queued."}


@router.put("/{notification_id}/read")
def mark_read(
    notification_id: str,
    x_user_role: str = Header(default="Chairman"),
    x_user_department: str = Header(default=None),
    db: Session = Depends(get_db)
):
    _ensure_table(db)
    db.execute(
        text("""
            UPDATE core.notification
            SET is_read = TRUE
            WHERE id = :id
              AND (role = :role OR role IS NULL)
              AND (department = :dept OR department IS NULL)
        """),
        {"id": notification_id, "role": x_user_role, "dept": x_user_department}
    )
    db.commit()
    return {"success": True}


@router.put("/read-all")
def mark_all_read(
    x_user_role: str = Header(default="Chairman"),
    x_user_department: str = Header(default=None),
    db: Session = Depends(get_db)
):
    _ensure_table(db)
    db.execute(
        text("""
            UPDATE core.notification
            SET is_read = TRUE
            WHERE (role = :role OR role IS NULL)
              AND (department = :dept OR department IS NULL)
              AND is_read = FALSE
        """),
        {"role": x_user_role, "dept": x_user_department}
    )
    db.commit()
    return {"success": True}
