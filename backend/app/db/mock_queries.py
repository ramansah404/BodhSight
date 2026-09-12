import random
import time
from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session

# Dynamic random seed based on time to simulate "real-time" data
def _jitter(base: float, percent: float = 0.05) -> float:
    # +/- percent jitter
    return round(base * (1 + random.uniform(-percent, percent)), 2)

def get_course_performance_all(db: Session) -> List[Dict[str, Any]]:
    return [
        {"course_version_id": 1, "course_code": "CS101", "course_title": "Intro to CS", "term_id": 1, "course_offering_id": 1, "section_id": 1, "department_id": 1, "students_appeared": int(_jitter(200)), "passed": int(_jitter(180)), "pass_pct": _jitter(90.0), "avg_total": _jitter(85.0), "avg_internal": _jitter(40.0), "avg_external": _jitter(45.0), "sd_external": _jitter(5.0), "internal_external_corr": _jitter(0.8)},
        {"course_version_id": 2, "course_code": "MATH101", "course_title": "Calculus", "term_id": 1, "course_offering_id": 2, "section_id": 2, "department_id": 2, "students_appeared": int(_jitter(150)), "passed": int(_jitter(100)), "pass_pct": _jitter(66.6), "avg_total": _jitter(60.0), "avg_internal": _jitter(30.0), "avg_external": _jitter(30.0), "sd_external": _jitter(15.0), "internal_external_corr": _jitter(0.5)},
        {"course_version_id": 3, "course_code": "PHYS101", "course_title": "Physics", "term_id": 1, "course_offering_id": 3, "section_id": 3, "department_id": 3, "students_appeared": int(_jitter(180)), "passed": int(_jitter(90)), "pass_pct": _jitter(50.0), "avg_total": _jitter(50.0), "avg_internal": _jitter(25.0), "avg_external": _jitter(25.0), "sd_external": _jitter(25.0), "internal_external_corr": _jitter(0.1)},
    ]

def get_course_performance_summary(db: Session) -> Dict[str, Any]:
    return {
        "total_course_sections": 3,
        "students_evaluated": int(_jitter(530)),
        "total_passed": int(_jitter(370)),
        "avg_pass_pct": _jitter(68.8),
        "avg_marks": _jitter(65.0),
        "avg_sd_external": _jitter(15.0),
        "min_pass_pct": _jitter(50.0),
        "max_pass_pct": _jitter(90.0)
    }

def get_low_pass_rate_courses(db: Session, threshold: float = 60.0) -> List[Dict[str, Any]]:
    # Return PHYS101
    all_courses = get_course_performance_all(db)
    return [c for c in all_courses if c["pass_pct"] < threshold]

def get_high_stddev_courses(db: Session, threshold: float = 20.0) -> List[Dict[str, Any]]:
    all_courses = get_course_performance_all(db)
    return [c for c in all_courses if c["sd_external"] > threshold]

def get_corr_anomaly_courses(db: Session, threshold: float = 0.2) -> List[Dict[str, Any]]:
    all_courses = get_course_performance_all(db)
    return [c for c in all_courses if c["internal_external_corr"] < threshold]

def get_offering_roster_summary(db: Session) -> Dict[str, Any]:
    return {
        "total_students_registered": int(_jitter(1000)),
        "total_offerings": 15,
        "total_departments": 5,
        "total_programmes": 3,
        "total_sections": 20,
        "total_terms": 2
    }

def get_department_student_counts(db: Session) -> List[Dict[str, Any]]:
    return [
        {"department_code": "CS", "student_count": int(_jitter(400)), "offerings": 5, "sections": 8},
        {"department_code": "MATH", "student_count": int(_jitter(300)), "offerings": 4, "sections": 6},
        {"department_code": "PHYS", "student_count": int(_jitter(200)), "offerings": 3, "sections": 4},
    ]

def get_course_section_roster(db: Session) -> List[Dict[str, Any]]:
    return [
        {"course_code": "CS101", "course_title": "Intro to CS", "department_code": "CS", "section_code": "A", "term_label": "Fall 2026", "enrolled_students": int(_jitter(100))},
        {"course_code": "CS101", "course_title": "Intro to CS", "department_code": "CS", "section_code": "B", "term_label": "Fall 2026", "enrolled_students": int(_jitter(100))},
        {"course_code": "MATH101", "course_title": "Calculus", "department_code": "MATH", "section_code": "A", "term_label": "Fall 2026", "enrolled_students": int(_jitter(150))},
        {"course_code": "PHYS101", "course_title": "Physics", "department_code": "PHYS", "section_code": "A", "term_label": "Fall 2026", "enrolled_students": int(_jitter(180))},
    ]

def get_student_profile_summary(db: Session) -> Dict[str, Any]:
    return {
        "total_students": 1000,
        "active_students": int(_jitter(950)),
        "avg_cgpa": _jitter(7.5, 0.02),
        "students_with_backlogs": int(_jitter(120)),
        "students_high_backlogs": int(_jitter(15))
    }

def get_students_with_backlogs(db: Session, min_backlogs: int = 1) -> List[Dict[str, Any]]:
    return [
        {"student_id": 1, "roll_no": "R001", "full_name": "Alice Smith", "department_code": "CS", "programme_code": "BTech", "batch_label": "2024", "cgpa": _jitter(5.2), "backlog_count": 4, "status": "ACTIVE"},
        {"student_id": 2, "roll_no": "R002", "full_name": "Bob Jones", "department_code": "MATH", "programme_code": "BSc", "batch_label": "2024", "cgpa": _jitter(6.1), "backlog_count": 2, "status": "ACTIVE"},
    ]

def get_open_flags(db: Session) -> List[Dict[str, Any]]:
    return []

def get_open_flags_count(db: Session) -> int:
    return int(_jitter(5, 0.5))

def get_critical_high_flags(db: Session) -> List[Dict[str, Any]]:
    return []

def get_department_performance(db: Session) -> List[Dict[str, Any]]:
    return [
        {"department_code": "CS", "total_students": int(_jitter(400)), "total_offerings": 5, "avg_pass_rate": _jitter(85.0), "avg_marks": _jitter(80.0), "low_pass_offerings": 0},
        {"department_code": "MATH", "total_students": int(_jitter(300)), "total_offerings": 4, "avg_pass_rate": _jitter(70.0), "avg_marks": _jitter(65.0), "low_pass_offerings": 1},
        {"department_code": "PHYS", "total_students": int(_jitter(200)), "total_offerings": 3, "avg_pass_rate": _jitter(55.0), "avg_marks": _jitter(50.0), "low_pass_offerings": 2},
    ]

def get_section_comparison(db: Session) -> List[Dict[str, Any]]:
    return get_course_performance_all(db)

def get_section_disparity(db: Session, disparity_threshold: float = 20.0) -> List[Dict[str, Any]]:
    return []

def get_term_context(db: Session) -> Dict[str, Any]:
    return {
        "term_id": "1", "term_label": "Fall 2026", "status": "ACTIVE",
        "academic_year": "2026-2027", "start_date": "2026-08-01", "end_date": "2026-12-15"
    }
