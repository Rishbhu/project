"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface AgentConfig {
  agentName: string;
  personality: { traits: string[]; style: string; avoid: string[] };
  messages: Array<{ label: string; content: string }>;
}

interface CompanyContext {
  companyName: string;
  whatTheyDo: string;
  culture: string;
  candidateProfile: { jobTitle: string; seniorityLevel: string; keySkills: string };
  tone: string;
}

interface ReActStep {
  type: "thought" | "action" | "observation";
  content?: string;
  tool?: string;
  input?: Record<string, unknown>;
  result?: Record<string, unknown>;
}

interface ChatMessage {
  role: "agent" | "candidate";
  content: string;
  trace?: ReActStep[];
  traceOpen?: boolean;
}

const TOOL_META: Record<string, { label: string; color: string; bg: string; border: string; dot: string; leftBorder: string }> = {
  analyze_candidate_signal: {
    label: "Signal Analysis",
    color: "text-violet-400",
    bg: "bg-violet-500/5",
    border: "border-violet-500/15",
    dot: "bg-violet-400",
    leftBorder: "border-l-violet-500/50",
  },
  search_candidate_profile: {
    label: "Profile Synthesis",
    color: "text-blue-400",
    bg: "bg-blue-500/5",
    border: "border-blue-500/15",
    dot: "bg-blue-400",
    leftBorder: "border-l-blue-500/50",
  },
  get_role_market_insights: {
    label: "Market Intelligence",
    color: "text-emerald-400",
    bg: "bg-emerald-500/5",
    border: "border-emerald-500/15",
    dot: "bg-emerald-400",
    leftBorder: "border-l-emerald-500/50",
  },
  get_company_talking_points: {
    label: "Talking Points",
    color: "text-amber-400",
    bg: "bg-amber-500/5",
    border: "border-amber-500/15",
    dot: "bg-amber-400",
    leftBorder: "border-l-amber-500/50",
  },
};

