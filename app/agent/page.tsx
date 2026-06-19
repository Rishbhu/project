"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Capability {
  name: string;
  label: string;
  description: string;
  color: string;
}

interface AgentConfig {
  agentName: string;
  personality: {
    traits: string[];
    style: string;
    avoid: string[];
  };
  reasoning: string;
  messages: Array<{ label: string; content: string }>;
  capabilities?: Capability[];
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

const capabilityColors: Record<string, { dot: string; border: string; bg: string; text: string }> = {
  violet: {
    dot: "bg-violet-400",
    border: "border-violet-500/20",
    bg: "bg-violet-500/5",
    text: "text-violet-400",
  },
  blue: {
    dot: "bg-blue-400",
    border: "border-blue-500/20",
    bg: "bg-blue-500/5",
    text: "text-blue-400",
  },
  emerald: {
    dot: "bg-emerald-400",
    border: "border-emerald-500/20",
    bg: "bg-emerald-500/5",
    text: "text-emerald-400",
  },
  amber: {
    dot: "bg-amber-400",
    border: "border-amber-500/20",
    bg: "bg-amber-500/5",
    text: "text-amber-400",
  },
};

const DEFAULT_CAPABILITIES: Capability[] = [
  {
    name: "analyze_candidate_signal",
    label: "Signal Analysis",
    description: "Interprets what each reply reveals — sentiment, intent, engagement score, and optimal response strategy.",
    color: "violet",
  },
  {
    name: "search_candidate_profile",
    label: "Profile Synthesis",
    description: "Builds a behavioral profile: motivators, objections, and what messaging will land vs. fall flat.",
    color: "blue",
  },
  {
    name: "get_role_market_insights",
    label: "Market Intelligence",
    description: "Fetches market data: compensation benchmarks, demand dynamics, and what candidates at this level optimize for.",
    color: "emerald",
  },
  {
    name: "get_company_talking_points",
    label: "Talking Points",
    description: "Generates non-generic talking points from real company context — mission, tech, culture, trajectory.",
    color: "amber",
  },
];

export default function AgentPage() {
  const router = useRouter();
  const [companyContext, setCompanyContext] = useState<CompanyContext | null>(null);
  const [agentConfig, setAgentConfig] = useState<AgentConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reasoningOpen, setReasoningOpen] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);

  useEffect(() => {
    const stored = localStorage.getItem("companyContext");
    if (!stored) {
      router.push("/");
      return;
    }
    const ctx: CompanyContext = JSON.parse(stored);
    setCompanyContext(ctx);

    const steps = [
      "Reading company context...",
      "Forming identity...",
      "Generating outreach sequence...",
    ];
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % steps.length;
      setLoadingStep(i);
    }, 1800);

    fetch("/api/configure", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ctx),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        clearInterval(interval);
        setAgentConfig(data);
        localStorage.setItem("agentConfig", JSON.stringify(data));
      })
      .catch((e) => {
        clearInterval(interval);
        setError(e.message);
      })
      .finally(() => setLoading(false));

    return () => clearInterval(interval);
  }, [router]);

  if (loading) {
    const steps = [
      "Reading company context...",
      "Forming identity...",
      "Generating outreach sequence...",
    ];
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-8">
          <div className="relative mx-auto w-20 h-20">
            <div className="absolute inset-0 rounded-full border border-[#222222]" />
            <div className="absolute inset-0 rounded-full border-t-2 border-[#3b82f6] animate-spin" />
            <div className="absolute inset-0 rounded-full border-b border-[#3b82f6]/20 animate-spin" style={{ animationDuration: "3s", animationDirection: "reverse" }} />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-mono text-[#3b82f6] transition-all">
              {steps[loadingStep]}
            </p>
            <p className="text-xs text-[#3b3b3b]">
              Agent configuring itself autonomously
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
            className="text-xs text-[#4b5563] hover:text-[#9ca3af] underline"
          >
            ← Back to setup
          </button>
        </div>
      </main>
    );
  }

  if (!agentConfig) return null;

  const capabilities = agentConfig.capabilities || DEFAULT_CAPABILITIES;

  return (
    <main className="min-h-screen px-4 py-12">
      <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
        {/* Nav */}
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => router.push("/")}
            className="text-xs text-[#3b3b3b] hover:text-[#6b7280] transition-colors"
          >
            ← Reconfigure
          </button>
          <span className="text-xs font-mono text-[#3b82f6]/60 uppercase tracking-widest">
            {companyContext?.companyName}
          </span>
        </div>

        {/* Agent Identity Card */}
        <div className="bg-[#111111] border border-[#1e1e1e] rounded-2xl p-6 space-y-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#3b82f6]/10 border border-[#3b82f6]/20 flex items-center justify-center">
                <span className="text-lg font-bold text-[#3b82f6]">
                  {agentConfig.agentName[0]}
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs text-emerald-400 font-mono uppercase tracking-wider">Active</span>
                </div>
                <h2 className="text-xl font-bold text-white">{agentConfig.agentName}</h2>
                <p className="text-xs text-[#4b5563]">Recruiting Agent · {companyContext?.companyName}</p>
              </div>
            </div>
            <span className="text-xs font-medium text-[#3b82f6] bg-[#3b82f6]/10 px-3 py-1.5 rounded-full border border-[#3b82f6]/20">
              {companyContext?.tone}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            <div>
              <p className="text-xs text-[#3b3b3b] uppercase tracking-wider mb-2">Traits</p>
              <div className="flex flex-wrap gap-1.5">
                {agentConfig.personality.traits.map((t, i) => (
                  <span
                    key={i}
                    className="text-xs px-2.5 py-1 bg-[#171717] border border-[#242424] rounded-full text-[#9ca3af]"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-[#3b3b3b] uppercase tracking-wider mb-2">Style</p>
              <p className="text-xs text-[#6b7280] leading-relaxed">{agentConfig.personality.style}</p>
            </div>
            <div>
              <p className="text-xs text-[#3b3b3b] uppercase tracking-wider mb-2">Avoids</p>
              <div className="space-y-1">
                {agentConfig.personality.avoid.map((a, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <span className="text-red-500/40 text-xs">×</span>
                    <span className="text-xs text-red-400/50">{a}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Capabilities */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-xs text-[#3b3b3b] uppercase tracking-wider">Agent capabilities</h3>
            <span className="text-xs font-mono text-[#2a2a2a]">— tools available at runtime</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {capabilities.map((cap) => {
              const colors = capabilityColors[cap.color] || capabilityColors.blue;
              return (
                <div
                  key={cap.name}
                  className={`${colors.bg} border ${colors.border} rounded-xl p-4`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                    <span className={`text-xs font-medium ${colors.text}`}>{cap.label}</span>
                  </div>
                  <p className="text-xs text-[#4b5563] leading-relaxed">{cap.description}</p>
                  <p className="text-xs font-mono text-[#2a2a2a] mt-2">{cap.name}()</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Reasoning Block */}
        <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-2xl overflow-hidden">
          <button
            onClick={() => setReasoningOpen(!reasoningOpen)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#111111] transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-[#3b82f6]/60">
                {reasoningOpen ? "▼" : "►"}
              </span>
              <span className="text-xs font-mono text-[#4b5563]">
                How I configured myself
              </span>
            </div>
            <span className="text-xs font-mono text-[#2a2a2a]">
              {reasoningOpen ? "collapse" : "expand"}
            </span>
          </button>
          {reasoningOpen && (
            <div className="px-5 pb-5 border-t border-[#161616]">
              <pre className="mt-4 text-xs font-mono text-[#4b5563] leading-relaxed whitespace-pre-wrap">
                {agentConfig.reasoning}
              </pre>
            </div>
          )}
        </div>

        {/* Message Sequence */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-xs text-[#3b3b3b] uppercase tracking-wider">Outreach sequence</h3>
            <span className="text-xs font-mono text-[#2a2a2a]">
              — {companyContext?.candidateProfile.jobTitle}
            </span>
          </div>

          <div className="space-y-3">
            {agentConfig.messages.map((msg, i) => (
              <div key={i} className="animate-fade-in" style={{ animationDelay: `${i * 0.12}s` }}>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xs font-mono text-[#3b82f6]/50 w-5">{String(i + 1).padStart(2, "0")}</span>
                  <span className="text-xs text-[#3b3b3b] uppercase tracking-wider">{msg.label}</span>
                  <div className="flex-1 h-px bg-[#1a1a1a]" />
                </div>
                <div className="ml-8 bg-[#111111] border border-[#1e1e1e] rounded-xl px-5 py-4 hover:border-[#272727] transition-colors">
                  <p className="text-sm text-[#c9d1d9] leading-relaxed whitespace-pre-wrap">
                    {msg.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="flex justify-end pt-2 pb-8">
          <button
            onClick={() => router.push("/sandbox")}
            className="group px-6 py-3 bg-[#3b82f6] hover:bg-[#2563eb] text-white font-semibold text-sm rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-[#3b82f6]/20 active:scale-[0.98] flex items-center gap-2"
          >
            Test this agent
            <span className="group-hover:translate-x-0.5 transition-transform">→</span>
          </button>
        </div>
      </div>
    </main>
  );
}
