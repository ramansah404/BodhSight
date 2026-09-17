import os
from sqlalchemy import text
from app.db.session import engine

def apply_patch():
    print("Applying mock data flags to database...")
    queries = [
        "ALTER TABLE people.student ADD COLUMN IF NOT EXISTS is_mock BOOLEAN DEFAULT true;",
        "ALTER TABLE curriculum.course ADD COLUMN IF NOT EXISTS is_mock BOOLEAN DEFAULT true;",
        "ALTER TABLE agent10.academic_exception ADD COLUMN IF NOT EXISTS is_mock BOOLEAN DEFAULT true;",
        
        # Also need to drop and recreate the v_student_profile view to include is_mock
        """
        DROP VIEW IF EXISTS people.v_student_profile CASCADE;
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
                 LIMIT 1) AS fee_outstanding,
            s.reason,
            s.demo_fa1, s.demo_cla1, s.demo_fa2, s.demo_cla2, 
            s.demo_fa3, s.demo_cla3, s.demo_fa4, s.demo_cla4, s.demo_cla5,
            s.demo_internal_overall, s.demo_external, s.demo_external_overall, s.demo_total_overall,
            s.is_mock
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
    ]
    
    for q in queries:
        try:
            with engine.begin() as conn:
                conn.execute(text(q))
            print("Successfully executed query.")
        except Exception as e:
            print(f"Error executing query: {e}")

if __name__ == "__main__":
    apply_patch()
