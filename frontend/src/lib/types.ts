// Matches the object shape expected by ai/scheme_matcher.py's match_schemes(user, schemes)
export interface UserProfile {
  category: string;
  gender: string;
  age: number;
  annual_income: number;
  state: string;
  district: string;
  occupation: string;
  education: string;
  purpose: string;
  project_type: string;
  project_cost: number;
  loan_required: number;
}

// Matches one entry in the `recommendations` list returned by match_schemes()
export interface SchemeRecommendation {
  rank: number;
  scheme_id: string;
  scheme_name: string;
  match_score: number;
  eligibility_status: "eligible" | "not_eligible" | "verification_required";
  matched_rules: string[];
  warnings: string[];
  financial_details: {
    max_loan?: string;
    percentage_financed?: string;
    interest_rate?: string;
    max_tenure?: string;
    moratorium?: string;
  };
  documents: string[];
  source: {
    name: string;
    url: string;
  };
}

// Matches one entry in ai/partners.json, consumed by ai/partner_locator.py
export interface Partner {
  partner_id: string;
  name: string;
  type: "SCA" | "PSB" | "RRB" | "NBFC-MFI";
  state: string;
  city: string;
  latitude: number;
  longitude: number;
  supported_schemes: string[];
  active: boolean;
  fund_utilization_percent: number;
  npa_percent: number;
  overdue_percent: number;
  processing_capacity: "high" | "medium" | "low";
}

// Extra fields partner_locator.py attaches after ranking (rank_partners)
export interface RankedPartner extends Partner {
  _routing_score: number;
  _distance_km: number;
}

// FastAPI Response for POST /schemes/match
export interface SchemeMatchResponse {
  recommendations: SchemeRecommendation[];
  total_eligible: number;
  message?: string;
}

// FastAPI Request for POST /calculator/emi
export interface EmiCalculatorRequest {
  scheme_id: string;
  loan_amount: number;
  interest_rate?: number;
  tenure_months: number;
  moratorium_months: number;
}

// Summary object returned inside EmiCalculatorResponse
export interface EmiSummary {
  loan_amount: number;
  tenure_months: number;
  moratorium_months: number;
  monthly_emi: number;
  total_interest: number;
  total_repayment: number;
}

// Amortization row returned in amortization_schedule
export interface AmortizationRow {
  month: number;
  phase: string;
  opening: number;
  payment: number;
  interest: number;
  principal: number;
  closing: number;
}

// FastAPI Response for POST /calculator/emi
export interface EmiCalculatorResponse {
  scheme_id: string;
  scheme_name: string;
  interest_rate_used: number;
  summary: EmiSummary;
  amortization_schedule: AmortizationRow[];
}

// FastAPI Request for POST /partners/locate
export interface PartnerLocateRequest {
  scheme_id: string;
  latitude: number;
  longitude: number;
}

// FastAPI Response for POST /partners/locate
export interface PartnerLocateResponse {
  partners: RankedPartner[];
  message?: string;
}