import json
import os
import sys
import uuid

from dotenv import load_dotenv
from langchain_core.chat_history import InMemoryChatMessageHistory as ChatMessageHistory
from langchain_core.messages import SystemMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain_google_genai import ChatGoogleGenerativeAI

load_dotenv()

if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass


def check_eligibility(user, scheme):
    """
    Evaluates a user against a government scheme using strict deterministic eligibility rules.
    Returns a dictionary containing:
      - status: 'eligible', 'not_eligible', or 'verification_required'
      - matched_rules: list of satisfied rule explanations
      - failed_rules: list of violated rule explanations
      - warnings: list of missing optional data or document requirement notes
    """
    matched_rules = []
    failed_rules = []
    warnings = []
    status = "eligible"

    elig = scheme.get("eligibility", {})
    s_name = scheme.get("name", "")
    s_text = f"{s_name} {scheme.get('description', '')} {scheme.get('raw_text', '')}".lower()
    is_nsfdc = "nsfdc" in s_text or "national scheduled castes" in s_text

    # ---------------------------------------------------------
    # 1. CATEGORY RULE
    # ---------------------------------------------------------
    cat_restrictions = elig.get("categories", [])
    user_cat = user.get("category")

    if cat_restrictions:
        if not user_cat:
            status = "verification_required"
            warnings.append(f"Category verification required. Scheme targets: {', '.join(cat_restrictions)}")
        elif any(c.lower() == user_cat.lower() for c in cat_restrictions):
            matched_rules.append(
                f"Category: User category '{user_cat}' matches target category ({', '.join(cat_restrictions)})")
        else:
            failed_rules.append(f"Category mismatch: Applicant is '{user_cat}', scheme requires {cat_restrictions}")
            status = "not_eligible"
    elif is_nsfdc:
        if not user_cat:
            status = "verification_required"
            warnings.append("NSFDC schemes strictly require Scheduled Caste (SC) category verification")
        elif user_cat.upper() == "SC":
            matched_rules.append("Category: Applicant belongs to Scheduled Caste (SC) as required by NSFDC")
        else:
            failed_rules.append(f"Category mismatch: Applicant is '{user_cat}', NSFDC schemes strictly require SC")
            status = "not_eligible"

    # ---------------------------------------------------------
    # 2. ANNUAL INCOME RULE
    # ---------------------------------------------------------
    annual_income_max = elig.get("annual_income_max")
    if is_nsfdc and (annual_income_max is None or annual_income_max > 500000):
        annual_income_max = 500000

    user_income = user.get("annual_income")

    if annual_income_max is not None:
        if user_income is None:
            if status != "not_eligible":
                status = "verification_required"
            warnings.append(f"Annual income verification required (Scheme ceiling: Rs. {annual_income_max:,})")
        elif user_income <= annual_income_max:
            matched_rules.append(f"Annual income: Rs. {user_income:,} <= Rs. {annual_income_max:,}")
        else:
            failed_rules.append(f"Annual income Rs. {user_income:,} exceeds maximum limit of Rs. {annual_income_max:,}")
            status = "not_eligible"

    # ---------------------------------------------------------
    # 3. AGE RULE
    # ---------------------------------------------------------
    age_min = elig.get("age_min")
    age_max = elig.get("age_max")
    user_age = user.get("age")

    if age_min is not None or age_max is not None:
        if user_age is None:
            if status != "not_eligible":
                status = "verification_required"
            warnings.append(f"Age verification required (Allowed range: {age_min or 0} to {age_max or 'unlimited'})")
        else:
            age_ok = True
            if age_min is not None and user_age < age_min:
                failed_rules.append(f"Age {user_age} is below minimum requirement of {age_min} years")
                age_ok = False
            if age_max is not None and user_age > age_max:
                failed_rules.append(f"Age {user_age} exceeds maximum limit of {age_max} years")
                age_ok = False

            if age_ok:
                range_str = f"between {age_min} and {age_max}" if age_min and age_max else f">= {age_min}" if age_min else f"<= {age_max}"
                matched_rules.append(f"Age: {user_age} years is within eligible range ({range_str})")
            else:
                status = "not_eligible"

    # ---------------------------------------------------------
    # 4. GENDER RULE
    # ---------------------------------------------------------
    gender_list = elig.get("gender", [])
    user_gender = user.get("gender")

    if gender_list:
        if not user_gender:
            if status != "not_eligible":
                status = "verification_required"
            warnings.append(f"Gender verification required. Scheme restricted to: {', '.join(gender_list)}")
        elif any(g.lower() == user_gender.lower() for g in gender_list):
            matched_rules.append(f"Gender: Applicant gender '{user_gender}' is eligible ({', '.join(gender_list)})")
        else:
            failed_rules.append(f"Gender mismatch: Applicant is '{user_gender}', scheme is restricted to {gender_list}")
            status = "not_eligible"

    # ---------------------------------------------------------
    # 5. OCCUPATION RULE
    # ---------------------------------------------------------
    occ_list = elig.get("occupation", [])
    user_occ = user.get("occupation")

    if occ_list and user_occ:
        user_occ_clean = user_occ.lower().replace("_", " ")
        if any(o.lower() in user_occ_clean or user_occ_clean in o.lower() for o in occ_list):
            matched_rules.append(
                f"Occupation: '{user_occ}' is compatible with scheme target occupations ({', '.join(occ_list)})")

    # ---------------------------------------------------------
    # 6. EDUCATION RULE
    # ---------------------------------------------------------
    edu_list = elig.get("education", [])
    user_edu = user.get("education")

    if edu_list and user_edu:
        user_edu_clean = user_edu.lower().replace("_", " ")
        if any(e.lower() in user_edu_clean or user_edu_clean in e.lower() for e in edu_list):
            matched_rules.append(f"Education: '{user_edu}' meets education requirements ({', '.join(edu_list)})")

    # ---------------------------------------------------------
    # 7. GEOGRAPHICAL SCOPE RULE
    # ---------------------------------------------------------
    geo = scheme.get("geographical_scope", {})
    geo_type = geo.get("type")
    geo_states = geo.get("states", [])
    user_state = user.get("state")

    if geo_type == "central" or "ALL_INDIA" in geo_states or not geo_states:
        matched_rules.append("Geographical Scope: Available nationwide across India (ALL_INDIA)")
    elif user_state:
        if any(s.lower() == user_state.lower() for s in geo_states):
            matched_rules.append(f"State match: Scheme available in user's state '{user_state}'")
        else:
            failed_rules.append(
                f"Geographical scope mismatch: Scheme restricted to {geo_states}, user is in '{user_state}'")
            status = "not_eligible"
    else:
        if status != "not_eligible":
            status = "verification_required"
        warnings.append(f"State verification required (Scheme restricted to: {', '.join(geo_states)})")

    # ---------------------------------------------------------
    # 8. PURPOSE RULE
    # ---------------------------------------------------------
    scheme_purposes = [p.lower() for p in scheme.get("purpose", [])]
    user_purpose = user.get("purpose")

    purpose_groups = {
        "business": ["business", "self_employment", "micro_business", "startup", "livelihood", "employment", "other"],
        "self_employment": ["self_employment", "business", "micro_business", "startup", "livelihood", "employment"],
        "micro_business": ["micro_business", "business", "self_employment", "startup", "livelihood"],
        "education": ["education", "scholarship"],
        "agriculture": ["agriculture", "livelihood", "self_employment"],
        "housing": ["housing"],
        "skill_development": ["skill_development", "training", "education"],
        "healthcare": ["healthcare"]
    }

    if user_purpose and scheme_purposes:
        u_p = user_purpose.lower()
        allowed_purposes = purpose_groups.get(u_p, [u_p])

        if any(sp in allowed_purposes for sp in scheme_purposes) or "other" in scheme_purposes:
            matched_rules.append(
                f"Purpose match: User purpose '{user_purpose}' is compatible with scheme purpose {scheme['purpose']}")
        else:
            failed_rules.append(
                f"Purpose mismatch: Scheme serves {scheme['purpose']}, requested purpose is '{user_purpose}'")
            status = "not_eligible"

    # ---------------------------------------------------------
    # 9. LOAN AMOUNT & PROJECT COST FINANCING RULES
    # ---------------------------------------------------------
    loan_info = scheme.get("loan", {})
    user_loan_req = user.get("loan_required")
    user_proj_cost = user.get("project_cost")

    if user_loan_req is not None and user_loan_req > 0:
        if not loan_info.get("available", False):
            failed_rules.append("Scheme does not offer credit/loan facility for requested financing")
            status = "not_eligible"
        else:
            max_loan = loan_info.get("max_amount")
            min_loan = loan_info.get("min_amount")

            if max_loan is not None:
                if user_loan_req <= max_loan:
                    matched_rules.append(
                        f"Requested loan: Rs. {user_loan_req:,} <= maximum scheme limit of Rs. {max_loan:,}")
                else:
                    failed_rules.append(
                        f"Requested loan Rs. {user_loan_req:,} exceeds maximum scheme limit of Rs. {max_loan:,}")
                    status = "not_eligible"

            if min_loan is not None:
                if user_loan_req >= min_loan:
                    matched_rules.append(
                        f"Requested loan: Rs. {user_loan_req:,} >= minimum scheme limit of Rs. {min_loan:,}")
                else:
                    failed_rules.append(
                        f"Requested loan Rs. {user_loan_req:,} is below minimum scheme limit of Rs. {min_loan:,}")
                    status = "not_eligible"

            pct_cost = loan_info.get("percentage_of_project_cost")
            if pct_cost is not None and user_proj_cost is not None:
                max_supported_loan = user_proj_cost * (pct_cost / 100.0)
                if user_loan_req <= max_supported_loan:
                    matched_rules.append(
                        f"Loan request Rs. {user_loan_req:,} <= {pct_cost}% of project cost (Max supported: Rs. {int(max_supported_loan):,})")
                else:
                    failed_rules.append(
                        f"Requested loan Rs. {user_loan_req:,} exceeds max {pct_cost}% project cost financing (Max supported: Rs. {int(max_supported_loan):,})")
                    status = "not_eligible"

    # ---------------------------------------------------------
    # 10. DOCUMENT WARNINGS
    # ---------------------------------------------------------
    docs = scheme.get("documents", [])
    if docs:
        for d in docs:
            warnings.append(f"Document required: {d}")

    return {
        "status": status,
        "matched_rules": matched_rules,
        "failed_rules": failed_rules,
        "warnings": warnings
    }


