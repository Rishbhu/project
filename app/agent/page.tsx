"use client";

import { useEffect, useState } from "react";
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

export default function AgentPage() {
  const router = useRouter();
  const [companyContext, setCompanyContext] = useState<CompanyContext | null>(
    null
  );
  const [agentConfig, setAgentConfig] = useState<AgentConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reasoningOpen, setReasoningOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("companyContext");
    if (!stored) {
      router.push("/");
      return;
    }
    const ctx: CompanyContext = JSON.parse(stored);
    setCompanyContext(ctx);

    fetch("/api/configure", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ctx),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setAgentConfig(data);
        localStorage.setItem("agentConfig", JSON.stringify(data));
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [router]);

  function handleTest() {
    router.push("/sandbox");
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="relative mx-auto w-16 h-16">
            <div className="absolute inset-0 rounded-full border-2 border-[#3b82f6]/20" />
            <div className="absolute inset-0 rounded-full border-t-2 border-[#3b82f6] animate-spin" />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-mono text-[#3b82f6]">
              Agent configuring itself...
            </p>
            <p className="text-xs text-[#4b5563]">
              Reading company context, choosing identity, generating outreach
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <p className="text-red-400 font-mono text-sm">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="text-xs text-[#6b7280] hover:text-[#9ca3af] underline"
          >
            ← Back to setup
          </button>
        </div>
      </main>
    );
  }

  if (!agentConfig) return null;

  return (
    <main className="min-h-screen px-4 py-16">
      <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
        {/* Nav */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push("/")}
            className="text-xs text-[#4b5563] hover:text-[#6b7280] transition-colors"
          >
            ← Reconfigure
          </button>
          <span className="text-xs font-mono text-[#3b82f6] uppercase tracking-widest">
            {companyContext?.companyName}
          </span>
        </div>

        {/* Agent Identity Card */}
        <div className="bg-[#111111] border border-[#222222] rounded-xl p-6">
          <div className="flex items-start justify-between mb-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-xs text-[#6b7280] font-mono uppercase tracking-wider">
                  Agent Active
                </span>
              </div>
              <h2 className="text-2xl font-bold text-white">
                {agentConfig.agentName}
              </h2>
            </div>
            <div className="text-right">
              <p className="text-xs text-[#4b5563] mb-1">Tone</p>
              <span className="text-xs font-medium text-[#3b82f6] bg-[#3b82f6]/10 px-2.5 py-1 rounded-full">
                {companyContext?.tone}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-xs text-[#4b5563] uppercase tracking-wider mb-2">
                Personality traits
              </p>
              <div className="flex flex-wrap gap-2">
                {agentConfig.personality.traits.map((t, i) => (
                  <span
                    key={i}
                    className="text-xs px-3 py-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-full text-[#9ca3af]"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs text-[#4b5563] uppercase tracking-wider mb-1">
                Communication style
              </p>
              <p className="text-sm text-[#9ca3af] leading-relaxed">
                {agentConfig.personality.style}
              </p>
            </div>

            <div>
              <p className="text-xs text-[#4b5563] uppercase tracking-wider mb-1">
                Avoids
              </p>
              <div className="flex flex-wrap gap-2">
                {agentConfig.personality.avoid.map((a, i) => (
                  <span
                    key={i}
                    className="text-xs px-3 py-1 bg-red-500/5 border border-red-500/15 rounded-full text-red-400/70"
                  >
                    {a}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Reasoning Block */}
        <div className="bg-[#0d0d0d] border border-[#222222] rounded-xl overflow-hidden">
          <button
            onClick={() => setReasoningOpen(!reasoningOpen)}
            className="w-full flex items-center justify-between px-6 py-4 hover:bg-[#111111] transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-[#3b82f6]">►</span>
              <span className="text-sm font-mono text-[#6b7280]">
                How I configured myself
              </span>
            </div>
            <span className="text-xs font-mono text-[#3b3b3b]">
              {reasoningOpen ? "[ collapse ]" : "[ expand ]"}
            </span>
          </button>
          {reasoningOpen && (
            <div className="px-6 pb-5 border-t border-[#1a1a1a]">
              <pre className="mt-4 text-xs font-mono text-[#6b7280] leading-relaxed whitespace-pre-wrap">
                {agentConfig.reasoning}
              </pre>
            </div>
          )}
        </div>

        {/* Message Sequence */}
        <div>
          <div className="flex items-center gap-2 mb-5">
            <h3 className="text-sm font-medium text-[#9ca3af]">
              Outreach sequence
            </h3>
            <span className="text-xs text-[#3b3b3b] font-mono">
              — generated for{" "}
              {companyContext?.candidateProfile.jobTitle}
            </span>
          </div>

          <div className="space-y-4">
            {agentConfig.messages.map((msg, i) => (
              <div key={i} className="animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-mono text-[#3b82f6]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-xs text-[#4b5563] uppercase tracking-wider">
                    {msg.label}
                  </span>
                </div>
                <div className="bg-[#111111] border border-[#222222] rounded-xl px-5 py-4 ml-6">
                  <p className="text-sm text-[#d1d5db] leading-relaxed whitespace-pre-wrap">
                    {msg.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Test Button */}
        <div className="flex justify-end pt-2">
          <button
            onClick={handleTest}
            className="px-6 py-3 bg-[#3b82f6] hover:bg-[#2563eb] text-white font-semibold text-sm rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-[#3b82f6]/20 active:scale-[0.99]"
          >
            Test this agent →
          </button>
        </div>
      </div>
    </main>
  );
}
