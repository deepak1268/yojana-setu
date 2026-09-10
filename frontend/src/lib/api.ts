import type {
  UserProfile,
  SchemeMatchResponse,
  EmiCalculatorRequest,
  EmiCalculatorResponse,
  PartnerLocateRequest,
  PartnerLocateResponse,
} from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_FASTAPI_URL || "http://127.0.0.1:8000";

async function postJson<T>(endpoint: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    let errorMessage = `HTTP error ${response.status}`;
    try {
      const errorData = await response.json();
      if (errorData.detail) {
        errorMessage = typeof errorData.detail === "string" ? errorData.detail : JSON.stringify(errorData.detail);
      }
    } catch {
      // Ignore JSON parse error
    }
    throw new Error(errorMessage);
  }

  return response.json() as Promise<T>;
}

export async function fetchSchemeMatches(userProfile: UserProfile): Promise<SchemeMatchResponse> {
  return postJson<SchemeMatchResponse>("/schemes/match", userProfile);
}

export async function fetchEmiCalculation(request: EmiCalculatorRequest): Promise<EmiCalculatorResponse> {
  return postJson<EmiCalculatorResponse>("/calculator/emi", request);
}

export async function fetchLocatedPartners(request: PartnerLocateRequest): Promise<PartnerLocateResponse> {
  return postJson<PartnerLocateResponse>("/partners/locate", request);
}