def calculate_match_score(user, scheme):
    """
    Calculates a deterministic match score between 0 and 100 for an ELIGIBLE scheme.
    Breakdown:
      - Purpose match: 25 points
      - Loan amount fit: 20 points
      - Project type fit: 15 points
      - Income suitability: 10 points
      - Category match: 10 points
      - Financial terms: 10 points
      - Tenure suitability: 5 points
      - Geographical suitability: 5 points
    """
    score = 0

    # 1. Purpose Match (25 Points)
    user_purpose = user.get("purpose", "").lower()
    scheme_purposes = [p.lower() for p in scheme.get("purpose", [])]
    if user_purpose in scheme_purposes:
        score += 25
    elif any(p in ["business", "self_employment", "micro_business"] for p in scheme_purposes) and user_purpose in [
        "business", "self_employment", "micro_business"]:
        score += 20
    elif scheme_purposes:
        score += 10
    else:
        score += 5

    # 2. Loan Amount Fit (20 Points)
    loan_info = scheme.get("loan", {})
    user_loan_req = user.get("loan_required", 0)
    max_loan = loan_info.get("max_amount")

    if user_loan_req > 0 and max_loan:
        ratio = user_loan_req / float(max_loan)
        if 0.7 <= ratio <= 1.0:
            score += 20
        elif 0.4 <= ratio < 0.7:
            score += 16
        elif 0.1 <= ratio < 0.4:
            score += 12
        else:
            score += 8
    else:
        score += 10

    # 3. Project Type Fit (15 Points)
    user_proj_type = user.get("project_type", "").lower()
    s_type = scheme.get("scheme_type", "").lower()
    s_purp = [p.lower() for p in scheme.get("purpose", [])]

    if user_proj_type and (user_proj_type in s_type or user_proj_type in s_purp):
        score += 15
    elif user_proj_type in ["micro_business", "small_business"] and (
            "micro_business" in s_purp or "business" in s_purp):
        score += 12
    else:
        score += 5

    # 4. Income Suitability (10 Points)
    user_income = user.get("annual_income")
    annual_income_max = scheme.get("eligibility", {}).get("annual_income_max")
    if user_income is not None and annual_income_max:
        if user_income <= annual_income_max * 0.7:
            score += 10
        elif user_income <= annual_income_max:
            score += 8
        else:
            score += 0
    else:
        score += 5

    # 5. Category Target Match (10 Points)
    user_cat = user.get("category")
    s_cats = scheme.get("eligibility", {}).get("categories", [])
    if user_cat and any(c.lower() == user_cat.lower() for c in s_cats):
        score += 10
    elif not s_cats:
        score += 5
    else:
        score += 2

    # 6. Financial Terms (10 Points)
    interest_info = scheme.get("interest", {})
    min_rate = interest_info.get("min_rate")
    if min_rate is not None:
        if min_rate <= 5.0:
            score += 5
        elif min_rate <= 7.5:
            score += 4
        else:
            score += 2
    else:
        score += 2

    pct_cost = loan_info.get("percentage_of_project_cost")
    if pct_cost is not None and pct_cost >= 90:
        score += 3
    elif pct_cost is not None:
        score += 2
    else:
        score += 1

    moratorium = scheme.get("moratorium", {}).get("min_months")
    if moratorium and moratorium > 0:
        score += 2

    # 7. Tenure Suitability (5 Points)
    tenure_info = scheme.get("tenure", {})
    max_months = tenure_info.get("max_months")
    if max_months:
        score += 5
    else:
        score += 3

    # 8. Geographical Suitability (5 Points)
    geo_states = scheme.get("geographical_scope", {}).get("states", [])
    user_state = user.get("state")
    if "ALL_INDIA" in geo_states or scheme.get("geographical_scope", {}).get("type") == "central":
        score += 5
    elif user_state and any(s.lower() == user_state.lower() for s in geo_states):
        score += 5
    else:
        score += 3

    return min(score, 100)


