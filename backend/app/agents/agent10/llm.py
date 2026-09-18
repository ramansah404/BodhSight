"""
Agent 10 — LLM Explanation Layer.

Architecture:
  Deterministic analytics → Structured Evidence JSON → LLM → Human-readable Insight

Rules:
- LLM ONLY humanizes structured evidence; never computes or invents statistics.
- Backend analytics remain the single source of truth.
- If LLM API key is absent, graceful degradation returns structured text.
- Provider isolation: OpenAI and Gemini are fully contained here.
- Never expose API keys to frontend.

Environment variables:
  LLM_API_KEY     — OpenAI API key (preferred)
  OPENAI_API_KEY  — alternative OpenAI key name
  GEMINI_API_KEY  — Google Gemini API key (fallback provider)
  LLM_MODEL       — model name override (default: gpt-4o-mini / gemini-1.5-flash)
"""
from __future__ import annotations

import json
import logging
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

_LLM_AVAILABLE: Optional[bool] = None
_LLM_PROVIDER: Optional[str] = None   # "openai" | "gemini" | None


def _detect_provider() -> Optional[str]:
    """Detect which LLM provider to use based on available env vars/packages."""
    global _LLM_PROVIDER
    if _LLM_PROVIDER is not None:
        return _LLM_PROVIDER

    from app.core.config import settings

    # Try OpenAI
    openai_key = (
        getattr(settings, "LLM_API_KEY", None)
        or getattr(settings, "OPENAI_API_KEY", None)
    )
    if openai_key and openai_key not in ("your_api_key_here", ""):
        try:
            import openai  # noqa
            _LLM_PROVIDER = "openai"
            return _LLM_PROVIDER
        except ImportError:
            pass

    # Try Gemini
    gemini_key = getattr(settings, "GEMINI_API_KEY", None)
    if gemini_key and gemini_key not in ("your_api_key_here", ""):
        try:
            from openai import OpenAI  # noqa
            _LLM_PROVIDER = "gemini"
            return _LLM_PROVIDER
        except ImportError:
            pass

    _LLM_PROVIDER = None
    return None


def _check_llm_available() -> bool:
    global _LLM_AVAILABLE
    if _LLM_AVAILABLE is not None:
        return _LLM_AVAILABLE
    _LLM_AVAILABLE = _detect_provider() is not None
    return _LLM_AVAILABLE


def _call_openai(system_prompt: str, user_content: str) -> Optional[str]:
    """Call OpenAI and return text response, or None on error."""
    try:
        from app.core.config import settings
        import openai
        key = getattr(settings, "LLM_API_KEY", None) or getattr(settings, "OPENAI_API_KEY", None)
        client = openai.OpenAI(api_key=key)
        model = getattr(settings, "LLM_MODEL", None) or "gpt-4o-mini"
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content},
            ],
            max_tokens=512,
            temperature=0.3,
        )
        return response.choices[0].message.content
    except Exception as e:
        logger.warning("OpenAI call failed: %s", e)
        return None


def _call_gemini(system_prompt: str, user_content: str) -> Optional[str]:
    """Call Google Gemini and return text response, or None on error."""
    try:
        from app.core.config import settings
        from openai import OpenAI
        key = getattr(settings, "GEMINI_API_KEY", None)
        client = OpenAI(
            api_key=key,
            base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
            timeout=30.0,
            max_retries=0,
        )
        model_name = getattr(settings, "LLM_MODEL", None) or "gemini-3.6-flash"
        response = client.chat.completions.create(
            model=model_name,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content},
            ],
            max_tokens=512,
            temperature=0.3,
        )
        return response.choices[0].message.content
    except Exception as e:
        logger.warning("Gemini call failed: %s", e)
        return None


def _call_llm(system_prompt: str, user_content: str) -> Optional[str]:
    """Dispatch to the appropriate LLM provider."""
    provider = _detect_provider()
    if provider == "openai":
        return _call_openai(system_prompt, user_content)
    elif provider == "gemini":
        return _call_gemini(system_prompt, user_content)
    return None


# ---------------------------------------------------------------------------
# Prompt templates
# ---------------------------------------------------------------------------

SYSTEM_PROMPT_ANALYST = """\
You are an academic analytics assistant for a university. You receive structured JSON data
that has been computed by a deterministic analytics system from real university databases.

Your task is to write a clear, concise, human-readable explanation for a university dean,
HOD, or academic administrator.

RULES:
1. NEVER invent, fabricate, or extrapolate any statistics, student names, or courses.
2. Base every statement ONLY on the JSON data provided.
3. If a value is missing or null, do not guess; acknowledge the limitation.
4. Be specific: use the actual numbers from the data (pass rates, counts, deviations).
5. Keep explanations brief (2–4 sentences per anomaly maximum).
6. Use plain English — avoid jargon. A department head should understand immediately.
7. Never suggest causes that are not supported by the data.
"""

SYSTEM_PROMPT_EXECUTIVE = """\
You are an executive assistant for a university's academic analytics platform.
You receive structured JSON data containing performance metrics and anomalies.

Write a concise executive summary (3–4 sentences) for the university's senior leadership.
The tone should be professional and action-oriented.

RULES:
1. Use ONLY the provided data — never add context or examples not in the data.
2. Mention the most critical anomaly by name (course code / issue type).
3. End with a single clear recommendation.
4. Do NOT mention that you are an AI or that you're summarising provided data.
"""


