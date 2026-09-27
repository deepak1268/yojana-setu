"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Topbar } from "@/components/dashboard/Topbar";
import { useBookmarks } from "@/context/BookmarkContext";
import { fetchSchemeChat, fetchSchemeMatches } from "@/lib/api";
import type { SchemeRecommendation, UserProfile } from "@/lib/types";
import jsPDF from "jspdf";

const categories = ["SC", "ST", "OBC", "General"];
const genders = ["Male", "Female", "Other"];
const occupations = ["self_employed", "salaried", "student", "unemployed"];
const educations = ["10th", "12th", "graduate", "postgraduate", "any"];
const purposes = ["business", "education", "housing", "agriculture"];
const projectTypes = ["micro_business", "manufacturing", "services", "higher_education"];

const suggestedPrompts = [
  "Why was this scheme recommended?",
  "What are the eligibility requirements?",
  "How much loan can I get?",
  "What is the interest rate?",
  "What documents are required?",
  "Which of the 3 schemes is better for me?",
  "Can I use this scheme for my purpose?",
];

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
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const [form, setForm] = useState<UserProfile>(initial);
  const [results, setResults] = useState<SchemeRecommendation[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  // Multilingual Voice Assistant state
  const [isRecording, setIsRecording] = useState(false);
  const [isVoiceProcessing, setIsVoiceProcessing] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  function getVoiceWsUrl(): string {
    const baseUrl = (process.env.NEXT_PUBLIC_FASTAPI_URL || "http://127.0.0.1:8000").replace(/\/+$/, "");
    const wsProtocol = baseUrl.startsWith("https") ? "wss:" : "ws:";
    const host = baseUrl.replace(/^https?:\/\//, "");
    return `${wsProtocol}//${host}/ws/voice`;
  }

  async function startRecording() {
    setVoiceError(null);
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      setIsPlayingAudio(false);
    }
    if (typeof window === "undefined" || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setVoiceError("Microphone input is not supported in this browser.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : undefined,
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const mimeType = mediaRecorder.mimeType || "audio/webm";
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        if (audioBlob.size > 0) {
          await sendAudioToVoiceWs(audioBlob, mimeType);
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Microphone permission denied or failed to initialize.";
      setVoiceError(msg);
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsVoiceProcessing(true);
    }
  }

  async function sendAudioToVoiceWs(audioBlob: Blob, mimeType: string) {
    setIsVoiceProcessing(true);
    setVoiceError(null);

    try {
      const arrayBuffer = await audioBlob.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = "";
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const audioB64 = btoa(binary);

      const wsUrl = getVoiceWsUrl();
      const ws = new WebSocket(wsUrl);

      let userMsgAdded = false;

      ws.onopen = () => {
        ws.send(
          JSON.stringify({
            action: "voice_input",
            audio: audioB64,
            mime_type: mimeType,
            session_id: sessionId,
            user_data: form,
            top_3_schemes: results,
          })
        );
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === "transcription") {
            setIsVoiceProcessing(false);
            setIsStreaming(true);
            setMessages((prev) => [
              ...prev,
              { role: "user", content: msg.text },
              { role: "assistant", content: "" },
            ]);
            userMsgAdded = true;
          } else if (msg.type === "text_chunk") {
            setMessages((prev) => {
              const updated = [...prev];
              const lastIdx = updated.length - 1;
              if (lastIdx >= 0 && updated[lastIdx].role === "assistant") {
                updated[lastIdx] = {
                  ...updated[lastIdx],
                  content: updated[lastIdx].content + msg.content,
                };
              }
              return updated;
            });
          } else if (msg.type === "text_done") {
            setIsStreaming(false);
          } else if (msg.type === "audio_response") {
            try {
              const audioUri = `data:${msg.mime_type || "audio/mp3"};base64,${msg.audio}`;
              if (audioPlayerRef.current) {
                audioPlayerRef.current.pause();
              }
              const audio = new Audio(audioUri);
              audioPlayerRef.current = audio;
              setIsPlayingAudio(true);
              audio.onended = () => setIsPlayingAudio(false);
              audio.onerror = () => setIsPlayingAudio(false);
              audio.play().catch(() => setIsPlayingAudio(false));
            } catch {
              setIsPlayingAudio(false);
            }
          } else if (msg.type === "tts_error") {
            console.warn(msg.message);
          } else if (msg.type === "error") {
            setIsVoiceProcessing(false);
            setIsStreaming(false);
            setVoiceError(msg.message);
            if (!userMsgAdded) {
              setMessages((prev) => [
                ...prev,
                { role: "assistant", content: `*Voice error: ${msg.message}*` },
              ]);
            }
          } else if (msg.type === "done") {
            setIsVoiceProcessing(false);
            setIsStreaming(false);
            ws.close();
          }
        } catch {
          // Ignore JSON parse errors
        }
      };

      ws.onerror = () => {
        setIsVoiceProcessing(false);
        setIsStreaming(false);
        setVoiceError("WebSocket connection to voice service failed.");
      };

      ws.onclose = () => {
        setIsVoiceProcessing(false);
        setIsStreaming(false);
      };
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Failed to send audio to voice service";
      setIsVoiceProcessing(false);
      setIsStreaming(false);
      setVoiceError(errMsg);
    }
  }

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
    }
  }, []);

  function update<K extends keyof UserProfile>(key: K, value: UserProfile[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSchemeMatches(form);
      const recs = data.recommendations || [];
      setResults(recs);
      if (typeof window !== "undefined") {
        window.localStorage.setItem("ys_last_recommendations", JSON.stringify(recs));
        window.localStorage.setItem("ys_user_profile", JSON.stringify(form));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to fetch recommendations";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleSendChat(e?: React.FormEvent, overridePrompt?: string) {
    if (e) e.preventDefault();
    const prompt = (overridePrompt || chatInput).trim();
    if (!prompt || isStreaming) return;

    setChatInput("");
    setMessages((prev) => [
      ...prev,
      { role: "user", content: prompt },
      { role: "assistant", content: "" },
    ]);
    setIsStreaming(true);

    try {
      const fastApiUrl = (process.env.NEXT_PUBLIC_FASTAPI_URL || "http://127.0.0.1:8000").replace(/\/+$/, "");
      const response = await fetch(`${fastApiUrl}/schemes/chat`, {
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
  function downloadSchemePDF(scheme: SchemeRecommendation) {
    const doc = new jsPDF();

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const margin = 18;
    const contentWidth = pageWidth - margin * 2;

    let y = 20;

    // ---------- Helpers ----------

    const checkPageBreak = (requiredHeight = 15) => {
      if (y + requiredHeight > pageHeight - 25) {
        doc.addPage();
        y = 20;
      }
    };

    const addSectionTitle = (title: string) => {
      checkPageBreak(18);

      y += 5;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(25, 45, 70);

      doc.text(title, margin, y);

      y += 3;

      doc.setDrawColor(220, 220, 220);
      doc.line(margin, y, pageWidth - margin, y);

      y += 9;
    };

    const addField = (
      label: string,
      value: unknown,
      x: number,
      width: number
    ) => {
      if (value === undefined || value === null || value === "") return;

      const text = String(value);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(110, 110, 110);
      doc.text(label, x, y);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(30, 30, 30);

      const lines = doc.splitTextToSize(text, width);

      doc.text(lines, x, y + 5);

      return lines.length;
    };

    const addBulletList = (items: string[]) => {
      items.forEach((item) => {
        checkPageBreak(12);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(40, 40, 40);

        const lines = doc.splitTextToSize(
          item,
          contentWidth - 10
        );

        doc.text("•", margin, y);

        doc.text(lines, margin + 6, y);

        y += lines.length * 5 + 3;
      });
    };

    // ---------- Header ----------

    doc.setFillColor(25, 45, 70);
    doc.rect(0, 0, pageWidth, 42, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("YOJANA SETU", margin, 13);

    doc.setFontSize(18);

    const schemeTitle = doc.splitTextToSize(
      scheme.scheme_name || "Government Scheme",
      contentWidth
    );

    doc.text(schemeTitle, margin, 24);

    y = 53;

    // ---------- Match Summary ----------

    doc.setFillColor(245, 247, 250);
    doc.roundedRect(
      margin,
      y,
      contentWidth,
      25,
      3,
      3,
      "F"
    );

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);

    doc.text("RANK", margin + 8, y + 8);
    doc.text("MATCH SCORE", margin + 70, y + 8);
    doc.text("ELIGIBILITY", margin + 140, y + 8);

    doc.setFontSize(12);
    doc.setTextColor(30, 30, 30);

    doc.text(String(scheme.rank), margin + 8, y + 17);
    doc.text(`${scheme.match_score}%`, margin + 70, y + 17);

    doc.text(
      scheme.eligibility_status
        ?.replaceAll("_", " ")
        .replace(/\b\w/g, (c) => c.toUpperCase()),
      margin + 140,
      y + 17
    );

    y += 36;

    // ---------- Financial Details ----------

    addSectionTitle("Financial Details");

    const financial = scheme.financial_details || {};

    const financialFields = [
      ["Maximum Loan", financial.max_loan],
      ["Interest Rate", financial.interest_rate],
      ["Maximum Tenure", financial.max_tenure],
      ["Moratorium", financial.moratorium],
      ["Percentage Financed", financial.percentage_financed],
    ];

    const columns = 2;
    const columnWidth = contentWidth / columns;

    let column = 0;
    let rowStartY = y;

    financialFields.forEach(([label, value]) => {
      if (value === undefined || value === null || value === "") {
        return;
      }

      const x = margin + column * columnWidth;

      addField(
        String(label),
        value,
        x,
        columnWidth - 12
      );

      column++;

      if (column === columns) {
        column = 0;
        y += 20;
      }
    });

    if (column !== 0) {
      y += 20;
    }

    // ---------- Documents ----------

    const documents =
      scheme.documents ||
      scheme.warnings
        ?.filter((warning) =>
          warning.toLowerCase().startsWith("document required:")
        )
        .map((warning) =>
          warning.replace(/^document required:\s*/i, "")
        );

    if (documents?.length) {
      addSectionTitle("Documents Required");

      addBulletList(documents);
    }

    // ---------- Other useful information ----------

    const excludedFields = [
      "scheme_name",
      "rank",
      "match_score",
      "eligibility_status",
      "financial_details",
      "warnings",
      "matched_rules",
      "scheme_id",
      "documents",
      "source",
    ];

    const additionalFields = Object.entries(scheme).filter(
      ([key, value]) =>
        !excludedFields.includes(key) &&
        value !== undefined &&
        value !== null &&
        value !== ""
    );

    if (additionalFields.length > 0) {
      addSectionTitle("Additional Information");

      additionalFields.forEach(([key, value]) => {
        checkPageBreak(15);

        const label = key
          .replaceAll("_", " ")
          .replace(/\b\w/g, (char) => char.toUpperCase());

        const formattedValue =
          typeof value === "object"
            ? JSON.stringify(value)
            : String(value);

        addField(
          label,
          formattedValue,
          margin,
          contentWidth
        );

        y += 15;
      });
    }

    // ---------- Source ----------

    if (scheme.source?.name || scheme.source?.url) {
      addSectionTitle("Scheme Information Source");

      if (scheme.source.name) {
        addField(
          "Provided By",
          scheme.source.name,
          margin,
          contentWidth
        );

        y += 15;
      }

      if (scheme.source.url) {
        addField(
          "Official Website",
          scheme.source.url,
          margin,
          contentWidth
        );

        y += 15;
      }
    }

    // ---------- Disclaimer ----------

    // Keep the Important section on the same page
    const footerSpace = 32;

    if (y > pageHeight - footerSpace - 25) {
      // Reduce spacing instead of creating another page
      y = pageHeight - footerSpace - 25;
    } else {
      y += 3;
    }

    doc.setFillColor(248, 248, 248);

    doc.roundedRect(
      margin,
      y,
      contentWidth,
      23,
      3,
      3,
      "F"
    );

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(70, 70, 70);

    doc.text(
      "Important:",
      margin + 7,
      y + 8
    );

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);

    const disclaimer = doc.splitTextToSize(
      "Scheme information is provided for guidance only. Please verify the latest eligibility criteria, interest rates, loan limits, required documents and application procedure with the concerned authority or financial institution.",
      contentWidth - 14
    );

    doc.text(
      disclaimer,
      margin + 7,
      y + 14
    );

    // ---------- Footer ----------

    const pageCount = doc.getNumberOfPages();

    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);

      doc.setDrawColor(220, 220, 220);
      doc.line(
        margin,
        pageHeight - 15,
        pageWidth - margin,
        pageHeight - 15
      );

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(120, 120, 120);

      doc.text(
        "Yojana Setu • Scheme Information",
        margin,
        pageHeight - 8
      );

      doc.text(
        `Page ${i} of ${pageCount}`,
        pageWidth - margin,
        pageHeight - 8,
        { align: "right" }
      );
    }

    // ---------- Download ----------

    const filename =
      `${scheme.scheme_name || "scheme"}`
        .replace(/[^a-z0-9]+/gi, "-")
        .replace(/^-|-$/g, "")
        .toLowerCase();

    doc.save(`${filename}.pdf`);
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
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">
                      {r.match_score}% match
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleBookmark(r)}
                      title={isBookmarked(r.scheme_id) ? "Remove from bookmarks" : "Save scheme"}
                      className={`flex h-8 w-8 items-center justify-center rounded-full border transition ${
                        isBookmarked(r.scheme_id)
                          ? "border-saffron bg-saffron text-white shadow-sm hover:bg-saffron-deep"
                          : "border-white/20 bg-white/5 text-cream/70 hover:border-saffron hover:text-saffron hover:bg-white/10"
                      }`}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        className="h-4 w-4"
                        fill={isBookmarked(r.scheme_id) ? "currentColor" : "none"}
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path
                          d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"
                          strokeLinejoin="round"
                          strokeLinecap="round"
                        />
                      </svg>
                    </button>
                  </div>
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

                <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/10 pt-4">
                  <a
                    href="/dashboard/calculator"
                    className="inline-flex text-sm font-semibold text-saffron hover:text-saffron-deep"
                  >
                    Calculate EMI for this scheme →
                  </a>

                  <div className="flex items-center gap-2">
                    {/* Bookmark button */}
                    <button
                      type="button"
                      onClick={() => toggleBookmark(r)}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-cream/75 hover:text-cream transition"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        className="h-3.5 w-3.5"
                        fill={isBookmarked(r.scheme_id) ? "#e36a1a" : "none"}
                        stroke={isBookmarked(r.scheme_id) ? "#e36a1a" : "currentColor"}
                        strokeWidth="2"
                      >
                        <path
                          d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"
                          strokeLinejoin="round"
                          strokeLinecap="round"
                        />
                      </svg>
                      {isBookmarked(r.scheme_id) ? "Saved" : "Save scheme"}
                    </button>

                    {/* Download PDF button */}
                    <button
                      type="button"
                      onClick={() => downloadSchemePDF(r)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20"
                    >
                      <svg
                        className="h-3.5 w-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14"
                        />
                      </svg>
                      Download PDF
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* AI SCHEME ADVISOR CHATBOT */}
            <div className="rounded-3xl border border-navy/10 bg-card p-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-navy/10 pb-3">
                <div className="flex items-center gap-2">
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-saffron text-xs font-bold text-white">
                    AI
                  </span>
                  <div>
                    <h4 className="font-display text-base text-ink">AI Scheme Advisor</h4>
                    <p className="text-[11px] text-muted">Ask follow-up questions about schemes & eligibility</p>
                  </div>
                </div>
                {isPlayingAudio && (
                  <span className="flex items-center gap-1.5 rounded-full bg-saffron/10 px-2.5 py-1 text-xs font-semibold text-saffron-deep animate-pulse">
                    🔊 Playing response
                  </span>
                )}
              </div>

              {voiceError && (
                <div className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 p-2.5 text-xs text-red-600">
                  {voiceError}
                </div>
              )}

              {/* Suggested prompt chips */}
              <div className="mt-4 flex flex-wrap gap-1.5">
                {suggestedPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    disabled={isStreaming}
                    onClick={() => handleSendChat(undefined, prompt)}
                    className="rounded-full border border-navy/15 bg-background px-3 py-1 text-xs font-medium text-ink transition hover:border-saffron hover:bg-saffron/5 hover:text-saffron-deep disabled:opacity-50 text-left"
                  >
                    {prompt}
                  </button>
                ))}
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

              <form onSubmit={handleSendChat} className="mt-4 flex items-center gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={
                    isRecording
                      ? "🔴 Recording..."
                      : isVoiceProcessing
                        ? "Processing voice..."
                        : "Ask a question about your scheme match..."
                  }
                  disabled={isStreaming || isRecording || isVoiceProcessing}
                  className="flex-1 rounded-xl border border-navy/15 bg-background px-4 py-2 text-sm outline-none focus:border-saffron focus:ring-2 focus:ring-saffron/10 disabled:opacity-50"
                />

                <button
                  type="button"
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isStreaming || isVoiceProcessing}
                  title={isRecording ? "Stop recording" : "Voice input"}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition disabled:opacity-50 ${isRecording
                    ? "bg-red-600 text-white animate-pulse"
                    : isVoiceProcessing
                      ? "bg-saffron/20 text-saffron-deep"
                      : "bg-navy/10 text-navy hover:bg-navy/20"
                    }`}
                >
                  {isRecording ? (
                    <>
                      <span className="h-2 w-2 rounded-full bg-white animate-ping" />
                      <span>Stop</span>
                    </>
                  ) : isVoiceProcessing ? (
                    <span>Processing...</span>
                  ) : (
                    <>
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                      <span className="hidden sm:inline">Voice</span>
                    </>
                  )}
                </button>

                <button
                  type="submit"
                  disabled={isStreaming || !chatInput.trim() || isRecording || isVoiceProcessing}
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