def match_schemes(user, schemes):
    """
    Evaluates all schemes against user, filters eligible ones, scores them,
    and returns top recommendations sorted deterministically.
    """
    evaluated = []

    for scheme in schemes:
        result = check_eligibility(user, scheme)

        if result["status"] == "eligible":
            score = calculate_match_score(user, scheme)
            evaluated.append({
                "scheme": scheme,
                "status": result["status"],
                "score": score,
                "matched_rules": result["matched_rules"],
                "failed_rules": result["failed_rules"],
                "warnings": result["warnings"]
            })

    evaluated.sort(
        key=lambda x: (
            x["score"],
            - (x["scheme"].get("interest", {}).get("min_rate") or 999),
            x["scheme"].get("loan", {}).get("max_amount") or 0
        ),
        reverse=True
    )

    recommendations = []
    top_matches = evaluated[:3]

    for rank, item in enumerate(top_matches, start=1):
        s = item["scheme"]
        loan_info = s.get("loan", {})
        interest_info = s.get("interest", {})
        tenure_info = s.get("tenure", {})
        moratorium_info = s.get("moratorium", {})
        src_info = s.get("source", {})

        financial_details = {}
        if loan_info.get("max_amount"):
            financial_details["max_loan"] = f"Rs. {loan_info['max_amount']:,}"
        if loan_info.get("percentage_of_project_cost"):
            financial_details["percentage_financed"] = f"{loan_info['percentage_of_project_cost']}%"
        if interest_info.get("min_rate") is not None:
            min_r, max_r = interest_info.get("min_rate"), interest_info.get("max_rate")
            financial_details["interest_rate"] = f"{min_r}%" if min_r == max_r or not max_r else f"{min_r}% - {max_r}%"
        if tenure_info.get("max_months"):
            financial_details["max_tenure"] = f"{tenure_info['max_months']} months"
        if moratorium_info.get("min_months"):
            financial_details["moratorium"] = f"{moratorium_info['min_months']} months"

        rec = {
            "rank": rank,
            "scheme_id": s.get("scheme_id", ""),
            "scheme_name": s.get("name", ""),
            "match_score": item["score"],
            "eligibility_status": item["status"],
            "matched_rules": item["matched_rules"],
            "warnings": item["warnings"],
            "financial_details": financial_details,
            "documents": s.get("documents", []),
            "source": {
                "name": src_info.get("name", "") or "Government Department / SCA",
                "url": src_info.get("url", "")
            }
        }
        recommendations.append(rec)

    return recommendations, len(evaluated)


