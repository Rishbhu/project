"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface AgentConfig {
  agentName: string;
  personality: {
    traits: string[];
    style: string;
    avoid: string[];
  };
  reasoning: string;
  messages: Array<{ label: string; content: string }>;
}

interface CompanyContext {
  companyName: string;
  whatTheyDo: string;
  culture: string;
  candidateProfile: {
    jobTitle: string;
    seniorityLevel: string;
    keySkills: string;
  };
  tone: string;
}

interface ChatMessage {
  role: "agent" | "candidate";
  content: string;
  thinking?: string;
  thinkingOpen?: boolean;
  streaming?: boolean;
}

export default function SandboxPage() {
  const router = useRouter();
  const [companyContext, setCompanyContext] = useState<CompanyContext | null>(null);
  const [agentConfig, setAgentConfig] = useState<AgentConfig | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const [streamingThinking, setStreamingThinking] = useState("");
  const [streamingReply, setStreamingReply] = useState("");
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
    setMessages([
      {
        role: "agent",
        content: cfg.messages[0].content,
        thinking: undefined,
        thinkingOpen: false,
      },
    ]);
  }, [router]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingThinking, streamingReply]);

  async function handleSend() {
    if (!input.trim() || isReplying || !agentConfig || !companyContext) return;

    const candidateMsg = input.trim();
    setInput("");
    setIsReplying(true);
    setStreamingThinking("");
    setStreamingReply("");

    setMessages((prev) => [...prev, { role: "candidate", content: candidateMsg }]);

    // Build conversation history for API
    const history = [
      ...messages.map((m) => ({
        role: m.role === "agent" ? "assistant" : "user",
        content: m.content,
      })),
      { role: "user", content: candidateMsg },
    ];

    try {
      const res = await fetch("/api/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationHistory: history,
          agentConfig,
          companyContext,
        }),
      });

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let finalResult: { thinking: string; reply: string } | null = null;
      let accumulated = "";

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
            if (data.error) throw new Error(data.error);
            if (data.done && data.result) {
              finalResult = data.result;
            } else if (data.chunk) {
              accumulated += data.chunk;
              // Try to extract thinking/reply from partial JSON for progressive display
              const thinkingMatch = accumulated.match(/"thinking"\s*:\s*"((?:[^"\\]|\\.)*)"/);
              const replyMatch = accumulated.match(/"reply"\s*:\s*"((?:[^"\\]|\\.)*)"/);
              if (thinkingMatch) {
                setStreamingThinking(thinkingMatch[1].replace(/\\n/g, "\n").replace(/\\"/g, '"'));
              }
              if (replyMatch) {
                setStreamingReply(replyMatch[1].replace(/\\n/g, "\n").replace(/\\"/g, '"'));
              }
            }
          } catch {
            // partial JSON — continue accumulating
          }
        }
      }

      if (finalResult) {
        setMessages((prev) => [
          ...prev,
          {
            role: "agent",
            content: finalResult!.reply,
            thinking: finalResult!.thinking,
            thinkingOpen: false,
          },
        ]);
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          role: "agent",
          content: "Something went wrong. Please try again.",
        },
      ]);
    } finally {
      setIsReplying(false);
      setStreamingThinking("");
      setStreamingReply("");
      inputRef.current?.focus();
    }
  }

  function toggleThinking(index: number) {
    setMessages((prev) =>
      prev.map((m, i) =>
        i === index ? { ...m, thinkingOpen: !m.thinkingOpen } : m
      )
    );
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  if (!agentConfig || !companyContext) return null;

  return (
    <div className="h-screen flex flex-col md:flex-row overflow-hidden">
      {/* Left Panel */}
      <div className="w-full md:w-80 lg:w-96 bg-[#0d0d0d] border-b md:border-b-0 md:border-r border-[#1a1a1a] flex flex-col overflow-y-auto md:overflow-hidden">
        <div className="p-5 border-b border-[#1a1a1a]">
          <button
            onClick={() => router.push("/agent")}
            className="text-xs text-[#4b5563] hover:text-[#6b7280] transition-colors mb-5 block"
          >
            ← Back to agent
          </button>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider">
              Live Simulation
            </span>
          </div>
          <h2 className="text-lg font-bold text-white">{agentConfig.agentName}</h2>
          <p className="text-xs text-[#4b5563] mt-0.5">for {companyContext.companyName}</p>
        </div>

        {/* Agent Identity */}
        <div className="p-5 border-b border-[#1a1a1a]">
          <p className="text-xs text-[#3b3b3b] uppercase tracking-wider mb-3">Agent profile</p>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {agentConfig.personality.traits.map((t, i) => (
              <span
                key={i}
                className="text-xs px-2 py-0.5 bg-[#111111] border border-[#2a2a2a] rounded-full text-[#6b7280]"
              >
                {t}
              </span>
            ))}
          </div>
          <p className="text-xs text-[#4b5563] leading-relaxed">
            {agentConfig.personality.style}
          </p>
        </div>

        {/* Candidate Profile */}
        <div className="p-5 border-b border-[#1a1a1a]">
          <p className="text-xs text-[#3b3b3b] uppercase tracking-wider mb-3">Candidate profile</p>
          <div className="space-y-1.5">
            <p className="text-xs">
              <span className="text-[#3b3b3b]">Role: </span>
              <span className="text-[#6b7280]">{companyContext.candidateProfile.jobTitle}</span>
            </p>
            <p className="text-xs">
              <span className="text-[#3b3b3b]">Level: </span>
              <span className="text-[#6b7280]">{companyContext.candidateProfile.seniorityLevel}</span>
            </p>
            <p className="text-xs">
              <span className="text-[#3b3b3b]">Skills: </span>
              <span className="text-[#6b7280]">{companyContext.candidateProfile.keySkills}</span>
            </p>
          </div>
        </div>

        {/* Message Sequence */}
        <div className="p-5 flex-1 overflow-y-auto">
          <p className="text-xs text-[#3b3b3b] uppercase tracking-wider mb-3">Sequence</p>
          <div className="space-y-3">
            {agentConfig.messages.map((msg, i) => {
              const sent = i === 0 || messages.filter((m) => m.role === "agent").length > i;
              return (
                <div key={i} className="relative pl-4">
                  <div
                    className={`absolute left-0 top-1.5 w-1.5 h-1.5 rounded-full transition-colors ${sent ? "bg-[#3b82f6]" : "bg-[#2a2a2a]"}`}
                  />
                  <p className={`text-xs font-medium mb-0.5 ${sent ? "text-[#3b82f6]" : "text-[#3b3b3b]"}`}>
                    {msg.label}
                  </p>
                  <p className="text-xs text-[#3b3b3b] line-clamp-2 leading-relaxed">
                    {msg.content.slice(0, 80)}...
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Panel - Chat */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Chat header */}
        <div className="px-6 py-4 border-b border-[#1a1a1a] flex items-center justify-between flex-shrink-0">
          <div>
            <p className="text-sm font-medium text-white">Conversation</p>
            <p className="text-xs text-[#4b5563]">
              Simulating a {companyContext.candidateProfile.jobTitle}
            </p>
          </div>
          <span className="text-xs font-mono text-[#3b82f6] bg-[#3b82f6]/10 px-2.5 py-1 rounded-full">
            {companyContext.tone}
          </span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex animate-fade-in ${msg.role === "candidate" ? "justify-end" : "justify-start"}`}
            >
              <div className={`max-w-[80%] space-y-2 ${msg.role === "candidate" ? "items-end" : "items-start"} flex flex-col`}>
                {/* Thinking block */}
                {msg.role === "agent" && msg.thinking && (
                  <div className="w-full">
                    <button
                      onClick={() => toggleThinking(i)}
                      className="flex items-center gap-2 text-xs font-mono text-[#4b5563] hover:text-[#6b7280] transition-colors mb-1"
                    >
                      <span className="text-[#3b82f6]">
                        {msg.thinkingOpen ? "▼" : "►"}
                      </span>
                      Agent thinking...
                    </button>
                    {msg.thinkingOpen && (
                      <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-lg px-4 py-3 mb-2">
                        <pre className="text-xs font-mono text-[#4b5563] leading-relaxed whitespace-pre-wrap">
                          {msg.thinking}
                        </pre>
                      </div>
                    )}
                  </div>
                )}

                {/* Message bubble */}
                <div
                  className={`px-4 py-3 rounded-xl text-sm leading-relaxed ${
                    msg.role === "agent"
                      ? "bg-[#111111] border border-[#222222] text-[#d1d5db]"
                      : "bg-[#3b82f6]/90 text-white"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>

                <p className="text-xs text-[#3b3b3b] px-1">
                  {msg.role === "agent" ? agentConfig.agentName : "You"}
                </p>
              </div>
            </div>
          ))}

          {/* Streaming state */}
          {isReplying && (
            <div className="flex justify-start animate-fade-in">
              <div className="max-w-[80%] space-y-2">
                {streamingThinking && (
                  <div>
                    <div className="flex items-center gap-2 text-xs font-mono text-[#4b5563] mb-1">
                      <span className="text-[#3b82f6] animate-pulse">►</span>
                      Agent thinking...
                    </div>
                    <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-lg px-4 py-3 mb-2">
                      <pre className="text-xs font-mono text-[#4b5563] leading-relaxed whitespace-pre-wrap">
                        {streamingThinking}
                        <span className="animate-pulse">▋</span>
                      </pre>
                    </div>
                  </div>
                )}
                {streamingReply ? (
                  <div className="bg-[#111111] border border-[#222222] rounded-xl px-4 py-3 text-sm text-[#d1d5db] leading-relaxed">
                    <p className="whitespace-pre-wrap">
                      {streamingReply}
                      <span className="animate-pulse">▋</span>
                    </p>
                  </div>
                ) : !streamingThinking ? (
                  <div className="bg-[#111111] border border-[#222222] rounded-xl px-4 py-3">
                    <div className="flex gap-1 items-center h-5">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#3b3b3b] animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-[#3b3b3b] animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-[#3b3b3b] animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div className="px-6 py-4 border-t border-[#1a1a1a] flex-shrink-0">
          <div className="flex gap-3 items-end">
            <textarea
              ref={inputRef}
              rows={1}
              placeholder="Simulate candidate reply... (Enter to send)"
              className="flex-1 bg-[#111111] border border-[#222222] rounded-xl px-4 py-3 text-sm text-[#ededed] placeholder-[#3b3b3b] focus:outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6] resize-none transition-all duration-200 min-h-[46px] max-h-32"
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
              className="px-4 py-3 bg-[#3b82f6] hover:bg-[#2563eb] disabled:bg-[#1a1a1a] disabled:text-[#3b3b3b] text-white rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap active:scale-[0.98]"
            >
              {isReplying ? "..." : "Send"}
            </button>
          </div>
          <p className="text-xs text-[#2a2a2a] mt-2 text-center">
            Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}
