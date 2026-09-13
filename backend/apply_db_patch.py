import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.session import engine
from sqlalchemy import text
import logging

logging.basicConfig(level=logging.INFO)

def apply_patch():
    # 1. Add column to people.student
    try:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE people.student ADD COLUMN demo_backlog_override INT;"))
        logging.info("Added demo_backlog_override column.")
    except Exception as e:
        logging.info(f"Column might already exist: {e}")
        
    with engine.begin() as conn:
        view_def = """
        CREATE OR REPLACE VIEW people.v_student_profile AS
           SELECT s.student_id,
            s.roll_no,
            per.full_name,
            s.status,
            p.code AS programme_code,
            d.code AS department_code,
            b.label AS batch_label,
            sec.code AS section_code,
            s.current_year_of_study,
            COALESCE(s.demo_marks_override, tr.cgpa) AS cgpa,
            COALESCE(s.demo_backlog_override, tr.backlog_count)::smallint AS backlog_count,
            COALESCE(s.demo_attendance_override, ( SELECT round(avg(a.adjusted_pct), 2) AS round
                   FROM attendance.v_current_attendance a
                  WHERE ((a.student_id = s.student_id) AND (a.course_offering_id IS NULL)))) AS attendance_pct,
            ( SELECT count(*) AS count
                   FROM studentlife.achievement ach
                  WHERE ((ach.student_id = s.student_id) AND (ach.verification_status = 'VERIFIED'::text))) AS verified_achievements,
            ( SELECT count(*) AS count
                   FROM studentlife.student_certification sc
                  WHERE ((sc.student_id = s.student_id) AND (sc.verification_status = 'VERIFIED'::text))) AS certifications,
            ( SELECT count(*) AS count
                   FROM placement.internship i
                  WHERE ((i.student_id = s.student_id) AND (i.status = 'COMPLETED'::text))) AS internships,
            ( SELECT count(*) AS count
                   FROM placement.offer o
                  WHERE ((o.student_id = s.student_id) AND (o.status = ANY (ARRAY['ACCEPTED'::text, 'JOINED'::text])))) AS offers_accepted,
            ( SELECT fd.outstanding
                   FROM finance.fee_demand fd
                  WHERE (fd.student_id = s.student_id)
                  ORDER BY fd.created_at DESC
                 LIMIT 1) AS fee_outstanding
           FROM ((((((people.student s
             JOIN people.person per ON ((per.person_id = s.person_id)))
             JOIN curriculum.batch b ON ((b.batch_id = s.batch_id)))
             JOIN curriculum.programme p ON ((p.programme_id = b.programme_id)))
             JOIN core.department d ON ((d.department_id = p.department_id)))
             LEFT JOIN curriculum.section sec ON ((sec.section_id = s.current_section_id)))
             LEFT JOIN LATERAL ( SELECT tr2.cgpa,
                    tr2.backlog_count
                   FROM assessment.term_result tr2
                  WHERE (tr2.student_id = s.student_id)
                  ORDER BY tr2.published_on DESC NULLS LAST
                 LIMIT 1) tr ON (true));
        """
        conn.execute(text(view_def))
        logging.info("Updated v_student_profile view successfully.")

if __name__ == "__main__":
    apply_patch()
