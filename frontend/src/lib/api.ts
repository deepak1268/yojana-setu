import type {
  UserProfile,
  SchemeMatchResponse,
  SchemeChatRequest,
  SchemeChatResponse,
  SchemeListResponse,
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

async function getJson<T>(endpoint: string, params?: Record<string, string | undefined>): Promise<T> {
  const url = new URL(`${API_BASE_URL}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val.trim() !== "") {
        url.searchParams.append(key, val);
      }
    });
  }

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "Accept": "application/json",
    },
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

export async function fetchSchemeChat(request: SchemeChatRequest): Promise<SchemeChatResponse> {
  return postJson<SchemeChatResponse>("/schemes/chat", request);
}

export async function fetchSchemes(params?: {
  search?: string;
  category?: string;
  purpose?: string;
  state?: string;
  gender?: string;
}): Promise<SchemeListResponse> {
  return getJson<SchemeListResponse>("/schemes", params);
}

export async function fetchEmiCalculation(request: EmiCalculatorRequest): Promise<EmiCalculatorResponse> {
  return postJson<EmiCalculatorResponse>("/calculator/emi", request);
}

export async function fetchLocatedPartners(request: PartnerLocateRequest): Promise<PartnerLocateResponse> {
  return postJson<PartnerLocateResponse>("/partners/locate", request);
}
