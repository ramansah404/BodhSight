"""Full HTTP endpoint smoke test suite."""
import json
import urllib.request

BASE = "http://localhost:8001/api/v1/agent10"
PASS = 0
FAIL = 0

def test(name, url, checks=None):
    global PASS, FAIL
    try:
        with urllib.request.urlopen(url, timeout=30) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            ok = True
            if checks:
                for check_fn, desc in checks:
                    if not check_fn(data):
                        print(f"  FAIL check [{desc}] in {name}")
                        ok = False
            if ok:
                PASS += 1
                print(f"  PASS {name}")
                return data
            else:
                FAIL += 1
    except Exception as e:
        print(f"  FAIL {name}: {e}")
        FAIL += 1
    return None

print("=" * 60)
print("AGENT 10 HTTP ENDPOINT SMOKE TESTS")
print("=" * 60)

# /health
test("/health", "http://localhost:8001/health",
    [(lambda d: d.get("status") == "ok", "status=ok")])

# /dashboard
dash = test("/dashboard", f"{BASE}/dashboard", [
    (lambda d: "pass_rate" in d, "has pass_rate"),
    (lambda d: d.get("total_students", 0) > 0, "total_students > 0"),
    (lambda d: d.get("courses_analyzed", 0) > 0, "courses_analyzed > 0"),
])
if dash:
    print(f"    pass_rate={dash['pass_rate']}% | students={dash['total_students']} | courses={dash['courses_analyzed']} | anomalies={dash['active_anomalies']}")

# /exceptions
exc = test("/exceptions", f"{BASE}/exceptions", [
    (lambda d: isinstance(d, list), "returns list"),
    (lambda d: len(d) > 0, "non-empty"),
    (lambda d: all("severity" in e for e in d), "all have severity"),
])
if exc:
    print(f"    {len(exc)} exceptions | top: [{exc[0]['severity']}] {exc[0]['title'][:60]}")

# /priorities
prio = test("/priorities", f"{BASE}/priorities", [
    (lambda d: isinstance(d, list), "returns list"),
    (lambda d: len(d) > 0, "non-empty"),
    (lambda d: d[0]["rank"] == 1, "first rank=1"),
])
if prio:
    print(f"    {len(prio)} priorities | #1: [{prio[0]['priority']}] {prio[0]['course_code']} score={prio[0]['severity_score']}")

# /performance/courses
perf = test("/performance/courses", f"{BASE}/performance/courses", [
    (lambda d: isinstance(d, list), "returns list"),
    (lambda d: len(d) > 0, "non-empty"),
])
if perf:
    print(f"    {len(perf)} courses | worst: {perf[0].get('course_code')} {perf[0].get('pass_rate')}%")

# /sections
secs = test("/sections", f"{BASE}/sections", [
    (lambda d: isinstance(d, list), "returns list"),
    (lambda d: len(d) > 0, "non-empty"),
])
if secs:
    flagged = [s for s in secs if s.get("disparity_flag")]
    print(f"    {len(secs)} sections | {len(flagged)} with disparity flag")

# /trends
test("/trends", f"{BASE}/trends", [
    (lambda d: "historical_data_available" in d, "has historical_data_available"),
])

# /recommendations
recs = test("/recommendations", f"{BASE}/recommendations", [
    (lambda d: isinstance(d, list), "returns list"),
])
if recs:
    print(f"    {len(recs)} recommendations")

# /summary
summ = test("/summary", f"{BASE}/summary", [
    (lambda d: "summary" in d, "has summary"),
    (lambda d: "anomaly_breakdown" in d, "has anomaly_breakdown"),
])
if summ:
    breakdown = summ.get("anomaly_breakdown", {})
    print(f"    summary={summ['summary'][:80]}")
    print(f"    anomalies: critical={breakdown.get('critical',0)} high={breakdown.get('high',0)} medium={breakdown.get('medium',0)}")

# /llm-status
test("/llm-status", f"{BASE}/llm-status", [
    (lambda d: "llm_available" in d, "has llm_available"),
])

print()
print("=" * 60)
print(f"RESULTS: {PASS} PASS, {FAIL} FAIL")
print("=" * 60)
