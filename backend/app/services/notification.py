import logging
from app.services.communication import communication_service

logger = logging.getLogger(__name__)

async def send_email_otp(to_email: str, otp: str) -> bool:
    print(f"\n{'='*40}\n[DEV] BodhSight Email OTP for {to_email}: {otp}\n{'='*40}\n")
    try:
        subject = "Your BodhSight OTP"
        content = f"Your OTP is: {otp}. It is valid for 5 minutes."
        return communication_service.send_email(to_email, subject, content)
    except Exception as e:
        logger.error(f"Failed to send email OTP: {e}")
        return False

async def send_whatsapp_otp(to_number: str, otp: str) -> bool:
    print(f"\n{'='*40}\n[DEV] BodhSight WhatsApp OTP for {to_number}: {otp}\n{'='*40}\n")
    try:
        message = f"Your BodhSight verification code is: {otp}"
        return communication_service.send_whatsapp(to_number, message)
    except Exception as e:
        logger.error(f"Failed to send whatsapp OTP: {e}")
        return False