def humanize_anomaly(anomaly: Dict[str, Any]) -> str:
    """
    Given a structured anomaly dict, return a human-readable explanation.
    Falls back to structured text if LLM is unavailable.
    """
    # Always compute the structured fallback first
    atype = anomaly.get("anomaly_type", "UNKNOWN").replace("_", " ").title()
    code = anomaly.get("course_code") or "Unknown course"
    severity = anomaly.get("severity", "MEDIUM")
    current = anomaly.get("current_value")
    baseline = anomaly.get("baseline_value")
    students = anomaly.get("affected_students", 0)
    action = anomaly.get("recommended_action", "")
    deviation_summary = anomaly.get("deviation_summary", "")

    if deviation_summary:
        fallback = deviation_summary
    else:
        fallback = f"{severity} – {atype} detected in {code}."
        if current is not None and baseline is not None:
            fallback += f" Current value: {current:.2f}, baseline: {baseline:.2f}."
        if students:
            fallback += f" {students} student(s) affected."
    if action:
        fallback += f" Recommended: {action}"

    if not _check_llm_available():
        return fallback

    # Trim the payload to avoid huge context
    slim = {k: v for k, v in anomaly.items() if k not in (
        "evidence_sources", "detected_date", "is_overdue", "age_hours"
    )}
    payload = json.dumps(slim, default=str)[:2000]

    result = _call_llm(
        SYSTEM_PROMPT_ANALYST,
        f"Explain this academic anomaly in 2–3 sentences for a HOD or dean:\n{payload}"
    )
    return result if result else fallback


def generate_executive_summary(dashboard: Dict[str, Any], anomalies: List[Dict[str, Any]]) -> str:
    """
    Generate a short executive summary from dashboard + anomalies.
    Fallback produces structured text without LLM.
    """
    n_anom = len(anomalies)
    pass_rate = dashboard.get("pass_rate", 0)
    students_eval = dashboard.get("students_evaluated", 0)
    avg_marks = dashboard.get("average_marks", 0)
    total_students = dashboard.get("total_students", 0)
    as_of = dashboard.get("as_of_date", "today")

    critical_count = sum(1 for a in anomalies if a.get("severity") == "CRITICAL")
    high_count = sum(1 for a in anomalies if a.get("severity") == "HIGH")

    top = anomalies[0] if anomalies else {}
    top_desc = top.get("title", "") or top.get("deviation_summary", "")

    fallback_parts = [
        f"As of {as_of}, {students_eval} student enrollments evaluated across "
        f"{dashboard.get('courses_analyzed', 0)} course sections.",
        f"Institutional pass rate: {pass_rate}%. Average marks: {avg_marks}.",
    ]
    if n_anom > 0:
        fallback_parts.append(
            f"{n_anom} performance anomalies detected "
            f"({critical_count} CRITICAL, {high_count} HIGH)."
        )
        if top_desc:
            fallback_parts.append(f"Most critical: {top_desc[:120]}.")
    else:
        fallback_parts.append("No significant performance anomalies detected this term.")

    fallback = " ".join(fallback_parts)

    if not _check_llm_available():
        return fallback

    top_anomalies = anomalies[:3]
    payload = json.dumps({
        "dashboard_kpis": {
            "as_of_date": as_of,
            "total_students": total_students,
            "students_evaluated": students_eval,
            "pass_rate_pct": pass_rate,
            "average_marks": avg_marks,
            "courses_analyzed": dashboard.get("courses_analyzed", 0),
            "active_anomalies": n_anom,
            "critical_anomalies": critical_count,
            "high_anomalies": high_count,
        },
        "top_anomalies": [
            {
                "type": a.get("anomaly_type"),
                "severity": a.get("severity"),
                "title": a.get("title"),
                "course": a.get("course_code"),
                "affected_students": a.get("affected_students"),
                "action": a.get("recommended_action", "")[:100],
            }
            for a in top_anomalies
        ],
    }, default=str)

    result = _call_llm(
        SYSTEM_PROMPT_EXECUTIVE,
        f"Write a 3-sentence executive summary for university senior leadership:\n{payload}"
    )
    return result if result else fallback


def chat_with_agent(message: str, context: Optional[Dict[str, Any]] = None) -> str:
    """
    Handle a user chat message.
    """
    if not _check_llm_available():
        return "I am Agent 10, BodhSight's academic analytics assistant. Currently, my LLM capabilities are offline (no API key configured). Please refer to the dashboards for structured data insights."
        
    system_prompt = (
        "You are Agent 10, an intelligent academic analytics assistant for BodhSight. "
        "You help university administration understand student performance, anomalies, and condonation risks. "
        "Keep your answers concise, professional, and helpful. Format with markdown where appropriate."
    )
    if context:
        system_prompt += f"\n\nCurrent Dashboard Context: {json.dumps(context, default=str)}"
        
    result = _call_llm(system_prompt, message)
    return result if result else "I encountered an error processing your request."


def llm_status() -> Dict[str, Any]:
    """Return LLM availability status. Safe to expose via API."""
    available = _check_llm_available()
    provider = _detect_provider() if available else None
    return {
        "llm_available": available,
        "fallback_mode": not available,
        "provider": provider,
        "note": (
            f"LLM explanation layer active via {provider}." if available
            else "LLM API key not configured. Structured JSON responses are used instead."
        ),
    }

