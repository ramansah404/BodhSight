import requests, json, sys

BASE = 'https://bodhsight.onrender.com'

def test(label, r):
    try:
        body = r.json()
    except Exception:
        body = r.text[:300]
    print(f'{label}: {r.status_code}')
    if isinstance(body, dict) or isinstance(body, list):
        print(json.dumps(body, indent=2)[:800])
    else:
        print(str(body)[:300])
    print('---')
    return r

# 1. Health
test('GET /health', requests.get(f'{BASE}/health', timeout=30))
test('GET /api/v1/health', requests.get(f'{BASE}/api/v1/health', timeout=30))

# 2. Mark anomalies
test('GET /api/v1/agent10/mark-anomalies', requests.get(f'{BASE}/api/v1/agent10/mark-anomalies', timeout=30))

# 3. AutoTutor - real student
test('POST /api/v1/agent10/autotutor', requests.post(
    f'{BASE}/api/v1/agent10/autotutor',
    json={'student_id': '24CSE005'},
    timeout=60
))

# 4. AutoTutor - missing student_id (RBAC/validation check)
test('POST /api/v1/agent10/autotutor (no student_id)', requests.post(
    f'{BASE}/api/v1/agent10/autotutor',
    json={},
    timeout=30
))

# 5. LLM status
test('GET /api/v1/agent10/llm-status', requests.get(f'{BASE}/api/v1/agent10/llm-status', timeout=30))
