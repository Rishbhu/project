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

const capabilityColors: Record<string, { dot: string; border: string; bg: string; text: string; leftBorder: string }> = {
  violet: {
    dot: "bg-violet-400",
    border: "border-violet-500/20",
    bg: "bg-violet-500/5",
    text: "text-violet-400",
    leftBorder: "border-l-violet-500/50",
  },
  blue: {
    dot: "bg-blue-400",
    border: "border-blue-500/20",
    bg: "bg-blue-500/5",
    text: "text-blue-400",
    leftBorder: "border-l-blue-500/50",
  },
  emerald: {
    dot: "bg-emerald-400",
    border: "border-emerald-500/20",
    bg: "bg-emerald-500/5",
    text: "text-emerald-400",
    leftBorder: "border-l-emerald-500/50",
  },
  amber: {
    dot: "bg-amber-400",
    border: "border-amber-500/20",
    bg: "bg-amber-500/5",
    text: "text-amber-400",
    leftBorder: "border-l-amber-500/50",
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

const LOADING_STEPS = [
  "Reading company context...",
  "Forming identity...",
  "Building outreach sequence...",
];

export default function AgentPage() {
  const router = useRouter();
  const [companyContext, setCompanyContext] = useState<CompanyContext | null>(null);
  const [agentConfig, setAgentConfig] = useState<AgentConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loadingStep, setLoadingStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("companyContext");
    if (!stored) {
      router.push("/");
      return;
    }
    const ctx: CompanyContext = JSON.parse(stored);
    setCompanyContext(ctx);

    let stepIndex = 0;
    const interval = setInterval(() => {
      setCompletedSteps((prev) => [...prev, stepIndex]);
      stepIndex = stepIndex + 1;
      if (stepIndex < LOADING_STEPS.length) {
        setLoadingStep(stepIndex);
      }
    }, 1600);

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
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 bg-[#0d0d0d] border border-[#1c1c1c] rounded-full px-3 py-1.5 mb-6">
              <span className="text-[#3b82f6] text-xs">●</span>
              <span className="text-xs font-mono text-[#555555] tracking-widest uppercase">Agent initializing</span>
            </div>
            <p className="text-xs font-mono text-[#333333]">Autonomous configuration in progress</p>
          </div>

          <div className="bg-[#0a0a0a] border border-[#1c1c1c] rounded-xl p-5 font-mono">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#141414]">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
              </div>
              <span className="text-xs text-[#333333] ml-1">agent.init</span>
            </div>
            <div className="space-y-3">
              {LOADING_STEPS.map((step, i) => {
                const isDone = completedSteps.includes(i);
                const isCurrent = loadingStep === i && !isDone;
                const isPending = !isDone && !isCurrent;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-sm text-[#3b82f6]/60 w-4 flex-shrink-0">
                      {isDone ? "" : isCurrent ? ">" : " "}
                    </span>
                    <span className={`text-xs flex-1 ${isDone ? "text-[#444444]" : isCurrent ? "text-[#e0e0e0]" : "text-[#2a2a2a]"}`}>
                      {step}
                    </span>
                    {isDone && (
                      <span className="text-xs text-emerald-500 flex-shrink-0">✓</span>
                    )}
                    {isCurrent && (
                      <span className="cursor-blink flex-shrink-0" />
                    )}
                    {isPending && (
                      <span className="text-xs text-[#1c1c1c] flex-shrink-0">·</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <div className="bg-[#0d0d0d] border border-red-500/20 rounded-xl px-6 py-4">
            <p className="text-red-400 font-mono text-sm mb-1">error</p>
            <p className="text-xs text-[#555555] font-mono">{error}</p>
          </div>
          <button
            onClick={() => router.push("/")}
            className="text-xs font-mono text-[#444444] hover:text-[#888888] transition-colors"
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
    <main className="min-h-screen px-4 py-10">
      <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">

        {/* Top nav */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push("/")}
            className="text-xs font-mono text-[#444444] hover:text-[#888888] transition-colors"
          >
            ← Reconfigure
          </button>
          <span className="text-xs font-mono text-[#333333] uppercase tracking-widest">
            {companyContext?.companyName}
          </span>
        </div>

        {/* Agent Identity Card */}
        <div className="bg-[#0d0d0d] border border-[#1c1c1c] rounded-2xl p-6">
          <div className="flex items-start gap-5 mb-6">
            {/* Avatar */}
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 text-2xl font-bold text-white"
              style={{
                background: "linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)",
                boxShadow: "0 0 24px rgba(59,130,246,0.25)",
              }}
            >
              {agentConfig.agentName[0]}
            </div>
            {/* Name + status */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-mono text-emerald-500/70 uppercase tracking-wider">Active</span>
              </div>
              <h2 className="text-2xl font-bold text-white leading-tight">{agentConfig.agentName}</h2>
              <p className="text-xs text-[#555555] mt-0.5">
                Autonomous Recruiting Agent · {companyContext?.companyName}
              </p>
              {/* Trait pills */}
              <div className="flex flex-wrap gap-1.5 mt-3">
                {agentConfig.personality.traits.map((t, i) => (
                  <span
                    key={i}
                    className="text-xs px-2.5 py-1 bg-[#141414] border border-[#1e1e1e] rounded-full text-[#888888] font-mono"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
            {/* Tone badge */}
            <span className="text-xs font-mono text-[#3b82f6] bg-[#3b82f6]/10 px-3 py-1.5 rounded-full border border-[#3b82f6]/20 flex-shrink-0">
              {companyContext?.tone}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-[#141414]">
            <div>
              <p className="text-[10px] font-mono text-[#444444] uppercase tracking-widest mb-2">Style</p>
              <p className="text-sm text-[#888888] leading-relaxed">{agentConfig.personality.style}</p>
            </div>
            <div>
              <p className="text-[10px] font-mono text-[#444444] uppercase tracking-widest mb-2">Avoid list</p>
              <div className="space-y-1.5">
                {agentConfig.personality.avoid.map((a, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-red-500/50 text-xs mt-0.5 flex-shrink-0">—</span>
                    <span className="text-xs text-red-400/50 leading-relaxed">{a}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* How I decided this — always visible */}
        <div>
          <p className="text-[10px] font-mono text-[#444444] uppercase tracking-widest mb-3">
            How I decided this
          </p>
          <div
            className="rounded-xl border border-[#1c1c1c] p-5 overflow-x-auto"
            style={{ background: "#0a0a0a" }}
          >
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#141414]">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
              </div>
              <span className="text-xs font-mono text-[#333333] ml-1">agent.reasoning</span>
            </div>
            <pre className="text-xs font-mono text-[#555555] leading-relaxed whitespace-pre-wrap">
              {agentConfig.reasoning}
            </pre>
          </div>
        </div>

        {/* Capabilities — 2×2 grid */}
        <div>
          <p className="text-[10px] font-mono text-[#444444] uppercase tracking-widest mb-3">
            Capabilities — tools available at runtime
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {capabilities.map((cap) => {
              const colors = capabilityColors[cap.color] || capabilityColors.blue;
              return (
                <div
                  key={cap.name}
                  className={`${colors.bg} border ${colors.border} border-l-2 ${colors.leftBorder} rounded-lg p-3.5`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${colors.dot} flex-shrink-0`} />
                    <span className={`text-xs font-semibold ${colors.text}`}>{cap.label}</span>
                  </div>
                  <p className="text-xs text-[#555555] leading-relaxed mb-1.5">{cap.description}</p>
                  <p className="text-[10px] font-mono text-[#2a2a2a]">{cap.name}()</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Outreach Sequence */}
        <div>
          <p className="text-[10px] font-mono text-[#444444] uppercase tracking-widest mb-4">
            Outreach Sequence — Generated for {companyContext?.candidateProfile.jobTitle}
          </p>
          <div className="space-y-4">
            {agentConfig.messages.map((msg, i) => (
              <div key={i} className="animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xs font-mono text-[#3b82f6] tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-[10px] font-mono text-[#444444] uppercase tracking-widest">{msg.label}</span>
                  <div className="flex-1 h-px bg-[#141414]" />
                </div>
                <div
                  className="bg-[#0d0d0d] border border-[#1c1c1c] border-l-2 border-l-[#3b82f6]/30 rounded-lg px-5 py-4 hover:border-[#2a2a2a] transition-colors"
                >
                  <p className="text-sm text-[#c0c0c0] leading-relaxed whitespace-pre-wrap">
                    {msg.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="flex justify-end pt-2 pb-10">
          <button
            onClick={() => router.push("/sandbox")}
            className="group px-6 py-3 bg-[#3b82f6] hover:bg-[#2563eb] text-white font-semibold text-sm rounded-xl transition-all duration-150 hover:shadow-lg hover:shadow-[#3b82f6]/20 active:scale-[0.98] flex items-center gap-2"
          >
            Test this agent
            <span className="group-hover:translate-x-0.5 transition-transform">→</span>
          </button>
        </div>
      </div>
    </main>
  );
}
