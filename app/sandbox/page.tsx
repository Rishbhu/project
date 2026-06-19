"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface AgentConfig {
  agentName: string;
  personality: { traits: string[]; style: string; avoid: string[] };
  messages: Array<{ label: string; content: string }>;
}
interface CompanyContext {
  companyName: string; whatTheyDo: string; culture: string;
  candidateProfile: { jobTitle: string; seniorityLevel: string; keySkills: string };
  tone: string;
}
interface ReActStep {
  type: "thought" | "action" | "observation";
  content?: string; tool?: string;
  input?: Record<string, unknown>; result?: Record<string, unknown>;
}
interface ChatMessage {
  role: "agent" | "candidate";
  content: string; trace?: ReActStep[]; traceOpen?: boolean;
}

const C = {
  sidebar: "#0b0e1c",
  sidebarBorder: "#161d30",
  chat: "#08090f",
  card: "#0d1020",
  border: "#1c2238",
  borderSoft: "#131828",
  text: "#eef0ff",
  textSub: "#6b7a9c",
  textMuted: "#353d58",
} as const;

const TOOL_META: Record<string, { label: string; color: string; dot: string; bg: string; border: string; leftColor: string }> = {
  analyze_candidate_signal: { label: "Signal Analysis",    color: "#a78bfa", dot: "#8b5cf6", bg: "rgba(139,92,246,0.07)",  border: "rgba(139,92,246,0.2)",  leftColor: "#8b5cf6" },
  search_candidate_profile: { label: "Profile Synthesis",  color: "#60a5fa", dot: "#3b82f6", bg: "rgba(59,130,246,0.07)",  border: "rgba(59,130,246,0.2)",   leftColor: "#3b82f6" },
  get_role_market_insights: { label: "Market Intelligence",color: "#34d399", dot: "#10b981", bg: "rgba(16,185,129,0.07)",  border: "rgba(16,185,129,0.2)",  leftColor: "#10b981" },
  get_company_talking_points:{ label: "Talking Points",    color: "#fbbf24", dot: "#f59e0b", bg: "rgba(245,158,11,0.07)",  border: "rgba(245,158,11,0.2)",   leftColor: "#f59e0b" },
};

