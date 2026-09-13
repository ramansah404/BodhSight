from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel, Field
from passlib.context import CryptContext
from typing import Optional
import logging
import time
from collections import defaultdict

from app.db.session import get_db

router = APIRouter()
logger = logging.getLogger(__name__)

# Password hashing context using bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

VALID_ROLES = ["Chairman", "Principal", "Dean", "HOD", "Faculty", "IQAC"]

# -------------------------------------------------------------------
# Brute-force protection: track failed login attempts per identifier
# -------------------------------------------------------------------
_login_attempts: dict = defaultdict(list)  # identifier -> [timestamp, ...]
MAX_ATTEMPTS = 5
LOCKOUT_SECONDS = 600  # 10 minutes

def _check_rate_limit(identifier: str):
    """Raise 429 if too many failed attempts in the lockout window."""
    now = time.time()
    attempts = _login_attempts[identifier]
    # Prune old attempts outside the window
    _login_attempts[identifier] = [t for t in attempts if now - t < LOCKOUT_SECONDS]
    if len(_login_attempts[identifier]) >= MAX_ATTEMPTS:
        remaining = int(LOCKOUT_SECONDS - (now - _login_attempts[identifier][0]))
        raise HTTPException(
            status_code=429,
            detail=f"Too many failed login attempts. Please try again in {remaining // 60} minutes."
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

class AuthResponse(BaseModel):
    success: bool
    message: str
    role: Optional[str] = None
    full_name: Optional[str] = None
    email: Optional[str] = None
    department: Optional[str] = None


# -------------------------------------------------------------------
# Helper functions
# -------------------------------------------------------------------

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


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
                SELECT id, full_name, email, phone_number, password_hash, role, department
                FROM core.user_account
                WHERE email = :ident OR phone_number = :ident
            """),
            {"ident": norm_id}
        ).fetchone()

        if not user:
            _record_failure(norm_id)
            raise HTTPException(status_code=401, detail="No account found with these credentials.")

        if not verify_password(data.password, user.password_hash):
            _record_failure(norm_id)
            raise HTTPException(status_code=401, detail="Incorrect password. Please try again.")

        # Success — clear any previous failure history
        _clear_failures(norm_id)

        return AuthResponse(
            success=True,
            message="Login successful.",
            role=user.role,
            full_name=user.full_name,
            email=user.email,
            department=user.department,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(status_code=500, detail="Login failed. Please try again.")
