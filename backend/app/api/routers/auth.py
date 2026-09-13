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

VALID_ROLES = ["Admin", "Chairman", "Principal", "Dean", "HOD", "Faculty", "IQAC"]

# -------------------------------------------------------------------
# Brute-force protection: track failed login attempts per identifier
# -------------------------------------------------------------------
_login_attempts: dict = defaultdict(list)  # identifier -> [timestamp, ...]
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
    role: Optional[str] = None
    full_name: Optional[str] = None
    email: Optional[str] = None
    department: Optional[str] = None
    requires_2fa: Optional[bool] = None


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


# -------------------------------------------------------------------
# Endpoints
# -------------------------------------------------------------------

@router.post("/signup", response_model=AuthResponse)
def signup(data: SignupRequest, db: Session = Depends(get_db)):
    """Register a new institutional user."""
    # Validation
    if not data.email and not data.phone_number:
        raise HTTPException(status_code=422, detail="Either email or phone number is required.")
    if data.role not in VALID_ROLES:
        raise HTTPException(status_code=422, detail=f"Invalid role. Must be one of: {VALID_ROLES}")
    if data.role in ["HOD", "Faculty"] and not data.department:
        raise HTTPException(status_code=422, detail="Department is required for HOD and Faculty roles.")

    try:
        # Check if email already exists
        if data.email:
            exists = db.execute(
                text("SELECT id FROM core.user_account WHERE email = :email"),
                {"email": data.email.lower().strip()}
            ).fetchone()
            if exists:
                raise HTTPException(status_code=409, detail="An account with this email already exists.")

        # Check if phone already exists
        if data.phone_number:
            exists = db.execute(
                text("SELECT id FROM core.user_account WHERE phone_number = :phone"),
                {"phone": data.phone_number.strip()}
            ).fetchone()
            if exists:
                raise HTTPException(status_code=409, detail="An account with this phone number already exists.")

        # Hash password and insert user
        password_hash = hash_password(data.password)
        db.execute(
            text("""
                INSERT INTO core.user_account (email, phone_number, full_name, password_hash, role, department)
                VALUES (:email, :phone, :name, :hash, :role, :dept)
            """),
            {
                "email": data.email.lower().strip() if data.email else None,
                "phone": data.phone_number.strip() if data.phone_number else None,
                "name": data.full_name.strip(),
                "hash": password_hash,
                "role": data.role,
                "dept": data.department,
            }
        )
        db.commit()

        return AuthResponse(
            success=True,
            message="Account created successfully. You can now sign in.",
            role=data.role,
            full_name=data.full_name,
            email=data.email,
            department=data.department,
        )

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Signup error: {e}")
        raise HTTPException(status_code=500, detail="Failed to create account. Please try again.")


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
                SELECT id, full_name, email, phone_number, password_hash, role, department, two_factor_enabled
                FROM core.user_account
                WHERE email = :ident OR phone_number = :ident
            """),
            {"ident": norm_id}
        ).fetchone()

        if not user:
            _record_failure(norm_id)
            raise HTTPException(status_code=401, detail="No account found with these credentials.")

        if hasattr(user, 'is_active') and not getattr(user, 'is_active', True):
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
            otp = str(random.randint(100000, 999999))
            _mock_otps[norm_id] = otp
            from app.services.communication import communication_service
            if user.email:
                communication_service.send_email(user.email, "BodhSight 2FA Code", f"Your 2FA code is {otp}")
            elif user.phone_number:
                communication_service.send_whatsapp(user.phone_number, f"Your BodhSight 2FA code is {otp}")
            
            return AuthResponse(
                success=True,
                message="2FA required.",
                requires_2fa=True,
                email=norm_id # Send back to frontend for step 2
            )

        return AuthResponse(
            success=True,
            message="Login successful.",
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
            otp = str(random.randint(100000, 999999))
            _mock_otps[email] = otp
            from app.services.communication import communication_service
            communication_service.send_email(email, "BodhSight 2FA Code", f"Your 2FA code is {otp}")
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
