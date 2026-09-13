from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional, Set

from fastapi import Depends, Header, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.db.session import get_db

AGENT10_ROLES = {"FACULTY", "HOD", "DEAN", "PRINCIPAL", "CHAIRMAN", "IQAC"}
AGGREGATE_ROLES = {"DEAN", "PRINCIPAL", "CHAIRMAN", "IQAC"}


@dataclass
class Agent10Identity:
    role: str
    user_id: Optional[str] = None
    department_ids: Set[str] = field(default_factory=set)
    offering_ids: Set[str] = field(default_factory=set)
    student_ids: Set[str] = field(default_factory=set)
    course_codes: Set[str] = field(default_factory=set)
    department_codes: Set[str] = field(default_factory=set)

    @property
    def is_scoped(self) -> bool:
        return self.role in {"FACULTY", "HOD"}


def _rows(db: Session, statement: str, params: dict) -> list[dict]:
    return [dict(row._mapping) for row in db.execute(text(statement), params)]


def get_agent10_identity(
    x_user_role: Optional[str] = Header(default=None),
    x_user_id: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
) -> Agent10Identity:
    role = (x_user_role or "").strip().upper()
    if role not in AGENT10_ROLES:
        raise HTTPException(status_code=403, detail="A supported Agent 10 role is required.")
    if role in {"FACULTY", "HOD"} and not x_user_id:
        raise HTTPException(status_code=403, detail="X-User-Id is required for scoped Agent 10 access.")

    identity = Agent10Identity(role=role, user_id=x_user_id)
    if role not in {"FACULTY", "HOD"}:
        return identity

    role_row = db.execute(text("""
        SELECT 1
        FROM identity.user_role ur
        JOIN identity.role r ON r.role_id = ur.role_id
        WHERE ur.user_id = :user_id
          AND r.code = :role
          AND ur.valid_from <= current_date
          AND (ur.valid_to IS NULL OR ur.valid_to >= current_date)
        LIMIT 1
    """), {"user_id": x_user_id, "role": role}).scalar_one_or_none()
    if not role_row:
        raise HTTPException(status_code=403, detail="The user has no active scope for this role.")

    if role == "HOD":
        scope_rows = _rows(db, """
            SELECT ur.scope_id::text AS department_id
            FROM identity.user_role ur
            JOIN identity.role r ON r.role_id = ur.role_id
            WHERE ur.user_id = :user_id AND r.code = 'HOD'
              AND ur.scope_type = 'DEPARTMENT'
              AND ur.valid_from <= current_date
              AND (ur.valid_to IS NULL OR ur.valid_to >= current_date)
        """, {"user_id": x_user_id})
        identity.department_ids = {row["department_id"] for row in scope_rows if row["department_id"]}
        if not identity.department_ids:
            raise HTTPException(status_code=403, detail="The HOD has no active department scope.")
        departments = _rows(db, """
            SELECT department_id::text AS department_id, code
            FROM core.department WHERE department_id = ANY(CAST(:department_ids AS uuid[]))
        """, {"department_ids": list(identity.department_ids)})
        identity.department_codes = {row["code"] for row in departments}
        return identity

    allocation_rows = _rows(db, """
        SELECT DISTINCT fa.course_offering_id::text AS course_offering_id,
                        co.department_id::text AS department_id,
                        cv.course_code
        FROM identity.app_user u
        JOIN people.person p ON p.person_id = u.person_id
        JOIN people.faculty f ON f.person_id = p.person_id
        JOIN academics.faculty_allocation fa ON fa.faculty_id = f.faculty_id
        JOIN academics.course_offering co ON co.course_offering_id = fa.course_offering_id
        JOIN curriculum.course_version cv ON cv.course_version_id = co.course_version_id
        WHERE u.user_id = :user_id
          AND (fa.valid_to IS NULL OR fa.valid_to >= current_date)
    """, {"user_id": x_user_id})
    identity.offering_ids = {row["course_offering_id"] for row in allocation_rows}
    identity.department_ids = {row["department_id"] for row in allocation_rows if row["department_id"]}
    identity.course_codes = {row["course_code"] for row in allocation_rows if row["course_code"]}
    if not identity.offering_ids:
        raise HTTPException(status_code=403, detail="The Faculty user has no active course allocation.")
    return identity


def require_leadership_identity(identity: Agent10Identity = Depends(get_agent10_identity)) -> Agent10Identity:
    if identity.role not in AGGREGATE_ROLES:
        raise HTTPException(status_code=403, detail="This legacy endpoint is restricted to aggregate leadership roles.")
    return identity


def require_aggregate_access(identity: Agent10Identity) -> None:
    if identity.role not in AGGREGATE_ROLES and identity.role != "HOD":
        raise HTTPException(status_code=403, detail="This endpoint does not provide Faculty-scoped data.")


def allowed_department(identity: Agent10Identity, requested: Optional[str]) -> Optional[str]:
    if identity.role != "HOD":
        return requested
    if requested and requested not in identity.department_codes:
        raise HTTPException(status_code=403, detail="The requested department is outside the HOD scope.")
    if not requested and len(identity.department_codes) == 1:
        return next(iter(identity.department_codes))
    return requested


def require_course_access(identity: Agent10Identity, db: Session, course_code: str) -> None:
    if identity.role in AGGREGATE_ROLES:
        return
    if identity.role == "FACULTY" and course_code not in identity.course_codes:
        raise HTTPException(status_code=403, detail="The requested course is outside the Faculty scope.")
    if identity.role == "HOD":
        allowed = db.execute(text("""
            SELECT 1 FROM academics.course_offering co
            JOIN curriculum.course_version cv ON cv.course_version_id = co.course_version_id
            WHERE cv.course_code = :course_code
              AND co.department_id = ANY(CAST(:department_ids AS uuid[]))
            LIMIT 1
        """), {"course_code": course_code, "department_ids": list(identity.department_ids)}).scalar_one_or_none()
        if not allowed:
            raise HTTPException(status_code=403, detail="The requested course is outside the HOD scope.")


def filter_scoped_course_rows(identity: Agent10Identity, rows: list[dict]) -> list[dict]:
    if identity.role == "FACULTY":
        return [row for row in rows if row.get("course_code") in identity.course_codes]
    if identity.role == "HOD":
        return [row for row in rows if row.get("department") in identity.department_codes or row.get("department_code") in identity.department_codes]
    return rows