SESSION_STORE = {}


def get_session_history(session_id):
    if session_id not in SESSION_STORE:
        SESSION_STORE[session_id] = ChatMessageHistory()
    return SESSION_STORE[session_id]


class SchemeAgent:
    """
    AI Agent that explains recommendations and answers follow-up questions.
    Strictly grounded ONLY in user_data and top_3_schemes.
    """

    def __init__(self, user_data, top_3_schemes, session_id):
        self.user_data = user_data
        self.top_3_schemes = top_3_schemes
        self.session_id = session_id
        self.runnable = self._build_runnable()

    def _build_system_instruction(self):
        return f"""You are an expert Government Scheme Advisor AI agent.
Your ONLY job is to explain the top recommended government schemes, answer follow-up questions, and compare options for the applicant in natural, conversational language.

STRICT GROUNDING & ACCURACY RULES:
1. You MUST ONLY use the provided `user_data` and `top_3_schemes` context below to answer questions.
2. If requested information is NOT present in the provided scheme data (e.g. unstated interest rates, missing documents, or unmentioned eligibility rules), explicitly state: "The available scheme information does not contain enough details to answer this confidently."
3. Do NOT invent, hallucinate, or assume scheme details, rates, or rules outside the provided context.
4. Do NOT re-calculate or change eligibility, filtering, or ranking. Eligibility and ranking were already computed deterministically by the matcher engine.
5. Provide clear, natural, human-readable explanations, comparisons, and answers to follow-up questions.
6. Retain context of the user's profile and top 3 schemes across all follow-up questions in the conversation.

PROVIDED CONTEXT:
User Data:
{json.dumps(self.user_data, indent=2)}

Top 3 Recommended Schemes:
{json.dumps(self.top_3_schemes, indent=2)}
"""

    def _build_runnable(self):
        prompt = ChatPromptTemplate.from_messages([
            SystemMessage(content=self._build_system_instruction()),
            MessagesPlaceholder(variable_name="history"),
            ("human", "{input}"),
        ])
        model = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            google_api_key=os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY"),
            temperature=0,
        )
        chain = prompt | model
        return RunnableWithMessageHistory(
            chain,
            get_session_history,
            input_messages_key="input",
            history_messages_key="history",
        )

    def ask(self, user_prompt):
        if not user_prompt:
            return ""
        response = self.runnable.invoke(
            {"input": user_prompt},
            config={"configurable": {"session_id": self.session_id}},
        )
        return response.content