function TraceStep({ step }: { step: ReActStep }) {
  const [open, setOpen] = useState(false);
  const meta = step.tool ? TOOL_META[step.tool] : null;

  if (step.type === "thought") return (
    <div className="px-3 py-2.5 rounded-lg animate-slide-up"
      style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.12)" }}>
      <p className="text-[10px] font-mono uppercase tracking-widest mb-1.5" style={{ color: "rgba(129,140,248,0.5)" }}>Reasoning</p>
      <p className="text-xs leading-relaxed" style={{ color: "#4a5580" }}>{step.content}</p>
    </div>
  );

  if (step.type === "action" && meta) {
    const keyInputs = Object.entries(step.input || {}).filter(([k]) => !["role", "seniority"].includes(k)).slice(0, 3);
    return (
      <div className="px-3 py-2.5 rounded-lg animate-slide-up"
        style={{ background: meta.bg, border: `1px solid ${meta.border}`, borderLeftWidth: 2, borderLeftColor: meta.leftColor }}>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: meta.dot }} />
          <span className="text-xs font-mono font-semibold" style={{ color: meta.color }}>{meta.label}</span>
          <span className="text-xs font-mono" style={{ color: C.textMuted }}>called</span>
        </div>
        {keyInputs.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
            {keyInputs.map(([k, v]) => (
              <span key={k} className="text-[10px] font-mono" style={{ color: C.textMuted }}>
                {k}: <span style={{ color: "#4a5580" }}>{String(v).slice(0, 60)}</span>
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (step.type === "observation" && meta) {
    const keys = Object.keys(step.result || {}).slice(0, 3);
    return (
      <div className="rounded-lg overflow-hidden animate-slide-up" style={{ border: `1px solid ${C.border}` }}>
        <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-3 py-2 transition-colors"
          style={{ background: open ? C.card : "transparent" }}>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono" style={{ color: C.textMuted }}>└</span>
            <span className="text-xs font-mono font-medium" style={{ color: meta.color }}>✓ {meta.label}</span>
            {keys.length > 0 && <span className="text-[10px] font-mono" style={{ color: C.textMuted }}>{keys.join(", ")}</span>}
          </div>
          <span className="text-xs font-mono" style={{ color: C.textMuted }}>{open ? "−" : "+"}</span>
        </button>
        {open && (
          <div className="px-3 pb-3" style={{ borderTop: `1px solid ${C.borderSoft}` }}>
            <pre className="mt-2 text-[10px] font-mono leading-relaxed whitespace-pre-wrap overflow-x-auto" style={{ color: "#3a4560" }}>
              {JSON.stringify(step.result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    );
  }
  return null;
}

export default function SandboxPage() {
  const router = useRouter();
  const [ctx, setCtx] = useState<CompanyContext | null>(null);
  const [cfg, setCfg] = useState<AgentConfig | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const [liveTrace, setLiveTrace] = useState<ReActStep[]>([]);
  const [agentCount, setAgentCount] = useState(0);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const ctxRaw = localStorage.getItem("companyContext");
    const cfgRaw = localStorage.getItem("agentConfig");
    if (!ctxRaw || !cfgRaw) { router.push("/"); return; }
    const c: CompanyContext = JSON.parse(ctxRaw);
    const a: AgentConfig = JSON.parse(cfgRaw);
    setCtx(c); setCfg(a);
    setMessages([{ role: "agent", content: a.messages[0].content, trace: [], traceOpen: false }]);
  }, [router]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, liveTrace]);

  async function handleSend() {
    if (!input.trim() || isReplying || !cfg || !ctx) return;
    const msg = input.trim();
    setInput(""); setIsReplying(true); setLiveTrace([]);
    const updated: ChatMessage[] = [...messages, { role: "candidate", content: msg }];
    setMessages(updated);
    const history = updated.map((m) => ({ role: m.role === "agent" ? "assistant" : "user", content: m.content }));

    try {
      const res = await fetch("/api/reply", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationHistory: history, agentConfig: cfg, companyContext: ctx }),
      });
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      const currentTrace: ReActStep[] = [];
      let finalReply = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === "thought")     { currentTrace.push({ type: "thought", content: data.content }); setLiveTrace([...currentTrace]); }
            else if (data.type === "action") { currentTrace.push({ type: "action", tool: data.tool, input: data.input }); setLiveTrace([...currentTrace]); }
            else if (data.type === "observation") { currentTrace.push({ type: "observation", tool: data.tool, result: data.result }); setLiveTrace([...currentTrace]); }
            else if (data.type === "reply" && data.done) finalReply = data.content;
            else if (data.type === "error") finalReply = "Something went wrong. Please try again.";
          } catch { /* partial */ }
        }
      }
      const idx = messages.length + 1;
      setMessages((prev) => [...prev, { role: "agent", content: finalReply, trace: currentTrace, traceOpen: idx <= 3 && currentTrace.length > 0 }]);
      setAgentCount((c) => c + 1);
    } catch {
      setMessages((prev) => [...prev, { role: "agent", content: "Something went wrong. Please try again." }]);
    } finally {
      setIsReplying(false); setLiveTrace([]); inputRef.current?.focus();
    }
  }

  function toggleTrace(i: number) {
    setMessages((prev) => prev.map((m, j) => j === i ? { ...m, traceOpen: !m.traceOpen } : m));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  if (!cfg || !ctx) return null;

  const agentReplies = messages.filter((m) => m.role === "agent").length;
  const toolCalls = agentCount * 3;

  return (
    <div className="h-screen flex overflow-hidden" style={{ background: C.chat }}>

      {/* ── Sidebar ── */}
      <div className="w-64 flex-shrink-0 flex flex-col overflow-hidden" style={{ background: C.sidebar, borderRight: `1px solid ${C.sidebarBorder}` }}>

        {/* Back */}
        <div className="px-4 pt-4 pb-3 flex-shrink-0" style={{ borderBottom: `1px solid ${C.sidebarBorder}` }}>
          <button onClick={() => router.push("/agent")} className="text-xs font-mono transition-colors" style={{ color: C.textMuted }}
            onMouseEnter={(e) => (e.currentTarget.style.color = C.textSub)}
            onMouseLeave={(e) => (e.currentTarget.style.color = C.textMuted)}>
            ← Agent config
          </button>
        </div>

        {/* Agent identity */}
        <div className="px-4 py-4 flex-shrink-0" style={{ borderBottom: `1px solid ${C.sidebarBorder}` }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold text-white"
              style={{ background: "linear-gradient(135deg,#312e81,#6366f1)", boxShadow: "0 0 16px rgba(99,102,241,0.3)" }}>
              {cfg.agentName[0]}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" style={{ boxShadow: "0 0 6px #34d399" }} />
                <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: "rgba(52,211,153,0.6)" }}>Live</span>
              </div>
              <p className="text-sm font-semibold truncate" style={{ color: C.text }}>{cfg.agentName}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1 mb-2">
            {cfg.personality.traits.slice(0, 3).map((t, i) => (
              <span key={i} className="text-[10px] px-2 py-0.5 rounded-full font-mono"
                style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.15)", color: "rgba(129,140,248,0.7)" }}>
                {t}
              </span>
            ))}
          </div>
          <p className="text-[11px] leading-relaxed" style={{ color: C.textMuted }}>{cfg.personality.style}</p>
        </div>

        {/* Simulating */}
        <div className="px-4 py-4 flex-shrink-0" style={{ borderBottom: `1px solid ${C.sidebarBorder}` }}>
          <p className="text-[10px] font-mono uppercase tracking-widest mb-2" style={{ color: C.textMuted }}>Simulating</p>
          <p className="text-xs font-semibold mb-1" style={{ color: C.textSub }}>
            {ctx.candidateProfile.seniorityLevel} {ctx.candidateProfile.jobTitle}
          </p>
          <p className="text-[11px] leading-relaxed line-clamp-2" style={{ color: C.textMuted }}>{ctx.candidateProfile.keySkills}</p>
        </div>

        {/* Sequence timeline */}
        <div className="px-4 py-4 flex-1 overflow-y-auto">
          <p className="text-[10px] font-mono uppercase tracking-widest mb-4" style={{ color: C.textMuted }}>Sequence</p>
          <div className="space-y-4">
            {cfg.messages.map((msg, i) => {
              const sent = i < agentReplies;
              const active = i === agentReplies - 1;
              return (
                <div key={i} className="relative pl-5">
                  {i < cfg.messages.length - 1 && (
                    <div className="absolute left-[5px] top-[10px] w-px" style={{ height: "calc(100% + 8px)", background: sent ? C.sidebarBorder : "#0d1020" }} />
                  )}
                  <div className="absolute left-0 top-1 w-2.5 h-2.5 rounded-full border transition-all duration-500"
                    style={active
                      ? { background: "#6366f1", borderColor: "#6366f1", boxShadow: "0 0 8px rgba(99,102,241,0.6)" }
                      : sent
                      ? { background: "rgba(99,102,241,0.3)", borderColor: "rgba(99,102,241,0.3)" }
                      : { background: "transparent", borderColor: "#1c2238" }} />
                  <p className="text-[10px] font-mono mb-0.5 uppercase tracking-wider"
                    style={{ color: active ? "#818cf8" : sent ? "#3a4560" : "#1c2238" }}>
                    {msg.label}
                  </p>
                  <p className="text-[10px] leading-relaxed line-clamp-2" style={{ color: "#252d45" }}>
                    {msg.content.slice(0, 55)}…
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stats */}
        <div className="px-4 py-3.5 flex-shrink-0" style={{ borderTop: `1px solid ${C.sidebarBorder}` }}>
          <div className="flex items-center justify-between">
            {[
              { val: agentReplies, label: "replies" },
              { val: toolCalls, label: "tool calls" },
            ].map(({ val, label }, i) => (
              <div key={i} className="text-center">
                <p className="text-base font-bold tabular-nums" style={{ color: C.text }}>{val}</p>
                <p className="text-[10px] font-mono" style={{ color: C.textMuted }}>{label}</p>
              </div>
            ))}
            <div className="w-px h-6" style={{ background: C.sidebarBorder }} />
            <div className="text-center">
              <p className="text-[11px] font-bold font-mono uppercase" style={{ color: "#818cf8" }}>{ctx.tone.slice(0, 4)}</p>
              <p className="text-[10px] font-mono" style={{ color: C.textMuted }}>tone</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Chat Panel ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between flex-shrink-0"
          style={{ background: C.sidebar, borderBottom: `1px solid ${C.sidebarBorder}` }}>
          <div>
            <p className="text-sm font-semibold" style={{ color: C.text }}>Conversation Sandbox</p>
            <p className="text-xs font-mono" style={{ color: C.textMuted }}>
              ReAct Agent · {Object.keys(TOOL_META).length} tools available
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-3">
              {Object.entries(TOOL_META).map(([, meta]) => (
                <div key={meta.label} className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: meta.dot }} />
                  <span className="text-[10px] font-mono" style={{ color: meta.color, opacity: 0.65 }}>{meta.label.split(" ")[0]}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" style={{ boxShadow: "0 0 6px #34d399" }} />
              <span className="text-xs font-mono" style={{ color: C.textMuted }}>Live</span>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-8 space-y-6">
          {messages.map((msg, i) => (
            <div key={i} className={`flex animate-fade-in ${msg.role === "candidate" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[78%] flex flex-col gap-2 ${msg.role === "candidate" ? "items-end" : "items-start"}`}>

                {/* Trace toggle */}
                {msg.role === "agent" && msg.trace && msg.trace.length > 0 && (
                  <div className="w-full">
                    <button onClick={() => toggleTrace(i)}
                      className="flex items-center gap-2 text-xs font-mono mb-1.5 transition-colors group"
                      style={{ color: C.textMuted }}>
                      <span style={{ color: msg.traceOpen ? "rgba(99,102,241,0.6)" : C.textMuted }}>
                        {msg.traceOpen ? "▼" : "►"}
                      </span>
                      <span>ReAct trace — {msg.trace.filter((s) => s.type === "action").length} tool call{msg.trace.filter((s) => s.type === "action").length !== 1 ? "s" : ""}</span>
                      <div className="flex gap-0.5 ml-1">
                        {msg.trace.filter((s) => s.type === "action").map((s, j) => {
                          const m = s.tool ? TOOL_META[s.tool] : null;
                          return m ? <span key={j} className="w-2 h-2 rounded-full inline-block" style={{ background: m.dot }} /> : null;
                        })}
                      </div>
                    </button>
                    {msg.traceOpen && (
                      <div className="mb-2.5 space-y-1.5">
                        {msg.trace.map((step, j) => <TraceStep key={j} step={step} />)}
                      </div>
                    )}
                  </div>
                )}

                {/* Bubble */}
                {msg.role === "agent" ? (
                  <div className="px-4 py-3.5 rounded-2xl rounded-tl-sm text-sm leading-relaxed"
                    style={{ background: C.card, border: `1px solid ${C.border}`, borderLeftColor: "rgba(99,102,241,0.35)", borderLeftWidth: 2, color: "#bcc5e0" }}>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                ) : (
                  <div className="px-4 py-3.5 rounded-2xl rounded-tr-sm text-sm leading-relaxed text-white"
                    style={{ background: "linear-gradient(135deg,#4f46e5,#6366f1)", boxShadow: "0 4px 16px rgba(99,102,241,0.25)" }}>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                )}

                <p className="text-[10px] font-mono px-1" style={{ color: C.textMuted }}>
                  {msg.role === "agent" ? cfg.agentName : "You (candidate)"}
                </p>
              </div>
            </div>
          ))}

          {/* Live trace */}
          {isReplying && (
            <div className="flex justify-start animate-fade-in">
              <div className="max-w-[78%] space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono mb-1.5" style={{ color: C.textMuted }}>
                  <span className="animate-pulse" style={{ color: "rgba(99,102,241,0.5)" }}>►</span>
                  <span className="animate-pulse">Agent reasoning</span>
                  <span className="cursor-blink" />
                </div>
                {liveTrace.length === 0 ? (
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg"
                    style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.1)" }}>
                    <span className="text-xs animate-pulse" style={{ color: "rgba(99,102,241,0.5)" }}>Thinking…</span>
                    <span className="cursor-blink" />
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {liveTrace.map((step, i) => <TraceStep key={i} step={step} />)}
                  </div>
                )}
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div className="px-6 py-4 flex-shrink-0" style={{ background: C.sidebar, borderTop: `1px solid ${C.sidebarBorder}` }}>
          <div className="flex gap-3 items-end">
            <textarea
              ref={inputRef}
              rows={1}
              placeholder="Reply as the candidate…"
              className="flex-1 text-sm resize-none focus:outline-none transition-all duration-150 min-h-[46px] max-h-32 rounded-xl px-4 py-3"
              style={{
                background: C.card, border: `1px solid ${C.border}`,
                color: C.text, caretColor: "#818cf8",
              }}
              value={input}
              onChange={(e) => { setInput(e.target.value); e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 128) + "px"; }}
              onKeyDown={handleKeyDown}
              onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(99,102,241,0.5)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = C.border)}
              disabled={isReplying}
            />
            <button
              onClick={handleSend}
              disabled={isReplying || !input.trim()}
              className="px-5 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-150 active:scale-[0.97] whitespace-nowrap flex-shrink-0 disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ background: "linear-gradient(135deg,#4f46e5,#6366f1)", boxShadow: input.trim() && !isReplying ? "0 4px 16px rgba(99,102,241,0.3)" : "none" }}
            >
              {isReplying ? (
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-indigo-300/30 border-t-indigo-300 animate-spin inline-block" />
                  <span>Thinking</span>
                </span>
              ) : "Send"}
            </button>
          </div>
          <p className="text-[10px] font-mono text-center mt-2" style={{ color: "#1c2440" }}>
            Enter to send · Shift+Enter for newline
          </p>
        </div>
      </div>
    </div>
  );
}
