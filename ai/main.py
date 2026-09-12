"""
YojnaSetu FastAPI Backend Service
---------------------------------
Exposes existing scheme matching, financial calculator, and partner locator modules
via REST API endpoints while strictly preserving underlying business logic.
"""

from contextlib import asynccontextmanager
import json
import os
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, HTTPException
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
    scheme_id: str = Field(
        ..., json_schema_extra={"example": "MFS"}, description="Selected government scheme ID"
    )
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
    Exposes existing partner_locator.get_top_partners function.
    """
    partners = load_partners()

    top_partners = get_top_partners(
        request.scheme_id,
        request.latitude,
        request.longitude,
        partners,
    )

    if not top_partners:
        return {
            "partners": [],
            "message": "No eligible channel partner found.",
        }

    # Clean internal score fields (_routing_score, _distance_km) from public response
    clean_partners = [
        {k: v for k, v in partner.items() if not k.startswith("_")}
        for partner in top_partners
    ]

    return {
        "partners": clean_partners,
    }


@app.get("/", tags=["Health Check"])
def root():
    return {
        "service": "YojnaSetu API",
        "status": "online",
        "docs": "/docs",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)

