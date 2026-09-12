from typing import List, Dict, Any, Callable
from fastapi import Header

def get_current_user_role(x_user_role: str = Header("Dean")) -> str:
    return x_user_role

def get_current_user_name(x_user_name: str = Header("User")) -> str:
    return x_user_name

def filter_by_rbac(data: List[Dict[str, Any]], role: str, name: str, dept_key: str = "department", course_key: str = "course_code") -> List[Dict[str, Any]]:
    """
    Strictly filters a list of dictionaries based on the user's role and identity.
    - Chairman / Dean: Unrestricted global access.
    - HOD: Restricted to their department ("CS" for demo).
    - Faculty: Restricted to their assigned courses ("CS101" for demo).
    """
    # Demo mappings based on Login.tsx
    HOD_DEPT = "CS"
    FACULTY_COURSE = "CS101"
    
    if role in ["Chairman", "Dean"]:
        return data
        
    if role == "HOD":
        return [item for item in data if item.get(dept_key) == HOD_DEPT or item.get(dept_key) == "Computer Science"]
        
    if role == "Faculty":
        return [item for item in data if item.get(course_key) == FACULTY_COURSE]
        
    # Default fail-secure (e.g. unknown role)
    return []

def apply_rbac(items: list, role: str, name: str, dept_key: str = "department", course_key: str = "course_code") -> list:
    """Wrapper that handles both dict and objects with __dict__"""
    if not items:
        return items
        
    is_dict = isinstance(items[0], dict)
    
    dict_items = items if is_dict else [i.__dict__ if hasattr(i, '__dict__') else dict(i) for i in items]
    filtered_dicts = filter_by_rbac(dict_items, role, name, dept_key, course_key)
    
    if is_dict:
        return filtered_dicts
    else:
        # If the original items were objects, we need to map back to original objects
        # To do this safely, we will just return the filtered dicts as dicts, 
        # but agent10.py mostly uses dicts already before returning.
        return filtered_dicts
