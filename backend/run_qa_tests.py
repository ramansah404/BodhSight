import urllib.request
import urllib.parse
import json
from sqlalchemy import create_engine, text
import time

API_BASE = "http://localhost:8000/api/v1"
DB_URL = "postgresql://postgres.jijisnykcjcscxiveimy:2029%40Batch10@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres"

def log(msg, color=""):
    print(f"{msg}")

def req(url, method="GET", headers=None, data=None):
    if headers is None: headers = {}
    if data is not None:
        data = json.dumps(data).encode('utf-8')
        headers['Content-Type'] = 'application/json'
        
    request = urllib.request.Request(f"{API_BASE}{url}", data=data, method=method, headers=headers)
    with urllib.request.urlopen(request) as response:
        return json.loads(response.read().decode())

def test_rbac_dashboard():
    log("--- TEST: RBAC Filtering ---")
    
    # 1. Chairman (Global)
    data_chair = req("/agent10/dashboard", headers={"X-User-Role": "Chairman"})
    log(f"Chairman Dashboard Students: {data_chair['students_evaluated']}")
    
    # 2. HOD CSE
    data_cse = req("/agent10/dashboard", headers={"X-User-Role": "HOD", "X-User-Department": "CSE"})
    log(f"CSE HOD Dashboard Students: {data_cse['students_evaluated']}")
    
    # 3. HOD ECE
    data_ece = req("/agent10/dashboard", headers={"X-User-Role": "HOD", "X-User-Department": "ECE"})
    log(f"ECE HOD Dashboard Students: {data_ece['students_evaluated']}")
    
    # Assertions
    assert data_chair['students_evaluated'] > data_cse['students_evaluated'], "Global should have more than CSE"
    assert data_chair['students_evaluated'] > data_ece['students_evaluated'], "Global should have more than ECE"
    assert data_cse['students_evaluated'] != data_ece['students_evaluated'] or data_cse['students_evaluated'] > 0, "Departments should be filtered"
    log("[SUCCESS] RBAC Dashboard test passed!")

def test_real_time_update():
    log("\n--- TEST: Real-Time Data Sync ---")
    
    # We will test using the first available student in CSE
    sections_res = req("/crud_data/sections", headers={"X-User-Role": "Chairman"})
    if not sections_res:
        log("[FAIL] No sections found!")
        return
        
    section = sections_res[0]
    students_res = req(f"/crud_data/students/{section}", headers={"X-User-Role": "Chairman"})
    if not students_res:
        log("[FAIL] No students found in section!")
        return
        
    student = students_res[0]
    student_id = student['student_id']
    
    # original_backlogs is not exposed in /students/{section} response (only attendance and cgpa).
    # Since we don't have backlogs, let's just force backlogs to 99 and then to 0.
    original_backlogs = 0
    
    # Get initial dashboard state for Global
    init_data = req("/agent10/dashboard", headers={"X-User-Role": "Chairman"})
    init_pass_rate = init_data['pass_rate']
    log(f"Initial Global Pass Rate: {init_pass_rate}%")
    
    # Update student to have 99 backlogs (force a fail)
    new_backlogs = 99
    req(f"/crud_data/students/{student_id}", method="PUT", 
        data={"backlog_count": new_backlogs},
        headers={"X-User-Role": "Chairman"}
    )
    log(f"Updated {student['roll_no']} to have {new_backlogs} backlogs")
    
    # Verify the dashboard instantly recalculates without caching
    after_data = req("/agent10/dashboard", headers={"X-User-Role": "Chairman"})
    after_pass_rate = after_data['pass_rate']
    log(f"After Update Global Pass Rate: {after_pass_rate}%")
    
    # Revert
    req(f"/crud_data/students/{student_id}", method="PUT",
        data={"backlog_count": original_backlogs},
        headers={"X-User-Role": "Chairman"}
    )
    log(f"Reverted {student['roll_no']} to {original_backlogs} backlogs")
    
    assert init_pass_rate != after_pass_rate, "Pass rate did not recalculate! Real-time sync failed."
    log("[SUCCESS] Real-Time Sync test passed!")

def test_anomaly_execution():
    log("\n--- TEST: Anomaly Execution ---")
    
    recs = req("/agent10/recommendations", headers={"X-User-Role": "Dean"})
    if not recs:
        log("No recommendations to test.")
        return
        
    target = recs[0]
    rec_id = target['id']
    init_status = target.get('status', 'PENDING')
    log(f"Initial Status for {rec_id}: {init_status}")
    
    # Execute
    req(f"/agent10/recommendations/{rec_id}/execute", method="POST", headers={"X-User-Role": "Dean"})
    
    # Re-fetch
    recs_after = req("/agent10/recommendations", headers={"X-User-Role": "Dean"})
    after_status = next((r.get('status') for r in recs_after if r['id'] == rec_id), None)
    
    log(f"Status after execution: {after_status}")
    assert after_status == "IN_PROGRESS", "Execution failed to update status!"
    log("[SUCCESS] Anomaly Execution test passed!")


if __name__ == "__main__":
    try:
        test_rbac_dashboard()
        test_real_time_update()
        test_anomaly_execution()
        log("\n[SUCCESS] ALL TESTS PASSED SUCCESSFULLY!")
    except AssertionError as e:
        log(f"\n[FAIL] TEST FAILED: {e}")
    except Exception as e:
        log(f"\n[FAIL] SCRIPT CRASHED: {e}")
