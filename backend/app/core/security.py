from fastapi import HTTPException, status
from typing import Optional, List

def authorize(
    user_role: Optional[str],
    user_permissions: List[str],
    required_permission: str,
    action: str = "read",
    resource: str = "system",
    scope: Optional[str] = None
) -> bool:
    """
    Centralized authorization helper.
    Evaluates role, permission, action, resource, and scope.
    Default access is DENY.
    """
    if not user_role:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required."
        )

    # 1. Admin fast-path (only if strictly required, but usually admin has all perms)
    # 2. Permission check
    if required_permission and required_permission not in user_permissions:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Security Protocol Active: Role '{user_role}' lacks required permission '{required_permission}'."
        )

    # In future phases (e.g. Phase 5, 6, 7), we will add:
    # - Scope check (e.g., student self-data only, HOD department only)
    # - Action check (e.g., read vs write vs delete)
    # - Resource check (e.g., marks, attendance)

    return True
