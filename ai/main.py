"""
YojnaSetu FastAPI Backend Service
---------------------------------
Exposes existing scheme matching, financial calculator, and partner locator modules
via REST API endpoints while strictly preserving underlying business logic.
"""

from contextlib import asynccontextmanager
import os
import uuid
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
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


# In-memory store for active SchemeAgent chatbot sessions
agent_sessions: Dict[str, SchemeAgent] = {}


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
    summary="AI Scheme Advisor Chatbot",
    description="Exposes LangChain + Gemini SchemeAgent to answer follow-up questions about recommended schemes.",
    tags=["Scheme Matcher"],
)
def chat_schemes_endpoint(request: SchemeChatRequest):
    """
    Exposes existing scheme_matcher.SchemeAgent chatbot functionality.
    Grounded strictly in schemes.json and applicant profile.
    """
    session_id = request.session_id or str(uuid.uuid4())
    schemes = fetch_schemes()

    if session_id not in agent_sessions:
        top_schemes = []
        if request.scheme_ids:
            target_ids = [sid.upper() for sid in request.scheme_ids]
            raw_matches = [s for s in schemes if s.get("scheme_id", "").upper() in target_ids]
            if raw_matches and request.user_data:
                recs, _ = match_schemes(request.user_data, raw_matches)
                top_schemes = recs
            elif raw_matches:
                for idx, s in enumerate(raw_matches, 1):
                    details = get_scheme_details(s)
                    top_schemes.append({
                        "rank": idx,
                        "scheme_id": s.get("scheme_id", ""),
                        "scheme_name": s.get("name", ""),
                        "match_score": 90 - (idx * 5),
                        "eligibility_status": "eligible",
                        "matched_rules": [f"Matches scheme {s.get('name')}"],
                        "warnings": [],
                        "financial_details": {
                            "max_loan": f"Rs. {details['max_amount']:,}" if details["max_amount"] else None,
                            "percentage_financed": f"{s.get('loan', {}).get('percentage_of_project_cost', 90)}%",
                            "interest_rate": details["interest_rate_str"],
                            "max_tenure": f"{details['max_tenure']} months" if details["max_tenure"] else None,
                            "moratorium": f"{details['max_moratorium']} months" if details["max_moratorium"] else None,
                        },
                        "documents": s.get("documents", []),
                    })

        if not top_schemes and request.user_data:
            recs, _ = match_schemes(request.user_data, schemes)
            top_schemes = recs

        user_info = request.user_data or {}
        agent_sessions[session_id] = SchemeAgent(
            user_data=user_info,
            top_3_schemes=top_schemes,
            session_id=session_id,
        )

    agent = agent_sessions[session_id]
    response_text = agent.ask(request.message)

    return {
        "session_id": session_id,
        "response": response_text,
    }


@app.get(
    "/schemes",
    summary="List and Filter All Schemes",
    description="Returns available government schemes with optional search and filtering (category, purpose, state, gender) for the calculator.",
    tags=["Financial Calculator"],
)
def list_schemes_endpoint(
    search: Optional[str] = None,
    category: Optional[str] = None,
    purpose: Optional[str] = None,
    state: Optional[str] = None,
    gender: Optional[str] = None,
):
    """
    Returns scheme items from schemes.json for complete catalog browsing & filtering.
    """
    schemes = fetch_schemes()
    filtered = schemes

    if search:
        q = search.lower().strip()
        filtered = [
            s for s in filtered
            if q in s.get("name", "").lower()
            or q in s.get("description", "").lower()
            or q in s.get("scheme_id", "").lower()
        ]

    if category and category.lower() != "all":
        cat_q = category.lower().strip()
        filtered = [
            s for s in filtered
            if not s.get("eligibility", {}).get("categories")
            or any(c.lower() == cat_q for c in s.get("eligibility", {}).get("categories", []))
        ]

    if purpose and purpose.lower() != "all":
        p_q = purpose.lower().strip()
        filtered = [
            s for s in filtered
            if any(p.lower() == p_q for p in s.get("purpose", []))
        ]

    if state and state.lower() != "all":
        st_q = state.lower().strip()
        filtered = [
            s for s in filtered
            if s.get("geographical_scope", {}).get("type") == "central"
            or "all_india" in [st.lower() for st in s.get("geographical_scope", {}).get("states", [])]
            or not s.get("geographical_scope", {}).get("states")
            or any(st.lower() == st_q for st in s.get("geographical_scope", {}).get("states", []))
        ]

    if gender and gender.lower() != "all":
        g_q = gender.lower().strip()
        filtered = [
            s for s in filtered
            if not s.get("eligibility", {}).get("gender")
            or any(g.lower() == g_q for g in s.get("eligibility", {}).get("gender", []))
        ]

    result = []
    for s in filtered:
        details = get_scheme_details(s)
        result.append({
            "scheme_id": details["scheme_id"],
            "name": details["name"],
            "description": s.get("description", ""),
            "max_amount": details["max_amount"],
            "min_amount": details["min_amount"],
            "interest_rate": details["interest_rate"],
            "interest_rate_str": details["interest_rate_str"],
            "min_rate": details["min_rate"],
            "max_rate": details["max_rate"],
            "max_tenure": details["max_tenure"],
            "min_tenure": details["min_tenure"],
            "max_moratorium": details["max_moratorium"],
            "min_moratorium": details["min_moratorium"],
            "categories": s.get("eligibility", {}).get("categories", []),
            "gender": s.get("eligibility", {}).get("gender", []),
            "purpose": s.get("purpose", []),
            "states": s.get("geographical_scope", {}).get("states", []),
        })

    return {"schemes": result, "total": len(result)}


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


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)

