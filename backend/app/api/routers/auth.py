from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel, Field
import bcrypt
from typing import Optional
import logging
import time
from collections import defaultdict

from app.db.session import get_db

router = APIRouter()
logger = logging.getLogger(__name__)

logger = logging.getLogger(__name__)

VALID_ROLES = ["Chairman", "Principal", "Dean", "HOD", "Faculty", "IQAC"]

# -------------------------------------------------------------------
# Brute-force protection: track failed login attempts per identifier
# -------------------------------------------------------------------
_login_attempts: dict = defaultdict(list)  # identifier -> [timestamp, ...]
_otps: dict = {}  # identifier -> otp
_pending_signups: dict = {} # identifier -> SignupRequest
MAX_ATTEMPTS = 5
LOCKOUT_SECONDS = 60  # 1 minute

def _check_rate_limit(identifier: str):
    """Raise 429 if too many failed attempts in the lockout window."""
    now = time.time()
    attempts = _login_attempts[identifier]
    # Prune old attempts outside the window
    _login_attempts[identifier] = [t for t in attempts if now - t < LOCKOUT_SECONDS]
    if len(_login_attempts[identifier]) >= MAX_ATTEMPTS:
        remaining = int(LOCKOUT_SECONDS - (now - _login_attempts[identifier][0]))
        msg = f"{remaining} seconds" if remaining < 60 else f"{int(remaining / 60) + (1 if remaining % 60 > 0 else 0)} minutes"
        raise HTTPException(
            status_code=429,
            detail=f"Too many failed login attempts. Please try again in {msg}."
        )

def _record_failure(identifier: str):
    _login_attempts[identifier].append(time.time())

def _clear_failures(identifier: str):
    _login_attempts.pop(identifier, None)


# -------------------------------------------------------------------
# Pydantic Models
# -------------------------------------------------------------------

class SignupRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=120)
    email: Optional[str] = Field(None)
    phone_number: Optional[str] = Field(None)
    password: str = Field(..., min_length=8)
    role: str
    department: Optional[str] = None

class LoginRequest(BaseModel):
    identifier: str = Field(..., description="Email or phone number")
    password: str = Field(...)

class GoogleAuthRequest(BaseModel):
    token: str
    role: Optional[str] = "Student"
    department: Optional[str] = None

class AuthResponse(BaseModel):
    success: bool
    message: str
    token: Optional[str] = None
    role: Optional[str] = None
    full_name: Optional[str] = None
    email: Optional[str] = None
    department: Optional[str] = None
    requires_2fa: Optional[bool] = None

class OtpRequest(BaseModel):
    identifier: str

class VerifyOtpRequest(BaseModel):
    identifier: str
    otp: str

class ForgotPasswordRequest(BaseModel):
    identifier: str

class ResetPasswordRequest(BaseModel):
    identifier: str
    otp: str
    new_password: str = Field(..., min_length=8)


# -------------------------------------------------------------------
# Helper functions
# -------------------------------------------------------------------

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode('utf-8'), hashed.encode('utf-8'))
    except Exception:
        return False

import jwt
from datetime import datetime, timedelta

SECRET_KEY = "super_secret_bodhsight_jwt_key_for_testing"
ALGORITHM = "HS256"

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=7)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


# -------------------------------------------------------------------
# Endpoints
# -------------------------------------------------------------------