function TraceStep({ step }: { step: ReActStep }) {
  const [open, setOpen] = useState(false);
  const meta = step.tool ? TOOL_META[step.tool] : null;

  if (step.type === "thought") {
    return (
      <div className="py-2.5 px-3 bg-[#080808] rounded-lg border border-[#141414] animate-slide-up">
        <p className="text-[10px] font-mono text-[#333333] mb-1.5 uppercase tracking-widest">Reasoning</p>
        <p className="text-xs font-mono text-[#555555] leading-relaxed">{step.content}</p>
      </div>
    );
  }

  if (step.type === "action" && meta) {
    const keyInputs = Object.entries(step.input || {})
      .filter(([k]) => !["role", "seniority"].includes(k))
      .slice(0, 3);

    return (
      <div className={`${meta.bg} border ${meta.border} border-l-2 ${meta.leftBorder} rounded-lg px-3 py-2.5 animate-slide-up`}>
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full ${meta.dot} flex-shrink-0`} />
          <span className={`text-xs font-mono font-semibold ${meta.color}`}>{meta.label}</span>
          <span className="text-xs font-mono text-[#2a2a2a]">— called</span>
        </div>
        {keyInputs.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
            {keyInputs.map(([k, v]) => (
              <span key={k} className="text-[10px] font-mono text-[#333333]">
                {k}:{" "}
                <span className="text-[#555555]">{String(v).slice(0, 60)}</span>
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (step.type === "observation" && meta) {
    const summaryKeys = Object.keys(step.result || {}).slice(0, 3);
    return (
      <div className="border border-[#141414] rounded-lg overflow-hidden animate-slide-up">
        <button
          onClick={() => setOpen(!open)}
          className="w-full flex items-center justify-between px-3 py-2 hover:bg-[#0a0a0a] transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-[#2a2a2a]">└</span>
            <span className={`text-xs font-mono font-medium ${meta.color}`}>✓ {meta.label}</span>
            {summaryKeys.length > 0 && (
              <span className="text-[10px] font-mono text-[#2a2a2a]">
                {summaryKeys.join(", ")}
              </span>
            )}
          </div>
          <span className="text-xs font-mono text-[#2a2a2a]">{open ? "−" : "+"}</span>
        </button>
        {open && (
          <div className="px-3 pb-3 border-t border-[#141414]">
            <pre className="mt-2 text-[10px] font-mono text-[#3b3b3b] leading-relaxed whitespace-pre-wrap overflow-x-auto">
              {JSON.stringify(step.result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    );
  }

  return null;
}

function LiveTraceBlock({ steps, isReplying }: { steps: ReActStep[]; isReplying: boolean }) {
  if (steps.length === 0 && isReplying) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-[#080808] border border-[#141414] rounded-lg">
        <span className="text-[#3b82f6]/40 animate-pulse text-xs font-mono">►</span>
        <span className="text-xs font-mono text-[#333333] animate-pulse">Thinking...</span>
        <span className="cursor-blink" />
      </div>
    );
  }
  return (
    <div className="space-y-1.5">
      {steps.map((step, i) => (
        <TraceStep key={i} step={step} />
      ))}
    </div>
  );
}

export default function SandboxPage() {
  const router = useRouter();
  const [companyContext, setCompanyContext] = useState<CompanyContext | null>(null);
  const [agentConfig, setAgentConfig] = useState<AgentConfig | null>(null);
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
    if (!ctxRaw || !cfgRaw) {
      router.push("/");
      return;
    }
    const ctx: CompanyContext = JSON.parse(ctxRaw);
    const cfg: AgentConfig = JSON.parse(cfgRaw);
    setCompanyContext(ctx);
    setAgentConfig(cfg);
    setMessages([{ role: "agent", content: cfg.messages[0].content, trace: [], traceOpen: false }]);
  }, [router]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, liveTrace]);

  async function handleSend() {
    if (!input.trim() || isReplying || !agentConfig || !companyContext) return;

    const candidateMsg = input.trim();
    setInput("");
    setIsReplying(true);
    setLiveTrace([]);

    const updatedMessages: ChatMessage[] = [
      ...messages,
      { role: "candidate", content: candidateMsg },
    ];
    setMessages(updatedMessages);

    const history = updatedMessages.map((m) => ({
      role: m.role === "agent" ? "assistant" : "user",
      content: m.content,
    }));

    try {
      const res = await fetch("/api/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationHistory: history, agentConfig, companyContext }),
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

            if (data.type === "thought") {
              currentTrace.push({ type: "thought", content: data.content });
              setLiveTrace([...currentTrace]);
            } else if (data.type === "action") {
              currentTrace.push({ type: "action", tool: data.tool, input: data.input });
              setLiveTrace([...currentTrace]);
            } else if (data.type === "observation") {
              currentTrace.push({ type: "observation", tool: data.tool, result: data.result });
              setLiveTrace([...currentTrace]);
            } else if (data.type === "reply" && data.done) {
              finalReply = data.content;
            } else if (data.type === "error") {
              finalReply = "Something went wrong. Please try again.";
            }
          } catch {
            // partial JSON line
          }
        }
      }

      const newAgentMsgIndex = messages.length + 1; // after candidate msg
      setMessages((prev) => [
        ...prev,
        {
          role: "agent",
          content: finalReply,
          trace: currentTrace,
          // open trace by default for first 2 agent replies that have a trace
          traceOpen: newAgentMsgIndex <= 3 && currentTrace.length > 0,
        },
      ]);
      setAgentCount((c) => c + 1);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { role: "agent", content: "Something went wrong. Please try again." },
      ]);
    } finally {
      setIsReplying(false);
      setLiveTrace([]);
      inputRef.current?.focus();
    }
  }

  function toggleTrace(index: number) {
    setMessages((prev) =>
      prev.map((m, i) => (i === index ? { ...m, traceOpen: !m.traceOpen } : m))
    );
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  if (!agentConfig || !companyContext) return null;

  const agentReplies = messages.filter((m) => m.role === "agent").length;
  const toolCallCount = agentCount * 2 + agentCount;

  return (
    <div
      className="h-screen flex overflow-hidden"
      style={{ background: "#050505" }}
    >
      {/* Left Sidebar */}
      <div
        className="w-64 flex-shrink-0 flex flex-col overflow-hidden border-r border-[#141414]"
        style={{ background: "#080808" }}
      >
        {/* Back button */}
        <div className="px-4 pt-4 pb-3 border-b border-[#141414] flex-shrink-0">
          <button
            onClick={() => router.push("/agent")}
            className="text-xs font-mono text-[#333333] hover:text-[#666666] transition-colors"
          >
            ← Agent config
          </button>
        </div>

        {/* Agent identity */}
        <div className="px-4 py-4 border-b border-[#141414] flex-shrink-0">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold text-white"
              style={{
                background: "linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)",
                boxShadow: "0 0 12px rgba(59,130,246,0.2)",
              }}
            >
              {agentConfig.agentName[0]}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
                <span className="text-xs font-mono text-emerald-500/70 uppercase tracking-wider">Live</span>
              </div>
              <p className="text-sm font-semibold text-white truncate">{agentConfig.agentName}</p>
            </div>
          </div>

          <p className="text-[10px] font-mono text-[#333333] uppercase tracking-widest mb-2">Agent</p>
          <div className="flex flex-wrap gap-1 mb-2">
            {agentConfig.personality.traits.slice(0, 3).map((t, i) => (
              <span key={i} className="text-[10px] px-2 py-0.5 bg-[#111111] border border-[#1c1c1c] rounded-full text-[#666666] font-mono">
                {t}
              </span>
            ))}
          </div>
          <p className="text-[10px] text-[#444444] leading-relaxed font-mono">{agentConfig.personality.style}</p>
        </div>

        {/* Simulating */}
        <div className="px-4 py-4 border-b border-[#141414] flex-shrink-0">
          <p className="text-[10px] font-mono text-[#333333] uppercase tracking-widest mb-2">Simulating</p>
          <p className="text-xs text-[#888888] font-semibold mb-1">
            {companyContext.candidateProfile.seniorityLevel} {companyContext.candidateProfile.jobTitle}
          </p>
          <p className="text-[10px] text-[#444444] leading-relaxed font-mono line-clamp-2">
            {companyContext.candidateProfile.keySkills}
          </p>
        </div>

        {/* Sequence timeline */}
        <div className="px-4 py-4 flex-1 overflow-y-auto">
          <p className="text-[10px] font-mono text-[#333333] uppercase tracking-widest mb-3">Sequence</p>
          <div className="space-y-3">
            {agentConfig.messages.map((msg, i) => {
              const sent = i < agentReplies;
              const active = i === agentReplies - 1;
              return (
                <div key={i} className="relative pl-5">
                  {/* Connector line */}
                  {i < agentConfig.messages.length - 1 && (
                    <div
                      className="absolute left-[5px] top-[10px] w-px h-full"
                      style={{ background: sent ? "#1c1c1c" : "#111111" }}
                    />
                  )}
                  <div
                    className={`absolute left-0 top-1 w-2.5 h-2.5 rounded-full border transition-all duration-500 ${
                      active
                        ? "bg-[#3b82f6] border-[#3b82f6] shadow-sm"
                        : sent
                        ? "bg-[#3b82f6]/30 border-[#3b82f6]/30"
                        : "bg-transparent border-[#1e1e1e]"
                    }`}
                    style={active ? { boxShadow: "0 0 6px rgba(59,130,246,0.4)" } : {}}
                  />
                  <p className={`text-[10px] font-mono mb-0.5 uppercase tracking-wider ${active ? "text-[#3b82f6]" : sent ? "text-[#444444]" : "text-[#222222]"}`}>
                    {msg.label}
                  </p>
                  <p className="text-[10px] text-[#2a2a2a] leading-relaxed line-clamp-2 font-mono">
                    {msg.content.slice(0, 50)}...
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stats */}
        <div className="px-4 py-3 border-t border-[#141414] flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="text-center">
              <p className="text-sm font-bold text-white tabular-nums">{agentReplies}</p>
              <p className="text-[10px] font-mono text-[#333333]">replies</p>
            </div>
            <div className="w-px h-6 bg-[#141414]" />
            <div className="text-center">
              <p className="text-sm font-bold text-white tabular-nums">{toolCallCount}</p>
              <p className="text-[10px] font-mono text-[#333333]">tool calls</p>
            </div>
            <div className="w-px h-6 bg-[#141414]" />
            <div className="text-center">
              <p className="text-[10px] font-bold text-[#3b82f6] font-mono uppercase">{companyContext.tone.slice(0, 4)}</p>
              <p className="text-[10px] font-mono text-[#333333]">tone</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Chat Panel */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat header */}
        <div
          className="px-6 py-4 border-b border-[#141414] flex items-center justify-between flex-shrink-0"
          style={{ background: "#080808" }}
        >
          <div>
            <p className="text-sm font-semibold text-white">Conversation Sandbox</p>
            <p className="text-xs font-mono text-[#444444]">
              ReAct Agent · {Object.keys(TOOL_META).length} tools
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* Tool color legend */}
            <div className="hidden md:flex items-center gap-3">
              {Object.entries(TOOL_META).map(([, meta]) => (
                <div key={meta.label} className="flex items-center gap-1">
                  <div className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                  <span className={`text-[10px] font-mono ${meta.color} opacity-60`}>{meta.label.split(" ")[0]}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-mono text-[#444444]">Live</span>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex animate-fade-in ${msg.role === "candidate" ? "justify-end" : "justify-start"}`}
            >
              <div className={`max-w-[75%] flex flex-col gap-2 ${msg.role === "candidate" ? "items-end" : "items-start"}`}>

                {/* ReAct trace for agent messages */}
                {msg.role === "agent" && msg.trace && msg.trace.length > 0 && (
                  <div className="w-full">
                    <button
                      onClick={() => toggleTrace(i)}
                      className="flex items-center gap-2 text-xs font-mono text-[#2a2a2a] hover:text-[#555555] transition-colors mb-1.5 group"
                    >
                      <span className={`transition-colors ${msg.traceOpen ? "text-[#3b82f6]/60" : "text-[#2a2a2a] group-hover:text-[#3b82f6]/40"}`}>
                        {msg.traceOpen ? "▼" : "►"}
                      </span>
                      <span>
                        ReAct trace — {msg.trace.filter((s) => s.type === "action").length} tool call
                        {msg.trace.filter((s) => s.type === "action").length !== 1 ? "s" : ""}
                      </span>
                      <div className="flex gap-0.5 ml-1">
                        {msg.trace
                          .filter((s) => s.type === "action")
                          .map((s, j) => {
                            const m = s.tool ? TOOL_META[s.tool] : null;
                            return m ? (
                              <div key={j} className={`w-2 h-2 rounded-full ${m.dot}`} />
                            ) : null;
                          })}
                      </div>
                    </button>
                    {msg.traceOpen && (
                      <div className="mb-2 space-y-1.5">
                        {msg.trace.map((step, j) => (
                          <TraceStep key={j} step={step} />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Message bubble */}
                <div
                  className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    msg.role === "agent"
                      ? "bg-[#0d0d0d] border border-[#1c1c1c] text-[#c8c8c8] rounded-tl-sm"
                      : "bg-[#3b82f6] text-white rounded-tr-sm"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>

                <p className="text-[10px] font-mono text-[#2a2a2a] px-1">
                  {msg.role === "agent" ? agentConfig.agentName : "You (candidate)"}
                </p>
              </div>
            </div>
          ))}

          {/* Live trace while streaming */}
          {isReplying && (
            <div className="flex justify-start animate-fade-in">
              <div className="max-w-[75%] space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono text-[#333333] mb-1.5">
                  <span className="text-[#3b82f6]/50 animate-pulse">►</span>
                  <span className="animate-pulse">Agent reasoning</span>
                  <span className="cursor-blink" />
                </div>
                <LiveTraceBlock steps={liveTrace} isReplying={isReplying} />
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input area */}
        <div
          className="px-6 py-4 border-t border-[#141414] flex-shrink-0"
          style={{ background: "#080808" }}
        >
          <div className="flex gap-3 items-end">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                rows={1}
                placeholder="Reply as the candidate..."
                className="w-full bg-[#0d0d0d] border border-[#1c1c1c] rounded-xl px-4 py-3 text-sm text-[#e0e0e0] placeholder-[#333333] focus:outline-none focus:border-[#3b82f6]/50 focus:ring-1 focus:ring-[#3b82f6]/20 resize-none transition-all duration-150 min-h-[46px] max-h-32 font-mono"
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = Math.min(e.target.scrollHeight, 128) + "px";
                }}
                onKeyDown={handleKeyDown}
                disabled={isReplying}
              />
            </div>
            <button
              onClick={handleSend}
              disabled={isReplying || !input.trim()}
              className="px-4 py-3 bg-[#3b82f6] hover:bg-[#2563eb] disabled:bg-[#111111] disabled:text-[#2a2a2a] disabled:cursor-not-allowed text-white rounded-xl text-sm font-medium transition-all duration-150 active:scale-[0.97] whitespace-nowrap flex-shrink-0"
            >
              {isReplying ? (
                <span className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full border border-[#3b3b3b] border-t-[#9ca3af] animate-spin" />
                  <span className="text-[#666666]">Thinking</span>
                </span>
              ) : (
                "Send"
              )}
            </button>
          </div>
          <p className="text-[10px] font-mono text-[#2a2a2a] mt-2 text-center">
            Enter to send · Shift+Enter for newline
          </p>
        </div>
      </div>
    </div>
  );
}
