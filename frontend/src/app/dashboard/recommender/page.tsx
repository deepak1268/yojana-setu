"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Topbar } from "@/components/dashboard/Topbar";
import { fetchSchemeChat, fetchSchemeMatches } from "@/lib/api";
import type { SchemeRecommendation, UserProfile } from "@/lib/types";

const categories = ["SC", "ST", "OBC", "General"];
const genders = ["Male", "Female", "Other"];
const occupations = ["self_employed", "salaried", "student", "unemployed"];
const educations = ["10th", "12th", "graduate", "postgraduate", "any"];
const purposes = ["business", "education", "housing", "agriculture"];
const projectTypes = ["micro_business", "manufacturing", "services", "higher_education"];

const initial: UserProfile = {
  category: "SC",
  gender: "Male",
  age: 25,
  annual_income: 300000,
  state: "Delhi",
  district: "New Delhi",
  occupation: "self_employed",
  education: "graduate",
  purpose: "business",
  project_type: "micro_business",
  project_cost: 100000,
  loan_required: 90000,
};

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function RecommenderPage() {
  const [form, setForm] = useState<UserProfile>(initial);
  const [results, setResults] = useState<SchemeRecommendation[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Chatbot states
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string>("");
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem("ys_last_recommendations");
      const storedProfile = window.localStorage.getItem("ys_user_profile");
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as SchemeRecommendation[];
          if (parsed && parsed.length > 0) {
            setResults(parsed);
          }
        } catch {
          // Ignore parse error
        }
      }
      if (storedProfile) {
        try {
          const parsedProf = JSON.parse(storedProfile) as UserProfile;
          if (parsedProf) setForm(parsedProf);
        } catch {
          // Ignore
        }
      }
      setSessionId(Math.random().toString(36).substring(2, 11));
    }
  }, []);

  useEffect(() => {
    if (chatMessages.length > 0) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, chatLoading]);

  // AI Scheme Advisor Chat state
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hello! I am your **AI Scheme Advisor**. Fill in your details above or ask me any question about government schemes, eligibility, or benefits.",
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [sessionId] = useState(() => "session_" + Math.random().toString(36).substring(2, 9));
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  function update<K extends keyof UserProfile>(key: K, value: UserProfile[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResults(sampleRecommendations);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("ys_last_recommendations", JSON.stringify(sampleRecommendations));
    }
  }

  async function handleSendChat(e: React.FormEvent) {
    e.preventDefault();
    const prompt = chatInput.trim();
    if (!prompt || isStreaming) return;

    setChatInput("");
    setMessages((prev) => [
      ...prev,
      { role: "user", content: prompt },
      { role: "assistant", content: "" },
    ]);
    setIsStreaming(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/schemes/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: prompt,
          session_id: sessionId,
          user_data: form,
          top_3_schemes: results,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith("data: ")) {
            const dataStr = trimmed.slice(6);
            if (dataStr === "[DONE]") break;
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.content) {
                setMessages((prev) => {
                  const updated = [...prev];
                  const lastIdx = updated.length - 1;
                  if (lastIdx >= 0 && updated[lastIdx].role === "assistant") {
                    updated[lastIdx] = {
                      ...updated[lastIdx],
                      content: updated[lastIdx].content + parsed.content,
                    };
                  }
                  return updated;
                });
              } else if (parsed.error) {
                setMessages((prev) => {
                  const updated = [...prev];
                  const lastIdx = updated.length - 1;
                  if (lastIdx >= 0 && updated[lastIdx].role === "assistant") {
                    updated[lastIdx] = {
                      ...updated[lastIdx],
                      content: updated[lastIdx].content + `\n\n*Error: ${parsed.error}*`,
                    };
                  }
                  return updated;
                });
              }
            } catch {
              // ignore parse errors for partial chunks
            }
          }
        }
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Failed to fetch response";
      setMessages((prev) => {
        const updated = [...prev];
        const lastIdx = updated.length - 1;
        if (lastIdx >= 0 && updated[lastIdx].role === "assistant") {
          if (!updated[lastIdx].content) {
            updated[lastIdx] = {
              ...updated[lastIdx],
              content: `*Unable to connect to AI Scheme Advisor backend (${errMsg}). Please check backend status.*`,
            };
          }
        }
        return updated;
      });
    } finally {
      setIsStreaming(false);
    }
  }

  return (
    <>
      <Topbar title="Scheme recommender" subtitle="Fill in your details to see eligible schemes." />

      <div className="flex-1 px-5 py-6 sm:px-8 sm:py-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <form onSubmit={handleSubmit} className="space-y-5 rounded-3xl border border-navy/10 bg-card p-6 sm:p-7">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium text-ink">
                Category
                <select
                  value={form.category}
                  onChange={(e) => update("category", e.target.value)}
                  className="mt-2 w-full rounded-xl border border-navy/15 bg-background px-4 py-2.5 text-sm outline-none focus:border-saffron focus:ring-4 focus:ring-saffron/10"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </label>

              <label className="text-sm font-medium text-ink">
                Gender
                <select
                  value={form.gender}
                  onChange={(e) => update("gender", e.target.value)}
                  className="mt-2 w-full rounded-xl border border-navy/15 bg-background px-4 py-2.5 text-sm outline-none focus:border-saffron focus:ring-4 focus:ring-saffron/10"
                >
                  {genders.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </label>

              <label className="text-sm font-medium text-ink">
                Age
                <input
                  type="number"
                  min={18}
                  max={70}
                  value={form.age}
                  onChange={(e) => update("age", Number(e.target.value))}
                  className="mt-2 w-full rounded-xl border border-navy/15 bg-background px-4 py-2.5 text-sm outline-none focus:border-saffron focus:ring-4 focus:ring-saffron/10"
                />
              </label>

              <label className="text-sm font-medium text-ink">
                Annual family income (₹)
                <input
                  type="number"
                  step={5000}
                  value={form.annual_income}
                  onChange={(e) => update("annual_income", Number(e.target.value))}
                  className="mt-2 w-full rounded-xl border border-navy/15 bg-background px-4 py-2.5 text-sm outline-none focus:border-saffron focus:ring-4 focus:ring-saffron/10"
                />
              </label>

              <label className="text-sm font-medium text-ink">
                State
                <input
                  type="text"
                  value={form.state}
                  onChange={(e) => update("state", e.target.value)}
                  className="mt-2 w-full rounded-xl border border-navy/15 bg-background px-4 py-2.5 text-sm outline-none focus:border-saffron focus:ring-4 focus:ring-saffron/10"
                />
              </label>

              <label className="text-sm font-medium text-ink">
                District
                <input
                  type="text"
                  value={form.district}
                  onChange={(e) => update("district", e.target.value)}
                  className="mt-2 w-full rounded-xl border border-navy/15 bg-background px-4 py-2.5 text-sm outline-none focus:border-saffron focus:ring-4 focus:ring-saffron/10"
                />
              </label>

              <label className="text-sm font-medium text-ink">
                Occupation
                <select
                  value={form.occupation}
                  onChange={(e) => update("occupation", e.target.value)}
                  className="mt-2 w-full rounded-xl border border-navy/15 bg-background px-4 py-2.5 text-sm outline-none focus:border-saffron focus:ring-4 focus:ring-saffron/10"
                >
                  {occupations.map((o) => (
                    <option key={o} value={o}>{o.replace("_", " ")}</option>
                  ))}
                </select>
              </label>

              <label className="text-sm font-medium text-ink">
                Education
                <select
                  value={form.education}
                  onChange={(e) => update("education", e.target.value)}
                  className="mt-2 w-full rounded-xl border border-navy/15 bg-background px-4 py-2.5 text-sm outline-none focus:border-saffron focus:ring-4 focus:ring-saffron/10"
                >
                  {educations.map((ed) => (
                    <option key={ed} value={ed}>{ed}</option>
                  ))}
                </select>
              </label>

              <label className="text-sm font-medium text-ink">
                Purpose
                <select
                  value={form.purpose}
                  onChange={(e) => update("purpose", e.target.value)}
                  className="mt-2 w-full rounded-xl border border-navy/15 bg-background px-4 py-2.5 text-sm outline-none focus:border-saffron focus:ring-4 focus:ring-saffron/10"
                >
                  {purposes.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </label>

              <label className="text-sm font-medium text-ink">
                Project type
                <select
                  value={form.project_type}
                  onChange={(e) => update("project_type", e.target.value)}
                  className="mt-2 w-full rounded-xl border border-navy/15 bg-background px-4 py-2.5 text-sm outline-none focus:border-saffron focus:ring-4 focus:ring-saffron/10"
                >
                  {projectTypes.map((p) => (
                    <option key={p} value={p}>{p.replace("_", " ")}</option>
                  ))}
                </select>
              </label>

              <label className="text-sm font-medium text-ink">
                Project cost (₹)
                <input
                  type="number"
                  step={5000}
                  value={form.project_cost}
                  onChange={(e) => update("project_cost", Number(e.target.value))}
                  className="mt-2 w-full rounded-xl border border-navy/15 bg-background px-4 py-2.5 text-sm outline-none focus:border-saffron focus:ring-4 focus:ring-saffron/10"
                />
              </label>

              <label className="text-sm font-medium text-ink">
                Loan required (₹)
                <input
                  type="number"
                  step={5000}
                  value={form.loan_required}
                  onChange={(e) => update("loan_required", Number(e.target.value))}
                  className="mt-2 w-full rounded-xl border border-navy/15 bg-background px-4 py-2.5 text-sm outline-none focus:border-saffron focus:ring-4 focus:ring-saffron/10"
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-saffron px-5 py-3 text-sm font-semibold text-white hover:bg-saffron-deep disabled:opacity-50"
            >
              {loading ? "Finding matching schemes..." : "Find matching schemes"}
            </button>
          </form>

          <div className="space-y-4">
            {error && (
              <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-6 text-sm text-red-600">
                {error}
              </div>
            )}

            {!results && !error && (
              <div className="rounded-3xl border border-dashed border-navy/15 p-8 text-center text-sm text-muted">
                {loading ? "Matching applicant profile against schemes..." : "Fill in the form and submit to see your top matched schemes."}
              </div>
            )}

            {results && results.length === 0 && !error && (
              <div className="rounded-3xl border border-dashed border-navy/15 p-8 text-center text-sm text-muted">
                No recommendation available.
              </div>
            )}

            {results?.map((r) => (
              <div key={r.scheme_id} className="rounded-3xl bg-navy p-6 text-cream">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold tracking-[0.18em] text-saffron uppercase">
                      Rank {r.rank} · {r.eligibility_status.replace("_", " ")}
                    </p>
                    <h3 className="mt-1 font-display text-xl">{r.scheme_name}</h3>
                  </div>
                  <span className="shrink-0 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">
                    {r.match_score}% match
                  </span>
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-white/10 pt-4 text-sm">
                  {r.financial_details.max_loan && (
                    <div>
                      <dt className="text-cream/55">Max loan</dt>
                      <dd className="font-medium">{r.financial_details.max_loan}</dd>
                    </div>
                  )}
                  {r.financial_details.interest_rate && (
                    <div>
                      <dt className="text-cream/55">Interest</dt>
                      <dd className="font-medium">{r.financial_details.interest_rate}</dd>
                    </div>
                  )}
                  {r.financial_details.max_tenure && (
                    <div>
                      <dt className="text-cream/55">Max tenure</dt>
                      <dd className="font-medium">{r.financial_details.max_tenure}</dd>
                    </div>
                  )}
                  {r.financial_details.moratorium && (
                    <div>
                      <dt className="text-cream/55">Moratorium</dt>
                      <dd className="font-medium">{r.financial_details.moratorium}</dd>
                    </div>
                  )}
                </dl>

                {r.warnings.length > 0 && (
                  <p className="mt-4 rounded-xl bg-saffron/15 px-3 py-2 text-xs text-saffron">
                    {r.warnings[0]}
                  </p>
                )}

                <a
                  href="/dashboard/calculator"
                  className="mt-4 inline-flex text-sm font-semibold text-saffron hover:text-saffron-deep"
                >
                  Calculate EMI for this scheme →
                </a>
              </div>
            ))}

            {/* AI SCHEME ADVISOR CHATBOT */}
            <div className="rounded-3xl border border-navy/10 bg-card p-6 shadow-sm">
              <div className="flex items-center gap-2 border-b border-navy/10 pb-3">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-saffron text-xs font-bold text-white">
                  AI
                </span>
                <div>
                  <h4 className="font-display text-base text-ink">AI Scheme Advisor</h4>
                  <p className="text-[11px] text-muted">Ask follow-up questions about schemes & eligibility</p>
                </div>
              </div>

              <div className="mt-4 max-h-80 min-h-[160px] space-y-3 overflow-y-auto pr-1">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm ${msg.role === "user"
                          ? "bg-saffron text-white"
                          : "bg-navy/5 text-ink border border-navy/10"
                        }`}
                    >
                      {msg.role === "user" ? (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      ) : (
                        <div className="prose prose-sm max-w-none text-ink">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              h1: ({ ...props }) => <h1 className="text-base font-bold my-1 text-ink" {...props} />,
                              h2: ({ ...props }) => <h2 className="text-sm font-bold my-1 text-ink" {...props} />,
                              h3: ({ ...props }) => <h3 className="text-xs font-bold my-1 text-ink" {...props} />,
                              p: ({ ...props }) => <p className="mb-1.5 last:mb-0 leading-relaxed" {...props} />,
                              ul: ({ ...props }) => <ul className="list-disc list-inside mb-2 space-y-0.5" {...props} />,
                              ol: ({ ...props }) => <ol className="list-decimal list-inside mb-2 space-y-0.5" {...props} />,
                              li: ({ ...props }) => <li className="ml-1" {...props} />,
                              strong: ({ ...props }) => <strong className="font-semibold text-saffron-deep" {...props} />,
                              table: ({ ...props }) => <table className="w-full text-xs border-collapse border border-navy/20 my-2" {...props} />,
                              th: ({ ...props }) => <th className="border border-navy/20 px-2 py-1 bg-navy/10 font-semibold text-ink" {...props} />,
                              td: ({ ...props }) => <td className="border border-navy/20 px-2 py-1 text-ink" {...props} />,
                              code: ({ ...props }) => <code className="bg-navy/10 px-1 py-0.5 rounded text-xs font-mono" {...props} />,
                            }}
                          >
                            {msg.content || (isStreaming && i === messages.length - 1 ? "Thinking..." : "")}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={chatBottomRef} />
              </div>

              <form onSubmit={handleSendChat} className="mt-4 flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask a question about your scheme match..."
                  disabled={isStreaming}
                  className="flex-1 rounded-xl border border-navy/15 bg-background px-4 py-2 text-sm outline-none focus:border-saffron focus:ring-2 focus:ring-saffron/10 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={isStreaming || !chatInput.trim()}
                  className="rounded-xl bg-saffron px-4 py-2 text-sm font-semibold text-white hover:bg-saffron-deep disabled:opacity-50"
                >
                  {isStreaming ? "..." : "Send"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

