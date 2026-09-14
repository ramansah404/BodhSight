import os
import httpx
import logging

logger = logging.getLogger(__name__)

SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY")
SENDER_EMAIL = os.getenv("SENDER_EMAIL")
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_WHATSAPP_NUMBER = os.getenv("TWILIO_WHATSAPP_NUMBER")

async def send_email_otp(to_email: str, otp: str) -> bool:
    if not SENDGRID_API_KEY or not SENDER_EMAIL:
        logger.warning("SendGrid credentials not configured.")
        return False
        
    url = "https://api.sendgrid.com/v3/mail/send"
    headers = {
        "Authorization": f"Bearer {SENDGRID_API_KEY}",
        "Content-Type": "application/json"
    }
    data = {
        "personalizations": [{"to": [{"email": to_email}]}],
        "from": {"email": SENDER_EMAIL},
        "subject": "Your BodhSight OTP",
        "content": [{"type": "text/plain", "value": f"Your OTP is: {otp}. It is valid for 5 minutes."}]
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(url, headers=headers, json=data)
        if response.status_code in (200, 202):
            return True
        logger.error(f"SendGrid error: {response.text}")
        return False


async def send_whatsapp_otp(to_number: str, otp: str) -> bool:
    if not TWILIO_ACCOUNT_SID or not TWILIO_AUTH_TOKEN or not TWILIO_WHATSAPP_NUMBER:
        logger.warning("Twilio credentials not configured.")
        return False
        
    url = f"https://api.twilio.com/2010-04-01/Accounts/{TWILIO_ACCOUNT_SID}/Messages.json"
    
    # Twilio expects WhatsApp numbers to be prefixed with 'whatsapp:'
    if not to_number.startswith("whatsapp:"):
        # Format typical Indian numbers assuming they might come without country code
        if len(to_number) == 10:
            to_number = f"+91{to_number}"
        to_number = f"whatsapp:{to_number}"
        
    data = {
        "To": to_number,
        "From": TWILIO_WHATSAPP_NUMBER,
        "Body": f"Your BodhSight verification code is: {otp}"
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(url, data=data, auth=(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN))
        if response.status_code in (200, 201):
            return True
        logger.error(f"Twilio error: {response.text}")
        return False