if __name__ == "__main__":
    json_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "schemes.json")

    print(f"Loading schemes knowledge base from: {json_path}")
    with open(json_path, "r", encoding="utf-8") as f:
        schemes = json.load(f)

    user = {
        "category": "SC",
        "gender": "male",
        "age": 25,
        "annual_income": 300000,
        "state": "Delhi",
        "district": "New Delhi",
        "occupation": "self_employed",
        "education": "graduate",
        "purpose": "business",
        "project_type": "micro_business",
        "project_cost": 100000,
        "loan_required": 90000
    }

    # 1. Matching engine computes top 3 eligible schemes
    recommendations, total_eligible = match_schemes(user, schemes)

    # 2. Directly connect to AI SchemeAgent chatbot
    print("\n" + "=" * 65)
    print(" GOVERNMENT SCHEME AI CHATBOT AGENT ")
    print("=" * 65)

    session_id = str(uuid.uuid4())
    agent = SchemeAgent(
        user_data=user,
        top_3_schemes=recommendations,
        session_id=session_id,
    )

    # AI Agent immediately explains the top recommendations
    initial_prompt = "Explain the top recommended schemes for me in human readable format."
    initial_response = agent.ask(initial_prompt)
    print(f"\nAI Agent:\n{initial_response}\n")

    # Interactive Chatbot Loop
    print("=" * 65)
    print("Type your questions below (or type 'exit' / 'quit' to stop):")
    print("=" * 65)

    while True:
        try:
            user_input = input("\nYou: ").strip()
            if not user_input:
                continue
            if user_input.lower() in ["exit", "quit", "stop", "bye", "q"]:
                print("\nAI Agent: Thank you! Good luck with your scheme application.")
                break

            response = agent.ask(user_input)
            print(f"\nAI Agent:\n{response}")
        except (KeyboardInterrupt, EOFError):
            print("\nAI Agent: Goodbye!")
            break
