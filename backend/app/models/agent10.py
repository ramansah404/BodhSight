from sqlalchemy import Column, String, Integer, Float, Boolean, Date, DateTime, Numeric
from sqlalchemy.orm import declarative_base

Base = declarative_base()

class CoursePerformance(Base):
    __tablename__ = 'v_course_performance'
    __table_args__ = {'schema': 'assessment'}
    
    course_version_id = Column(Integer, primary_key=True) # View primary key alias
    course_code = Column(String)
    course_title = Column(String)
    term_id = Column(Integer)
    course_offering_id = Column(Integer)
    section_id = Column(Integer)
    department_id = Column(Integer)
    students_appeared = Column(Integer)
    passed = Column(Integer)
    pass_pct = Column(Numeric)
    avg_total = Column(Numeric)
    avg_internal = Column(Numeric)
    avg_external = Column(Numeric)
    sd_external = Column(Numeric)
    internal_external_corr = Column(Numeric)

class OpenFlag(Base):
    __tablename__ = 'v_open_flags'
    __table_args__ = {'schema': 'agentops'}
    
    risk_flag_id = Column(Integer, primary_key=True)
    agent_code = Column(String)
    agent_no = Column(String)
    flag_type = Column(String)
    severity = Column(String)
    subject_type = Column(String)
    student_id = Column(Integer)
    faculty_id = Column(Integer)
    course_offering_id = Column(Integer)
    deviation_summary = Column(String)
    suggested_first_action = Column(String)
    raised_at = Column(DateTime)
    respond_by = Column(DateTime)
    responder_user_id = Column(Integer)
    status = Column(String)
    age_hours = Column(Float)
    is_overdue = Column(Boolean)

class StudentProfile(Base):
    __tablename__ = 'v_student_profile'
    __table_args__ = {'schema': 'people'}

    student_id = Column(Integer, primary_key=True)
    roll_no = Column(String)
    full_name = Column(String)
    status = Column(String)
    programme_code = Column(String)
    department_code = Column(String)
    batch_label = Column(String)
    section_code = Column(String)
    current_year_of_study = Column(Integer)
    cgpa = Column(Numeric)
    backlog_count = Column(Integer)
    attendance_pct = Column(Numeric)
    verified_achievements = Column(Integer)
    certifications = Column(Integer)
    internships = Column(Integer)
    offers_accepted = Column(Integer)
    fee_outstanding = Column(Numeric)