@router.post("/signup", response_model=AuthResponse)
async def signup(data: SignupRequest, db: Session = Depends(get_db)):
    """Initiates registration by sending an OTP. Account is NOT created yet."""
    # Validation
    if not data.email and not data.phone_number:
        raise HTTPException(status_code=422, detail="Either email or phone number is required.")
    if data.role not in VALID_ROLES:
        raise HTTPException(status_code=422, detail=f"Invalid role. Must be one of: {VALID_ROLES}")
    if data.role in ["HOD", "Faculty"] and not data.department:
        raise HTTPException(status_code=422, detail="Department is required for HOD and Faculty roles.")
    if len(data.password) < 8:
        raise HTTPException(status_code=422, detail="Password must be at least 8 characters long.")

    try:
        # Check if email already exists
        identifier = ""
        if data.email:
            identifier = data.email.lower().strip()
            exists = db.execute(
                text("SELECT id FROM core.user_account WHERE email = :email"),
                {"email": identifier}
            ).fetchone()
            if exists:
                raise HTTPException(status_code=409, detail="An account with this email already exists.")
        
        # Check if phone already exists
        if data.phone_number and not identifier:
            identifier = data.phone_number.strip()
            exists = db.execute(
                text("SELECT id FROM core.user_account WHERE phone_number = :phone"),
                {"phone": identifier}
            ).fetchone()
            if exists:
                raise HTTPException(status_code=409, detail="An account with this phone number already exists.")

        # Store pending signup and send OTP
        import random
        from app.services.notification import send_email_otp, send_whatsapp_otp
        
        otp = str(random.randint(100000, 999999))
        _otps[identifier] = otp
        _pending_signups[identifier] = data

        if '@' in identifier and data.email:
            await send_email_otp(data.email, otp)
        elif data.phone_number:
            await send_whatsapp_otp(data.phone_number, otp)

        return AuthResponse(
            success=True,
            message="OTP sent. Please verify to complete account creation.",
            requires_2fa=True, # Signal frontend to ask for OTP
            email=identifier
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Signup error: {e}")
        raise HTTPException(status_code=500, detail="Failed to initiate account creation. Please try again.")

@router.post("/verify-signup", response_model=AuthResponse)
def verify_signup(data: VerifyOtpRequest, db: Session = Depends(get_db)):
    """Verifies OTP and creates the account."""
    identifier = data.identifier.strip().lower()
    
    if _otps.get(identifier) != data.otp:
        raise HTTPException(status_code=401, detail="Invalid or expired OTP.")
        
    pending_data = _pending_signups.get(identifier)
    if not pending_data:
        raise HTTPException(status_code=400, detail="No pending signup found for this identifier.")

    try:
        # Clear the OTP & Pending Data
        _otps.pop(identifier, None)
        _pending_signups.pop(identifier, None)
        
        # Hash password and insert user
        password_hash = hash_password(pending_data.password)
        db.execute(
            text("""
                INSERT INTO core.user_account (email, phone_number, full_name, password_hash, role, department)
                VALUES (:email, :phone, :name, :hash, :role, :dept)
            """),
            {
                "email": pending_data.email.lower().strip() if pending_data.email else None,
                "phone": pending_data.phone_number.strip() if pending_data.phone_number else None,
                "name": pending_data.full_name.strip(),
                "hash": password_hash,
                "role": pending_data.role,
                "dept": pending_data.department,
            }
        )
        db.commit()

        token = create_access_token({"sub": pending_data.email or pending_data.phone_number, "role": pending_data.role, "dept": pending_data.department})
        
        return AuthResponse(
            success=True,
            message="Account created successfully. Login successful.",
            token=token,
            role=pending_data.role,
            full_name=pending_data.full_name,
            email=pending_data.email,
            department=pending_data.department,
            requires_2fa=False,
        )
    except Exception as e:
        db.rollback()
        logger.error(f"Signup verification error: {e}")
        raise HTTPException(status_code=500, detail="Failed to create account. Please try again.")

@router.post("/forgot-password")
async def forgot_password(data: ForgotPasswordRequest, db: Session = Depends(get_db)):
    identifier = data.identifier.strip().lower()
    
    user = db.execute(
        text("SELECT email, phone_number FROM core.user_account WHERE email = :ident OR phone_number = :ident"),
        {"ident": identifier}
    ).fetchone()
    
    if not user:
        # Prevent user enumeration
        return {"success": True, "message": "If the account exists, an OTP has been sent."}
        
    import random
    from app.services.notification import send_email_otp, send_whatsapp_otp
    
    otp = str(random.randint(100000, 999999))
    _otps[identifier] = otp
    
    if '@' in identifier and user.email:
        await send_email_otp(user.email, otp)
    elif user.phone_number:
        await send_whatsapp_otp(user.phone_number, otp)
        
    return {"success": True, "message": "If the account exists, an OTP has been sent."}

@router.post("/reset-password", response_model=AuthResponse)
def reset_password(data: ResetPasswordRequest, db: Session = Depends(get_db)):
    identifier = data.identifier.strip().lower()
    
    if _otps.get(identifier) != data.otp:
        raise HTTPException(status_code=401, detail="Invalid or expired OTP.")
        
    user = db.execute(
        text("SELECT id FROM core.user_account WHERE email = :ident OR phone_number = :ident"),
        {"ident": identifier}
    ).fetchone()
    
    if not user:
        raise HTTPException(status_code=401, detail="Account not found.")
        
    try:
        # Clear the OTP
        _otps.pop(identifier, None)
        
        # Update Password
        password_hash = hash_password(data.new_password)
        db.execute(
            text("UPDATE core.user_account SET password_hash = :hash WHERE id = :id"),
            {"hash": password_hash, "id": user.id}
        )
        db.commit()

        return AuthResponse(
            success=True,
            message="Password reset successfully. You can now login.",
            requires_2fa=False,
        )
    except Exception as e:
        db.rollback()
        logger.error(f"Reset password error: {e}")
        raise HTTPException(status_code=500, detail="Failed to reset password. Please try again.")


@router.post("/login", response_model=AuthResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate an institutional user."""
    if not data.identifier or not data.password:
        raise HTTPException(status_code=422, detail="Email/phone and password are required.")

    identifier = data.identifier.strip()
    norm_id = identifier.lower() if "@" in identifier else identifier

    # Check rate limit before hitting the database
    _check_rate_limit(norm_id)

    try:
        user = db.execute(
            text("""
                SELECT id, full_name, email, phone_number, password_hash, role, department, two_factor_enabled, is_active
                FROM core.user_account
                WHERE email = :ident OR phone_number = :ident
            """),
            {"ident": norm_id}
        ).fetchone()

        if not user:
            _record_failure(norm_id)
            raise HTTPException(status_code=401, detail="No account found with these credentials.")

        if hasattr(user, 'is_active') and getattr(user, 'is_active', True) is False:
            _record_failure(norm_id)
            raise HTTPException(status_code=403, detail="Your account has been deactivated. Contact administration.")

        if not verify_password(data.password, user.password_hash):
            _record_failure(norm_id)
            raise HTTPException(status_code=401, detail="Incorrect password. Please try again.")

        # Success — clear any previous failure history
        _clear_failures(norm_id)

        if getattr(user, 'two_factor_enabled', False):
            # Send OTP for 2FA
            import random
            from app.services.notification import send_email_otp, send_whatsapp_otp
            
            otp = str(random.randint(100000, 999999))
            _otps[norm_id] = otp
            
            import asyncio
            if user.email and '@' in norm_id:
                asyncio.create_task(send_email_otp(user.email, otp))
            elif user.phone_number:
                asyncio.create_task(send_whatsapp_otp(user.phone_number, otp))
            
            return AuthResponse(
                success=True,
                message="2FA required.",
                requires_2fa=True,
                email=norm_id # Send back to frontend for step 2
            )

        token = create_access_token({"sub": user.email or user.phone_number, "role": user.role, "dept": user.department})
        return AuthResponse(
            success=True,
            message="Login successful.",
            token=token,
            role=user.role,
            full_name=user.full_name,
            email=user.email,
            department=user.department,
            requires_2fa=False,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(status_code=500, detail="Login failed. Please try again.")

@router.post("/request-otp")
async def request_otp(data: OtpRequest, db: Session = Depends(get_db)):
    identifier = data.identifier.strip().lower()
    
    user = db.execute(
        text("SELECT email, phone_number FROM core.user_account WHERE email = :ident OR phone_number = :ident"),
        {"ident": identifier}
    ).fetchone()
    
    if not user:
        # Don't reveal user existence
        return {"success": True, "message": "If the account exists, an OTP has been sent."}
        
    import random
    from app.services.notification import send_email_otp, send_whatsapp_otp
    
    otp = str(random.randint(100000, 999999))
    _otps[identifier] = otp
    
    if '@' in identifier and user.email:
        await send_email_otp(user.email, otp)
    elif user.phone_number:
        await send_whatsapp_otp(user.phone_number, otp)
        
    return {"success": True, "message": "OTP sent successfully."}

@router.post("/verify-otp", response_model=AuthResponse)
def verify_otp(data: VerifyOtpRequest, db: Session = Depends(get_db)):
    identifier = data.identifier.strip().lower()
    
    if _otps.get(identifier) != data.otp:
        raise HTTPException(status_code=401, detail="Invalid or expired OTP.")
        
    # Clear the OTP
    _otps.pop(identifier, None)
    
    user = db.execute(
        text("""
            SELECT id, full_name, email, phone_number, role, department, two_factor_enabled, is_active
            FROM core.user_account
            WHERE email = :ident OR phone_number = :ident
        """),
        {"ident": identifier}
    ).fetchone()
    
    if not user or (hasattr(user, 'is_active') and getattr(user, 'is_active', True) is False):
        raise HTTPException(status_code=401, detail="Authentication failed.")
        
    return AuthResponse(
        success=True,
        message="Verification successful.",
        role=user.role,
        full_name=user.full_name,
        email=user.email,
        department=user.department,
        requires_2fa=False,
    )

class Toggle2FARequest(BaseModel):
    enable: bool
    identifier: str

@router.post("/toggle-2fa")
def toggle_2fa(data: Toggle2FARequest, db: Session = Depends(get_db)):
    try:
        sql = text("UPDATE core.user_account SET two_factor_enabled = :en WHERE email = :id OR phone_number = :id")
        db.execute(sql, {"en": data.enable, "id": data.identifier.strip()})
        db.commit()
        return {"success": True, "message": "2FA preferences updated."}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to update 2FA preferences.")

@router.post("/google", response_model=AuthResponse)
def google_auth(data: GoogleAuthRequest, db: Session = Depends(get_db)):
    try:
        from google.oauth2 import id_token
        from google.auth.transport import requests
        import os
        
        # Verify the token
        # Note: In production, pass GOOGLE_CLIENT_ID to verify_oauth2_token.
        # If GOOGLE_CLIENT_ID is empty, verification might skip client_id check but we should provide it.
        # However, for local testing if GOOGLE_CLIENT_ID isn't set, we might need a workaround or just expect it to be set.
        client_id = os.environ.get("GOOGLE_CLIENT_ID", "")
        # To bypass verification when GOOGLE_CLIENT_ID is missing (e.g. mock mode):
        if not client_id:
            # ONLY FOR LOCAL MOCKING - Parse without verification
            import jwt
            idinfo = jwt.decode(data.token, options={"verify_signature": False})
        else:
            idinfo = id_token.verify_oauth2_token(data.token, requests.Request(), client_id)
        
        email = idinfo['email']
        name = idinfo.get('name', 'User')
        picture = idinfo.get('picture', None)
        google_id = idinfo.get('sub', email)
        
        user = db.execute(
            text("SELECT * FROM core.user_account WHERE email = :email"),
            {"email": email}
        ).fetchone()
        
        if not user:
            # Create user
            db.execute(
                text("""
                    INSERT INTO core.user_account 
                    (email, full_name, role, department, google_id, profile_image_url)
                    VALUES (:email, :name, :role, :dept, :google_id, :pic)
                """),
                {
                    "email": email, "name": name, "role": data.role, 
                    "dept": data.department, "google_id": google_id, "pic": picture
                }
            )
            db.commit()
            
            user = db.execute(text("SELECT * FROM core.user_account WHERE email = :email"), {"email": email}).fetchone()
            
        elif not getattr(user, 'google_id', None):
            # Link Google account to existing user
            db.execute(
                text("UPDATE core.user_account SET google_id = :google_id, profile_image_url = COALESCE(profile_image_url, :pic) WHERE email = :email"),
                {"google_id": google_id, "pic": picture, "email": email}
            )
            db.commit()

        # 2FA Check
        if getattr(user, 'two_factor_enabled', False):
            import random
            from app.services.notification import send_email_otp
            import asyncio
            
            otp = str(random.randint(100000, 999999))
            _otps[email] = otp
            asyncio.create_task(send_email_otp(email, otp))
            
            return AuthResponse(
                success=True, message="2FA required.", requires_2fa=True, email=email
            )
            
        return AuthResponse(
            success=True, message="Login successful.", role=user.role,
            full_name=user.full_name, email=user.email, department=user.department,
            requires_2fa=False
        )

    except ValueError as ve:
        raise HTTPException(status_code=401, detail="Invalid Google token")
    except Exception as e:
        logger.error(f"Google auth error: {e}")
        raise HTTPException(status_code=500, detail="Google authentication failed.")
