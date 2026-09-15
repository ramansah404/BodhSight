import os
import logging
from typing import Optional

from app.core.config import settings

logger = logging.getLogger(__name__)

class CommunicationService:
    def __init__(self):
        self.twilio_account_sid = settings.TWILIO_ACCOUNT_SID
        self.twilio_auth_token = settings.TWILIO_AUTH_TOKEN
        self.twilio_whatsapp_number = settings.TWILIO_WHATSAPP_NUMBER
        
        self.sendgrid_api_key = settings.SENDGRID_API_KEY
        self.sender_email = settings.SENDER_EMAIL

    def send_whatsapp(self, to_phone: str, message: str) -> bool:
        """Sends a WhatsApp message via Twilio."""
        if not to_phone:
            return False
            
        # Ensure it starts with whatsapp:
        if not to_phone.startswith("whatsapp:"):
            if not to_phone.startswith("+"):
                to_phone = f"+{to_phone}"
            to_phone = f"whatsapp:{to_phone}"

        if self.twilio_account_sid and self.twilio_auth_token:
            try:
                from twilio.rest import Client
                client = Client(self.twilio_account_sid, self.twilio_auth_token)
                message_obj = client.messages.create(
                    body=message,
                    from_=self.twilio_whatsapp_number,
                    to=to_phone
                )
                logger.info(f"WhatsApp sent successfully to {to_phone}. SID: {message_obj.sid}")
                return True
            except Exception as e:
                logger.error(f"Failed to send real WhatsApp to {to_phone}: {e}")
                return False
        else:
            # Mock sending for local dev
            logger.info(f"\\n{'='*50}\\n[MOCK WHATSAPP]\\nTo: {to_phone}\\nMessage:\\n{message}\\n{'='*50}\\n")
            return True

    def send_email(self, to_email: str, subject: str, html_content: str) -> bool:
        """Sends an Email via SendGrid."""
        if not to_email:
            return False

        if self.sendgrid_api_key:
            try:
                import sendgrid
                from sendgrid.helpers.mail import Mail, Email, To, Content
                sg = sendgrid.SendGridAPIClient(api_key=self.sendgrid_api_key)
                from_email = Email(self.sender_email)
                to_email_obj = To(to_email)
                content = Content("text/html", html_content)
                mail = Mail(from_email, to_email_obj, subject, content)
                response = sg.client.mail.send.post(request_body=mail.get())
                logger.info(f"Email sent successfully to {to_email}. Status: {response.status_code}")
                return True
            except Exception as e:
                logger.error(f"Failed to send real Email to {to_email}: {e}")
                return False
        else:
            # Mock sending for local dev
            logger.info(f"\\n{'='*50}\\n[MOCK EMAIL]\\nTo: {to_email}\\nSubject: {subject}\\nContent:\\n{html_content}\\n{'='*50}\\n")
            return True

communication_service = CommunicationService()
