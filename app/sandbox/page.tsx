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

const TOOL_META: Record<string, { label: string; color: string; bg: string; border: string; dot: string }> = {
  analyze_candidate_signal: {
    label: "Signal Analysis",
    color: "text-violet-400",
    bg: "bg-violet-500/5",
    border: "border-violet-500/15",
    dot: "bg-violet-400",
  },
  search_candidate_profile: {
    label: "Profile Synthesis",
    color: "text-blue-400",
    bg: "bg-blue-500/5",
    border: "border-blue-500/15",
    dot: "bg-blue-400",
  },
  get_role_market_insights: {
    label: "Market Intelligence",
    color: "text-emerald-400",
    bg: "bg-emerald-500/5",
    border: "border-emerald-500/15",
    dot: "bg-emerald-400",
  },
  get_company_talking_points: {
    label: "Talking Points",
    color: "text-amber-400",
    bg: "bg-amber-500/5",
    border: "border-amber-500/15",
    dot: "bg-amber-400",
  },
};

function TraceStep({ step, index }: { step: ReActStep; index: number }) {
  const [open, setOpen] = useState(false);
  const meta = step.tool ? TOOL_META[step.tool] : null;

  if (step.type === "thought") {
    return (
      <div className="py-2 px-3 bg-[#0d0d0d] rounded-lg border border-[#161616]">
        <p className="text-xs font-mono text-[#3b3b3b] mb-1 uppercase tracking-wider">Reasoning</p>
        <p className="text-xs font-mono text-[#4b5563] leading-relaxed">{step.content}</p>
      </div>
    );
  }

  if (step.type === "action" && meta) {
    const keyInputs = Object.entries(step.input || {})
      .filter(([k]) => !["role", "seniority"].includes(k))
      .slice(0, 3);

    return (
      <div className={`${meta.bg} border ${meta.border} rounded-lg px-3 py-2`}>
        <div className="flex items-center gap-2">
          <div className={`w-1 h-1 rounded-full ${meta.dot}`} />
          <span className={`text-xs font-mono font-medium ${meta.color}`}>{meta.label}</span>
          <span className="text-xs font-mono text-[#2a2a2a]">→ called</span>
        </div>
        {keyInputs.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {keyInputs.map(([k, v]) => (
              <span key={k} className="text-xs font-mono text-[#3b3b3b]">
                {k}: <span className="text-[#4b5563]">{String(v)}</span>
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
      <div className="border border-[#1a1a1a] rounded-lg overflow-hidden">
        <button
          onClick={() => setOpen(!open)}
          className="w-full flex items-center justify-between px-3 py-2 hover:bg-[#0f0f0f] transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-[#2a2a2a]">└</span>
            <span className={`text-xs font-mono ${meta.color}`}>✓ {meta.label}</span>
            <span className="text-xs font-mono text-[#2a2a2a]">
              {summaryKeys.join(", ")}
            </span>
          </div>
          <span className="text-xs font-mono text-[#2a2a2a]">
            {open ? "−" : "+"}
          </span>
        </button>
        {open && (
          <div className="px-3 pb-3 border-t border-[#161616]">
            <pre className="mt-2 text-xs font-mono text-[#3b3b3b] leading-relaxed whitespace-pre-wrap overflow-x-auto">
              {JSON.stringify(step.result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    );
  }

  return null;
}

function LiveTraceBlock({ steps }: { steps: ReActStep[] }) {
  if (steps.length === 0) return null;
  return (
    <div className="space-y-1.5">
      {steps.map((step, i) => (
        <div key={i} className="animate-fade-in">
          <TraceStep step={step} index={i} />
        </div>
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

      setMessages((prev) => [
        ...prev,
        {
          role: "agent",
          content: finalReply,
          trace: currentTrace,
          traceOpen: false,
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

  return (
    <div className="h-screen flex flex-col md:flex-row overflow-hidden bg-[#0a0a0a]">
      {/* Left Panel */}
      <div className="w-full md:w-72 lg:w-80 bg-[#0d0d0d] border-b md:border-b-0 md:border-r border-[#161616] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#161616] flex-shrink-0">
          <button
            onClick={() => router.push("/agent")}
            className="text-xs text-[#2a2a2a] hover:text-[#4b5563] transition-colors mb-4 block"
          >
            ← Agent config
          </button>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#3b82f6]/10 border border-[#3b82f6]/20 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-[#3b82f6]">
                {agentConfig.agentName[0]}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <div className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                <p className="text-sm font-medium text-white">{agentConfig.agentName}</p>
              </div>
              <p className="text-xs text-[#3b3b3b]">{companyContext.companyName}</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="px-5 py-3 border-b border-[#161616] flex-shrink-0">
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center">
              <p className="text-base font-bold text-white">{agentReplies}</p>
              <p className="text-xs text-[#3b3b3b]">Replies</p>
            </div>
            <div className="text-center">
              <p className="text-base font-bold text-white">{agentCount * 2 + agentCount}</p>
              <p className="text-xs text-[#3b3b3b]">Tool calls</p>
            </div>
            <div className="text-center">
              <p className="text-base font-bold text-[#3b82f6]">{companyContext.tone[0]}</p>
              <p className="text-xs text-[#3b3b3b]">Tone</p>
            </div>
          </div>
        </div>

        {/* Candidate Profile */}
        <div className="px-5 py-4 border-b border-[#161616] flex-shrink-0">
          <p className="text-xs text-[#2a2a2a] uppercase tracking-wider mb-3">Simulating</p>
          <div className="space-y-2">
            <p className="text-xs text-[#6b7280] font-medium">
              {companyContext.candidateProfile.seniorityLevel} {companyContext.candidateProfile.jobTitle}
            </p>
            <p className="text-xs text-[#3b3b3b] leading-relaxed">
              {companyContext.candidateProfile.keySkills}
            </p>
          </div>
        </div>

        {/* Sequence tracker */}
        <div className="px-5 py-4 flex-1 overflow-y-auto">
          <p className="text-xs text-[#2a2a2a] uppercase tracking-wider mb-3">Sequence</p>
          <div className="space-y-3">
            {agentConfig.messages.map((msg, i) => {
              const sent = i < agentReplies;
              const active = i === agentReplies - 1;
              return (
                <div key={i} className="relative pl-4">
                  <div
                    className={`absolute left-0 top-1.5 w-1.5 h-1.5 rounded-full transition-all duration-500 ${
                      active
                        ? "bg-[#3b82f6] shadow-sm shadow-[#3b82f6]/50"
                        : sent
                        ? "bg-[#3b82f6]/40"
                        : "bg-[#1e1e1e]"
                    }`}
                  />
                  <p
                    className={`text-xs font-medium mb-0.5 ${
                      active ? "text-[#3b82f6]" : sent ? "text-[#3b3b3b]" : "text-[#222222]"
                    }`}
                  >
                    {msg.label}
                  </p>
                  <p className="text-xs text-[#2a2a2a] line-clamp-2 leading-relaxed">
                    {msg.content.slice(0, 60)}...
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Chat header */}
        <div className="px-6 py-4 border-b border-[#161616] flex items-center justify-between flex-shrink-0">
          <div>
            <p className="text-sm font-medium text-white">Conversation Sandbox</p>
            <p className="text-xs text-[#3b3b3b]">
              ReAct agent · {TOOL_META ? Object.keys(TOOL_META).length : 4} tools active
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-[#3b3b3b]">Live</span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
          {messages.map((msg, i) => (
            <div key={i} className={`flex animate-fade-in ${msg.role === "candidate" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[78%] flex flex-col gap-2 ${msg.role === "candidate" ? "items-end" : "items-start"}`}>
                {/* ReAct trace toggle */}
                {msg.role === "agent" && msg.trace && msg.trace.length > 0 && (
                  <div className="w-full">
                    <button
                      onClick={() => toggleTrace(i)}
                      className="flex items-center gap-2 text-xs font-mono text-[#2a2a2a] hover:text-[#4b5563] transition-colors mb-1 group"
                    >
                      <span className="text-[#3b82f6]/40 group-hover:text-[#3b82f6]/70 transition-colors">
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
                              <div key={j} className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
                            ) : null;
                          })}
                      </div>
                    </button>
                    {msg.traceOpen && (
                      <div className="mb-2 space-y-1.5 animate-fade-in">
                        {msg.trace.map((step, j) => (
                          <TraceStep key={j} step={step} index={j} />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Message bubble */}
                <div
                  className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    msg.role === "agent"
                      ? "bg-[#111111] border border-[#1e1e1e] text-[#c9d1d9] rounded-tl-sm"
                      : "bg-[#3b82f6] text-white rounded-tr-sm"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>

                <p className="text-xs text-[#2a2a2a] px-1">
                  {msg.role === "agent" ? agentConfig.agentName : "Candidate"}
                </p>
              </div>
            </div>
          ))}

          {/* Live ReAct trace while streaming */}
          {isReplying && (
            <div className="flex justify-start animate-fade-in">
              <div className="max-w-[78%] space-y-2">
                {liveTrace.length > 0 ? (
                  <div>
                    <div className="flex items-center gap-2 text-xs font-mono text-[#2a2a2a] mb-2">
                      <span className="text-[#3b82f6]/40 animate-pulse">►</span>
                      <span>Agent reasoning...</span>
                    </div>
                    <LiveTraceBlock steps={liveTrace} />
                  </div>
                ) : (
                  <div className="bg-[#111111] border border-[#1e1e1e] rounded-2xl rounded-tl-sm px-4 py-3">
                    <div className="flex gap-1 items-center h-4">
                      {[0, 150, 300].map((delay) => (
                        <div
                          key={delay}
                          className="w-1.5 h-1.5 rounded-full bg-[#2a2a2a] animate-bounce"
                          style={{ animationDelay: `${delay}ms` }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div className="px-6 py-4 border-t border-[#161616] flex-shrink-0">
          <div className="flex gap-3 items-end">
            <textarea
              ref={inputRef}
              rows={1}
              placeholder="Simulate a candidate reply... (Enter to send, Shift+Enter for new line)"
              className="flex-1 bg-[#111111] border border-[#1e1e1e] rounded-xl px-4 py-3 text-sm text-[#ededed] placeholder-[#2a2a2a] focus:outline-none focus:border-[#3b82f6]/50 focus:ring-1 focus:ring-[#3b82f6]/20 resize-none transition-all duration-200 min-h-[46px] max-h-32"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 128) + "px";
              }}
              onKeyDown={handleKeyDown}
              disabled={isReplying}
            />
            <button
              onClick={handleSend}
              disabled={isReplying || !input.trim()}
              className="px-4 py-3 bg-[#3b82f6] hover:bg-[#2563eb] disabled:bg-[#141414] disabled:text-[#2a2a2a] disabled:cursor-not-allowed text-white rounded-xl text-sm font-medium transition-all duration-200 active:scale-[0.97] whitespace-nowrap"
            >
              {isReplying ? (
                <span className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full border border-[#3b3b3b] border-t-[#6b7280] animate-spin" />
                  Thinking
                </span>
              ) : (
                "Send"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
