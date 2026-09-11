import sys
sys.path.insert(0, '.')
from app.core.config import settings
from app.db.session import SessionLocal
from app.agents.agent10 import analytics

db = SessionLocal()
try:
    dash = analytics.compute_dashboard_metrics(db)
    print('=== DASHBOARD ===')
    for k, v in dash.items():
        if k != '_meta':
            print(f'  {k}: {v}')
    
    print()
    print('=== COURSE PERFORMANCE ===')
    courses = analytics.compute_course_performance(db)
    print(f'  Total: {len(courses)} courses/sections')
    for c in courses:
        code = c.get('course_code', '')
        priority = c.get('priority', '')
        pr = c.get('pass_rate', 0)
        n = c.get('students_appeared', 0)
        print(f'  {code:8s} [{priority:8s}] pass={pr}% n={n}')
    
    print()
    print('=== ANOMALIES ===')
    anomalies = analytics.compute_anomalies(db)
    print(f'  Total: {len(anomalies)} anomalies')
    for a in anomalies[:8]:
        sev = a.get('severity', '')
        atype = a.get('anomaly_type', '')[:30]
        score = a.get('priority_score', 0)
        title = a.get('title', '')[:55]
        print(f'  [{sev:8s}] {atype:32s} score={score} | {title}')
    
    print()
    print('=== PRIORITIES ===')
    priorities = analytics.compute_priorities(db)
    for p in priorities[:6]:
        rank = p.get('rank', 0)
        prio = p.get('priority', '')
        code = p.get('course_code', '')
        score = p.get('severity_score', 0)
        print(f'  #{rank} [{prio:8s}] {code:8s} score={score}')

finally:
    db.close()
print('ALL OK')
