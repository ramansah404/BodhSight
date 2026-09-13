import os
import json
from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel
from typing import Optional
from groq import Groq
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

def get_groq_client():
    api_key = settings.GROQ_API_KEY or os.environ.get("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_API_KEY is missing from environment variables (.env)")
    return Groq(api_key=api_key)

@router.post("", response_model=ChatResponse)
async def chat_with_agent10(
    req: ChatRequest,
    x_user_role: str = Header("Dean"),
    x_user_department: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    try:
        client = get_groq_client()
        
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

        # RAG / Data Injection: Fetch Real-Time Data from DB based on filters
        try:
            perf_summary = queries.get_course_performance_summary(
                db, 
                department=req.department, 
                semester=req.semester, 
                programme=req.programme, 
                academic_year=None
            )
            student_summary = queries.get_student_profile_summary(
                db, 
                department=req.department, 
                semester=req.semester, 
                programme=req.programme, 
                academic_year=None
            )
            
            # Combine and serialize the DB data into a string so Groq can read it
            db_summary = {
                "course_performance": perf_summary,
                "student_profiles": student_summary
            }
            db_context = json.dumps(db_summary, indent=2)
            rbac_context += f"\\n\\nHere is the LIVE real-time database context for the user's current filtered view:\\n```json\\n{db_context}\\n```\\nUse this exact data to answer their questions accurately."
        except Exception as db_err:
            logging.error(f"Failed to fetch DB context for Chat: {db_err}")
            rbac_context += "\\n\\n(Note: Live database context is temporarily unavailable. Answer based on general knowledge)."
        
        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",
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
        logging.error(f"Chat API error: {e}")
        # Return a graceful fallback if API key is invalid or request fails
        return ChatResponse(reply=f"Agent 10 is currently offline. (Error: {str(e)})")
