import json
from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel
from typing import Optional
import logging

from app.core.config import settings
from app.db.session import get_db
from app.db import queries
from sqlalchemy.orm import Session

router = APIRouter(prefix="/agent10/chat", tags=["Agent 10 Chat"])

class ChatRequest(BaseModel):
    message: str
    department: Optional[str] = None
    semester: Optional[str] = None
    programme: Optional[str] = None

class ChatResponse(BaseModel):
    reply: str

def get_gemini_client():
    # Settings loads the repository root/backend .env files through pydantic-settings.
    # Keep the key server-side; the frontend only calls this endpoint.
    api_key = settings.GEMINI_API_KEY
    if not api_key:
        raise ValueError("GEMINI_API_KEY is not configured. Add it to the backend/root .env file and restart FastAPI.")

    from openai import OpenAI
    return OpenAI(
        api_key=api_key,
        base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
        timeout=30.0,
        max_retries=0,
    )

@router.post("", response_model=ChatResponse)
async def chat_with_agent10(
    req: ChatRequest,
    x_user_role: str = Header("Dean"),
    x_user_department: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    try:
        client = get_gemini_client()
        
        # Build RBAC Context
        rbac_context = f"You are Agent 10, an AI assistant for BodhSight University Analytics."
        rbac_context += f"\\nThe user you are talking to has the role: {x_user_role}."
        
        if x_user_department:
            rbac_context += f"\\nThe user is restricted to the {x_user_department} department. DO NOT provide data outside of this department."
        elif x_user_role in ["Faculty", "HOD"]:
            rbac_context += f"\\nWARNING: The user is a {x_user_role} but no department was provided. You must ask them to specify their department before answering data questions."
        else:
            rbac_context += f"\\nThe user has university-wide access."
            
        rbac_context += "\\nYour responses should be concise, professional, and directly address their questions. Format your response with basic markdown."
        rbac_context += "\\nCRITICAL RULE: DO NOT generate or output SQL queries under ANY circumstances. The user cannot run them. If you cannot answer a question based on the provided JSON data (e.g., if they ask for a list of student names or details), politely instruct them to use the drill-down features in their dashboard to view those specific details, rather than providing SQL."
        # Enforce RBAC on the requested department for the DB query
        from app.api.routers.agent10 import get_rbac_department
        safe_department = get_rbac_department(req.department, x_user_role, x_user_department)

        # RAG / Data Injection: Fetch Real-Time Data from DB based on filters
        try:
            perf_summary = queries.get_course_performance_summary(
                db, 
                department=safe_department, 
                semester=req.semester, 
                programme=req.programme, 
                academic_year=None
            )
            student_summary = queries.get_student_profile_summary(
                db, 
                department=safe_department, 
                semester=req.semester, 
                programme=req.programme, 
                academic_year=None
            )
            
            # Combine and serialize the DB data into a string so Gemini can read it
            db_summary = {
                "course_performance": perf_summary,
                "student_profiles": student_summary
            }
            db_context = json.dumps(db_summary, indent=2, default=str)
            rbac_context += f"\\n\\nHere is the LIVE real-time database context for the user's current filtered view:\\n```json\\n{db_context}\\n```\\nUse this exact data to answer their questions accurately."
        except Exception as db_err:
            logging.error(f"Failed to fetch DB context for Chat: {db_err}")
            rbac_context += "\\n\\n(Note: Live database context is temporarily unavailable. Do not provide academic statistics; explain that the data is unavailable.)"
        
        completion = client.chat.completions.create(
            model="gemini-3.6-flash",
            messages=[
                {"role": "system", "content": rbac_context},
                {"role": "user", "content": req.message}
            ],
            temperature=0.7,
            max_tokens=1024,
        )
        
        reply = completion.choices[0].message.content
        return ChatResponse(reply=reply)
        
    except Exception as e:
        cause = e.__cause__
        logging.error(
            "Chat API error type=%s message=%s cause_type=%s cause_message=%s "
            "status_code=%s request_id=%s",
            type(e).__name__,
            str(e),
            type(cause).__name__ if cause else None,
            str(cause) if cause else None,
            getattr(e, "status_code", None),
            getattr(e, "request_id", None),
        )
        # Return a graceful fallback if API key is invalid or request fails
        return ChatResponse(reply=f"Agent 10 is currently offline. (Error: {str(e)})")
