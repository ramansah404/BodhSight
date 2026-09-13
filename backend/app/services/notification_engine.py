import logging
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.services.communication import communication_service
import uuid
import datetime

logger = logging.getLogger(__name__)

class NotificationEngine:
    def __init__(self):
        pass

    def _persist_notification(self, db: Session, title: str, message: str, role: str, n_type: str, link: str = None):
        """Saves the notification to the database so it appears in the UI."""
        try:
            sql = text("""
                INSERT INTO identity.notification (id, title, message, type, link, is_read, role, created_at)
                VALUES (:id, :title, :message, :type, :link, FALSE, :role, :created_at)
            """)
            db.execute(sql, {
                "id": str(uuid.uuid4()),
                "title": title,
                "message": message,
                "type": n_type,
                "link": link,
                "role": role,
                "created_at": datetime.datetime.utcnow()
            })
            db.commit()
        except Exception as e:
            logger.error(f"Failed to persist notification: {e}")
            db.rollback()

    def _get_users_by_role(self, db: Session, role: str, department: str = None) -> list:
        """Fetches users matching the RBAC policy to send them emails/whatsapp."""
        where_clause = "role = :role"
        params = {"role": role}
        if department:
            where_clause += " AND department = :dept"
            params["dept"] = department
            
        sql = text(f"SELECT email, phone_number, full_name FROM core.user_account WHERE {where_clause}")
        result = db.execute(sql, params)
        return [{"email": row[0], "phone": row[1], "name": row[2]} for row in result]

    def dispatch_anomaly_alert(self, db: Session, anomaly_data: dict):
        """
        Routes an anomaly alert based on RBAC.
        - Campus-wide alerts -> Chairman, Principal, Dean
        - Department-specific alerts -> HOD and Dean
        - Course-specific alerts -> Faculty
        """
        title = anomaly_data.get("title", "New Anomaly Detected")
        message = anomaly_data.get("deviation_summary", "Review required.")
        department = anomaly_data.get("department")
        course_code = anomaly_data.get("course_code")
        
        target_roles = []
        
        if not department and not course_code:
            # Campus wide
            target_roles = ["Chairman", "Principal", "Dean"]
        elif department and not course_code:
            # Department specific
            target_roles = ["HOD", "Dean"]
        else:
            # Course specific
            target_roles = ["Faculty", "HOD"]

        for role in target_roles:
            # 1. Persist to UI Notification Bell
            self._persist_notification(
                db=db,
                title=title,
                message=message,
                role=role,
                n_type="ANOMALY",
                link=f"/anomalies"
            )
            
            # 2. Find eligible users to send real-time alerts
            users = self._get_users_by_role(db, role, department if role in ["HOD", "Faculty"] else None)
            
            for user in users:
                # Dispatch Email
                if user["email"]:
                    html = f"<h3>{title}</h3><p>{message}</p><br><a href='http://localhost:5173/anomalies'>View in BodhSight</a>"
                    communication_service.send_email(user["email"], title, html)
                
                # Dispatch WhatsApp (High Priority for Anomalies)
                if user["phone"]:
                    wa_msg = f"🚨 *BodhSight Alert: {title}*\\n\\n{message}\\n\\nPlease review immediately."
                    communication_service.send_whatsapp(user["phone"], wa_msg)

notification_engine = NotificationEngine()
