"""
YojnaSetu FastAPI Backend Service
---------------------------------
Exposes existing scheme matching, financial calculator, and partner locator modules
via REST API endpoints while strictly preserving underlying business logic.
"""

from contextlib import asynccontextmanager
import json
import os
import uuid
from typing import Any, Dict, List, Optional

import base64
import requests
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

# Import existing Python core functionality without rewriting business logic
from scheme_matcher import match_schemes, SchemeAgent
from financial_calculator import (
    load_schemes,
    get_scheme_details,
    validate_inputs,
    generate_amortization_schedule,
    calculate_financial_summary,
)
from partner_locator import load_partners, get_top_partners

# Global in-memory cache for schemes dataset
schemes_dataset: List[Dict[str, Any]] = []


def fetch_schemes() -> List[Dict[str, Any]]:
    """Loads and caches schemes.json dataset."""
    global schemes_dataset
    if not schemes_dataset:
        schemes_path = os.path.join(
            os.path.dirname(os.path.abspath(__file__)), "schemes.json"
        )
        schemes_dataset = load_schemes(schemes_path)
    return schemes_dataset


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Pre-load schemes dataset on application startup."""
    fetch_schemes()
    yield


app = FastAPI(
    title="YojnaSetu Backend API",
    description=(
        "API service exposing government scheme eligibility matching, financial EMI "
        "calculation, and geo-spatial channel partner locator services."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# CORS Middleware for frontend integration (e.g., Vite/React on port 5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "*",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =============================================================================
# PYDANTIC REQUEST & RESPONSE MODELS
# =============================================================================

class SchemeMatchRequest(BaseModel):
    category: Optional[str] = Field(
        None, json_schema_extra={"example": "SC"}, description="Applicant category (e.g., SC, ST, OBC, General)"
    )
    gender: Optional[str] = Field(
        None, json_schema_extra={"example": "male"}, description="Applicant gender (male, female, other)"
    )
    age: Optional[int] = Field(
        None, ge=0, le=120, json_schema_extra={"example": 25}, description="Applicant age in years"
    )
    annual_income: Optional[float] = Field(
        None, ge=0, json_schema_extra={"example": 300000.0}, description="Annual income in INR"
    )
    state: Optional[str] = Field(
        None, json_schema_extra={"example": "Delhi"}, description="State of residence"
    )
    district: Optional[str] = Field(
        None, json_schema_extra={"example": "New Delhi"}, description="District of residence"
    )
    occupation: Optional[str] = Field(
        None, json_schema_extra={"example": "self_employed"}, description="Applicant occupation"
    )
    education: Optional[str] = Field(
        None, json_schema_extra={"example": "graduate"}, description="Educational qualification"
    )
    purpose: Optional[str] = Field(
        None, json_schema_extra={"example": "business"}, description="Loan or scheme purpose"
    )
    project_type: Optional[str] = Field(
        None, json_schema_extra={"example": "micro_business"}, description="Project type"
    )
    project_cost: Optional[float] = Field(
        None, ge=0, json_schema_extra={"example": 100000.0}, description="Total project cost in INR"
    )
    loan_required: Optional[float] = Field(
        None, ge=0, json_schema_extra={"example": 90000.0}, description="Requested loan amount in INR"
    )


class SchemeChatRequest(BaseModel):
    session_id: Optional[str] = Field(None, description="Optional session ID for chat continuity")
    message: str = Field(..., description="User question for the scheme advisor AI")
    user_data: Optional[Dict[str, Any]] = Field(None, description="Applicant profile dictionary")
    scheme_ids: Optional[List[str]] = Field(None, description="List of recommended scheme IDs")


class EmiCalculatorRequest(BaseModel):
    scheme_id: str = Field(
        ..., json_schema_extra={"example": "MFS"}, description="Selected government scheme ID"
    )
    loan_amount: float = Field(
        ..., gt=0, json_schema_extra={"example": 90000.0}, description="Requested loan amount in INR"
    )
    interest_rate: Optional[float] = Field(
        None,
        ge=0,
        le=100,
        json_schema_extra={"example": 6.5},
        description="Optional interest rate override in %",
    )
    tenure_months: int = Field(
        ..., gt=0, json_schema_extra={"example": 60}, description="Repayment tenure in months"
    )
    moratorium_months: int = Field(
        0, ge=0, json_schema_extra={"example": 3}, description="Moratorium period in months"
    )


class PartnerLocateRequest(BaseModel):
    scheme_id: Optional[str] = Field(None, json_schema_extra={"example": "MFS"}, description="Single scheme ID")
    scheme_ids: Optional[List[str]] = Field(None, description="List of target recommended scheme IDs")
    latitude: float = Field(
        ..., ge=-90.0, le=90.0, json_schema_extra={"example": 28.6139}, description="Applicant latitude"
    )
    longitude: float = Field(
        ..., ge=-180.0, le=180.0, json_schema_extra={"example": 77.2090}, description="Applicant longitude"
    )


class SchemeChatRequest(BaseModel):
    message: str = Field(
        ..., json_schema_extra={"example": "Explain the top recommended schemes for me"}, description="User query or message"
    )
    session_id: Optional[str] = Field(
        "default_session", json_schema_extra={"example": "session-123"}, description="Conversation session ID"
    )
    user_data: Optional[Dict[str, Any]] = Field(
        None, description="Optional applicant profile dictionary"
    )
    top_3_schemes: Optional[List[Dict[str, Any]]] = Field(
        None, description="Optional pre-calculated top recommended schemes list"
    )


# =============================================================================
# API ENDPOINTS
# =============================================================================

@app.post(
    "/schemes/match",
    summary="Match Government Schemes",
    description="Evaluates applicant profile against government schemes and returns top recommended schemes.",
    tags=["Scheme Matcher"],
)
def match_schemes_endpoint(request: SchemeMatchRequest):
    """
    Exposes existing scheme_matcher.match_schemes function.
    """
    schemes = fetch_schemes()
    user_dict = request.model_dump()

    recommendations, total_eligible = match_schemes(user_dict, schemes)

    if not recommendations:
        return {
            "recommendations": [],
            "total_eligible": 0,
            "message": "No eligible government scheme recommendations found.",
        }

    return {
        "recommendations": recommendations,
        "total_eligible": total_eligible,
    }


@app.post(
    "/schemes/chat",
    summary="Chat with AI Scheme Advisor (Streaming)",
    description="Streams responses chunk-by-chunk from the AI SchemeAgent.",
    tags=["Scheme Advisor"],
)
async def chat_schemes_endpoint(request: SchemeChatRequest):
    """
    Forwards user message to SchemeAgent and streams generated chunks progressively using SSE.
    """
    user_data = request.user_data or {
        "category": "SC",
        "gender": "male",
        "age": 25,
        "annual_income": 300000.0,
        "state": "Delhi",
        "district": "New Delhi",
        "occupation": "self_employed",
        "education": "graduate",
        "purpose": "business",
        "project_type": "micro_business",
        "project_cost": 100000.0,
        "loan_required": 90000.0,
    }
    top_3_schemes = request.top_3_schemes
    if not top_3_schemes:
        schemes = fetch_schemes()
        top_3_schemes, _ = match_schemes(user_data, schemes)

    session_id = request.session_id or "default_session"
    agent = SchemeAgent(
        user_data=user_data,
        top_3_schemes=top_3_schemes,
        session_id=session_id,
    )

    async def event_generator():
        try:
            async for chunk in agent.astream(request.message):
                if chunk:
                    payload = json.dumps({"content": chunk})
                    yield f"data: {payload}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            err_payload = json.dumps({"error": str(e)})
            yield f"data: {err_payload}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@app.post(
    "/calculator/emi",
    summary="Calculate Loan EMI & Amortization",
    description="Validates financial parameters and calculates EMI, total interest, repayment, and schedule for a scheme.",
    tags=["Financial Calculator"],
)
def calculate_emi_endpoint(request: EmiCalculatorRequest):
    """
    Exposes existing financial_calculator functions.
    """
    schemes = fetch_schemes()

    # Locate scheme by scheme_id (case-insensitive)
    scheme = next(
        (
            s
            for s in schemes
            if s.get("scheme_id", "").lower() == request.scheme_id.lower()
        ),
        None,
    )

    if not scheme:
        raise HTTPException(
            status_code=404,
            detail=f"Scheme with ID '{request.scheme_id}' not found.",
        )

    # Extract scheme financial details
    details = get_scheme_details(scheme)

    # If explicit interest rate override is passed in request, apply it
    if request.interest_rate is not None:
        details["interest_rate"] = request.interest_rate
        details["interest_rate_str"] = f"{request.interest_rate}%"

    # Validate inputs against scheme limits using existing validator
    valid, err_msg = validate_inputs(
        details,
        request.loan_amount,
        request.tenure_months,
        request.moratorium_months,
    )

    if not valid:
        raise HTTPException(status_code=400, detail=err_msg)

    annual_rate = details["interest_rate"]
    schedule, emi = generate_amortization_schedule(
        request.loan_amount,
        annual_rate,
        request.tenure_months,
        request.moratorium_months,
    )

    summary = calculate_financial_summary(
        schedule,
        request.loan_amount,
        request.tenure_months,
        request.moratorium_months,
        emi,
    )

    return {
        "scheme_id": details["scheme_id"],
        "scheme_name": details["name"],
        "interest_rate_used": annual_rate,
        "summary": summary,
        "amortization_schedule": schedule,
    }


@app.post(
    "/partners/locate",
    summary="Locate Channel Partners",
    description="Filters, ranks, and returns top 3 channel partners supporting a scheme near user location.",
    tags=["Partner Locator"],
)
def locate_partners_endpoint(request: PartnerLocateRequest):
    """
    Exposes existing partner_locator.get_top_partners function for single or multi-scheme lookup.
    """
    partners = load_partners()

    target_scheme_ids = request.scheme_ids or ([request.scheme_id] if request.scheme_id else [])

    if not target_scheme_ids:
        raise HTTPException(status_code=400, detail="Must provide scheme_id or scheme_ids.")

    top_partners = get_top_partners(
        target_scheme_ids,
        request.latitude,
        request.longitude,
        partners,
    )

    if not top_partners:
        return {
            "partners": [],
            "message": "No eligible channel partner found.",
        }

    for p in top_partners:
        if "_distance_km" in p:
            p["distance_km"] = round(p["_distance_km"], 1)
        if "type" in p and "partner_type" not in p:
            p["partner_type"] = p["type"]

    return {
        "partners": top_partners,
    }


@app.get("/", tags=["Health Check"])
def root():
    return {
        "service": "YojnaSetu API",
        "status": "online",
        "docs": "/docs",
    }


# =============================================================================
# MULTILINGUAL VOICE ASSISTANT (GEMINI STT + TTS WEBSOCKET)
# =============================================================================

def get_gemini_api_key() -> str:
    """Returns Gemini API key from environment variables."""
    return os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY") or ""


def gemini_stt_sync(audio_bytes: bytes, mime_type: str) -> str:
    """
    Uses Google Gemini API for Speech-to-Text transcription.
    Preserves exact language and native script spoken by the user.
    """
    api_key = get_gemini_api_key()
    if not api_key:
        raise ValueError("GEMINI_API_KEY environment variable is not configured.")

    audio_b64 = base64.b64encode(audio_bytes).decode("utf-8")
    
    # Standardize mime_type if webm / unknown
    clean_mime = mime_type.split(";")[0].strip() if mime_type else "audio/webm"
    if clean_mime not in ["audio/webm", "audio/wav", "audio/mp3", "audio/ogg", "audio/m4a", "audio/flac"]:
        clean_mime = "audio/webm"

    stt_prompt = (
        "You are a precise, verbatim multilingual Speech-to-Text transcriber.\n"
        "Transcribe the provided audio clip into exact text in the original language and script spoken.\n\n"
        "CRITICAL RULES:\n"
        "1. If spoken in Hindi, output in Devanagari script (e.g. 'इस योजना के लिए मुझे कितना लोन मिल सकता है?').\n"
        "2. If spoken in Hinglish (Hindi words spoken in English alphabet), output in Roman script (e.g. 'Mujhe is scheme ke liye kitna loan mil sakta hai?'). Do NOT convert Hinglish to Devanagari Hindi or English.\n"
        "3. If spoken in English, output in English.\n"
        "4. If spoken in Bengali, Marathi, Telugu, Tamil, Gujarati, Kannada, Malayalam, Punjabi, Urdu, output in the exact native script of that language.\n"
        "5. Do NOT translate or convert the user's speech.\n"
        "6. Output ONLY the raw transcribed text. Do NOT add quotes, labels, or extra commentary."
    )

    models_to_try = [
        "gemini-2.5-flash",
        "gemini-3.5-transcribe",
        "gemini-3.6-flash",
        "gemini-3.5-flash",
    ]

    last_error = None
    for m in models_to_try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{m}:generateContent?key={api_key}"
        payload = {
            "contents": [
                {
                    "parts": [
                        {
                            "inline_data": {
                                "mime_type": clean_mime,
                                "data": audio_b64,
                            }
                        },
                        {"text": stt_prompt},
                    ]
                }
            ]
        }
        try:
            r = requests.post(url, json=payload, timeout=30)
            if r.status_code == 200:
                res_data = r.json()
                candidates = res_data.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    if parts:
                        text = parts[0].get("text", "").strip()
                        if text:
                            return text
            else:
                last_error = f"Model {m} returned {r.status_code}: {r.text}"
        except Exception as ex:
            last_error = str(ex)

    raise RuntimeError(f"Gemini STT failed across all candidate models. Last error: {last_error}")


def gemini_tts_sync(text: str) -> Dict[str, str]:
    """
    Uses Google Gemini API for native Text-to-Speech audio generation.
    Supports multilingual spoken audio generation matching response text.
    """
    api_key = get_gemini_api_key()
    if not api_key:
        raise ValueError("GEMINI_API_KEY environment variable is not configured.")

    tts_prompt = f"Read out the following text transcript aloud in a clear, natural human voice in its native language:\n\n{text}"

    tts_models = [
        "gemini-2.5-flash-preview-tts",
        "gemini-3.8-flash-tts",
        "gemini-3.1-flash-tts-preview",
        "gemini-3.8-flash-lite-tts",
    ]

    last_error = None
    for m in tts_models:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{m}:generateContent?key={api_key}"
        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": tts_prompt}
                    ]
                }
            ],
            "generationConfig": {
                "responseModalities": ["AUDIO"]
            }
        }
        try:
            r = requests.post(url, json=payload, timeout=30)
            if r.status_code == 200:
                res_data = r.json()
                candidates = res_data.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    for p in parts:
                        inline = p.get("inlineData") or p.get("inline_data")
                        if inline and "data" in inline:
                            return {
                                "audio": inline["data"],
                                "mime_type": inline.get("mimeType") or inline.get("mime_type") or "audio/mp3",
                            }
            else:
                last_error = f"TTS Model {m} returned {r.status_code}: {r.text}"
        except Exception as ex:
            last_error = str(ex)

    raise RuntimeError(f"Gemini TTS failed across all candidate models. Last error: {last_error}")


@app.websocket("/ws/voice")
async def websocket_voice_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time multilingual voice interactions.
    Architecture:
    Frontend -> WebSocket -> Gemini STT -> SchemeAgent (LangGraph) -> Gemini TTS -> Frontend
    """
    await websocket.accept()
    try:
        while True:
            raw_msg = await websocket.receive_text()
            try:
                payload = json.loads(raw_msg)
            except Exception:
                await websocket.send_json({"type": "error", "message": "Invalid JSON format."})
                continue

            action = payload.get("action") or payload.get("type")
            if action == "ping":
                await websocket.send_json({"type": "pong"})
                continue

            audio_b64 = payload.get("audio")
            mime_type = payload.get("mime_type", "audio/webm")
            session_id = payload.get("session_id", "default_session")
            user_data = payload.get("user_data") or {
                "category": "SC",
                "gender": "male",
                "age": 25,
                "annual_income": 300000.0,
                "state": "Delhi",
                "district": "New Delhi",
                "occupation": "self_employed",
                "education": "graduate",
                "purpose": "business",
                "project_type": "micro_business",
                "project_cost": 100000.0,
                "loan_required": 90000.0,
            }
            top_3_schemes = payload.get("top_3_schemes")
            if not top_3_schemes:
                schemes = fetch_schemes()
                top_3_schemes, _ = match_schemes(user_data, schemes)

            if not audio_b64:
                await websocket.send_json({"type": "error", "message": "No audio payload supplied."})
                continue

            # 1. Gemini Speech-to-Text
            try:
                audio_bytes = base64.b64decode(audio_b64)
                transcription = gemini_stt_sync(audio_bytes, mime_type)
            except Exception as stt_err:
                await websocket.send_json({"type": "error", "message": f"Speech-to-Text failed: {str(stt_err)}"})
                continue

            if not transcription:
                await websocket.send_json({"type": "error", "message": "Could not recognize speech from audio. Please try again."})
                continue

            # Send transcription text to client immediately
            await websocket.send_json({
                "type": "transcription",
                "text": transcription
            })

            # 2. Feed transcription into existing SchemeAgent (LangGraph) pipeline
            agent = SchemeAgent(
                user_data=user_data,
                top_3_schemes=top_3_schemes,
                session_id=session_id,
            )

            full_response = ""
            try:
                async for chunk in agent.astream(transcription):
                    if chunk:
                        full_response += chunk
                        await websocket.send_json({
                            "type": "text_chunk",
                            "content": chunk
                        })
            except Exception as agent_err:
                await websocket.send_json({"type": "error", "message": f"AI Advisor error: {str(agent_err)}"})
                continue

            await websocket.send_json({
                "type": "text_done",
                "full_text": full_response
            })

            # 3. Gemini Text-to-Speech
            if full_response.strip():
                try:
                    tts_res = gemini_tts_sync(full_response)
                    await websocket.send_json({
                        "type": "audio_response",
                        "audio": tts_res["audio"],
                        "mime_type": tts_res["mime_type"]
                    })
                except Exception as tts_err:
                    # Voice failure must never break text-based AI advisor
                    await websocket.send_json({
                        "type": "tts_error",
                        "message": f"Text-to-Speech playback unavailable: {str(tts_err)}"
                    })

            await websocket.send_json({"type": "done"})

    except WebSocketDisconnect:
        pass
    except Exception as exc:
        try:
            await websocket.send_json({"type": "error", "message": str(exc)})
        except Exception:
            pass


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)

